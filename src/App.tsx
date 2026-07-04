import { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletSelector } from './components/WalletSelector';
import { SendPaymentForm } from './components/SendPaymentForm';
import { PaymentHistoryTable } from './components/PaymentHistoryTable';
import { TxStatusTracker, type TxState } from './components/TxStatusTracker';
import { ErrorBanner } from './components/ErrorBanner';
import { ActivityFeed } from './components/ActivityFeed';
import { kit } from './lib/wallet';
import { simulateTransaction, pollTransactionStatus, getAllPayments } from './lib/soroban';
import { buildPaymentTransaction, submitPaymentTransaction, networkPassphrase } from './lib/stellar';
import { Box, Wallet, Activity } from 'lucide-react';
import './index.css';

function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [txState, setTxState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = async () => {
    if (!publicKey) return;
    setIsLoadingHistory(true);
    try {
      const p = await getAllPayments(publicKey);
      setPayments(p.reverse()); // Show newest first
    } catch (err: any) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (publicKey) loadHistory();
  }, [publicKey]);

  const handleSendPayments = async (inputs: { recipient: string; amount: string }[]) => {
    if (!publicKey) return;
    
    setError(null);
    setTxHash(null);

    for (const input of inputs) {
      try {
        setTxState('recording');
        
        // Step 1: Record payment in contract (pending)
        const amountStroops = Math.round(Number(input.amount) * 10000000).toString();
        
        const recordArgs = [
          new StellarSdk.Address(publicKey).toScVal(),
          new StellarSdk.Address(input.recipient).toScVal(),
          StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
            hi: StellarSdk.xdr.Int64.fromString("0"),
            lo: StellarSdk.xdr.Uint64.fromString(amountStroops)
          }))
        ];

        setTxState('simulating');
        const recordTx = await simulateTransaction(publicKey, "record_payment", recordArgs);
        
        setTxState('signing');
        const { signedTxXdr: recordSignedXdr } = await kit.signTransaction(recordTx.toXDR(), {
          networkPassphrase
        });
        
        setTxState('submitting');
        const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
        const recordSubmitResp = await server.sendTransaction(new StellarSdk.Transaction(recordSignedXdr, networkPassphrase));
        if (recordSubmitResp.status === 'ERROR') {
          throw new Error("Contract execution error: Submit failed.");
        }
        
        setTxState('confirming');
        const recordStatus = await pollTransactionStatus(recordSubmitResp.hash);
        if (recordStatus.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
          throw new Error("Contract execution error: Recording failed.");
        }
        
        // Extract payment ID from the result
        let paymentId: number | null = null;
        if (recordStatus.returnValue) {
          const resultVal = recordStatus.returnValue;
          if (resultVal.switch() === StellarSdk.xdr.ScValType.scvU32()) {
            paymentId = resultVal.u32();
          }
        }
        if (paymentId === null) {
           throw new Error("Contract execution error: Failed to get payment ID.");
        }

        // Step 2: Real XLM Transfer
        setTxState('sending_xlm');
        const paymentTx = await buildPaymentTransaction(publicKey, input.recipient, input.amount);
        setTxState('signing');
        const { signedTxXdr: paymentSignedXdr } = await kit.signTransaction(paymentTx.toXDR(), { networkPassphrase });
        setTxState('submitting');
        
        let xlmsuccess = false;
        try {
          const paymentResp = await submitPaymentTransaction(paymentSignedXdr);
          if (paymentResp.successful) xlmsuccess = true;
          setTxHash(paymentResp.hash);
        } catch (e: any) {
          xlmsuccess = false;
          console.error(e);
        }

        // Step 3: Update contract status
        setTxState('recording');
        const updateArgs = [
          StellarSdk.xdr.ScVal.scvU32(paymentId),
          StellarSdk.xdr.ScVal.scvSymbol(xlmsuccess ? "success" : "failed")
        ];
        
        setTxState('simulating');
        const updateTx = await simulateTransaction(publicKey, "update_status", updateArgs);
        setTxState('signing');
        const { signedTxXdr: updateSignedXdr } = await kit.signTransaction(updateTx.toXDR(), { networkPassphrase });
        setTxState('submitting');
        const updateSubmitResp = await server.sendTransaction(new StellarSdk.Transaction(updateSignedXdr, networkPassphrase));
        setTxState('confirming');
        await pollTransactionStatus(updateSubmitResp.hash);

        if (xlmsuccess) {
          setTxState('success');
        } else {
          setError("Insufficient balance / contract execution error (e.g. op_underfunded)");
          setTxState('error');
        }
        
        await loadHistory();
      } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes("User declined") || err.message.includes("reject")) {
          setError("Transaction was rejected in the wallet.");
        } else {
          setError("Insufficient balance / contract execution error");
        }
        setTxState('error');
        await loadHistory();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans overflow-hidden relative selection:bg-indigo-500/30">
      {/* Deep Space Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none"></div>

      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-bold text-xl text-white">PT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Payment Tracker Pro</h1>
              <p className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Stellar Testnet</p>
            </div>
          </div>
          <WalletSelector onConnect={setPublicKey} onError={setError} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <ErrorBanner error={error} onClose={() => setError(null)} />

        {publicKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left: Architecture (Floating Nodes) */}
            <div className="flex flex-col gap-8 items-center lg:items-start animate-float-6">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4 tracking-widest uppercase">
                Architecture
              </h2>
              <div className="flex flex-col gap-6 relative">
                {/* Connection Line */}
                <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 to-purple-500/50 blur-[1px]"></div>
                
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl backdrop-blur-md relative z-10 w-52 shadow-lg hover:bg-white/[0.05] transition-all">
                  <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Frontend</span>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl backdrop-blur-md relative z-10 w-52 shadow-lg hover:bg-white/[0.05] transition-all">
                  <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Wallet Kit</span>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl backdrop-blur-md relative z-10 w-52 shadow-lg hover:bg-white/[0.05] transition-all">
                  <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">payment_tracker</span>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl backdrop-blur-md relative z-10 w-52 shadow-lg hover:bg-white/[0.05] transition-all">
                  <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">fee_registry</span>
                </div>
              </div>
            </div>

            {/* Center: Main Payment Glass Shard */}
            <div className="col-span-1 relative z-20 flex flex-col gap-6 items-center animate-float-8-reverse">
              <SendPaymentForm publicKey={publicKey} txState={txState} onSubmit={handleSendPayments} />
              <TxStatusTracker state={txState} hash={txHash} />
            </div>

            {/* Right: Live Activity Feed (Drifting Cards) */}
            <div className="col-span-1 animate-float-7">
              <ActivityFeed />
            </div>

            {/* Bottom: Payment History Table */}
            <div className="col-span-1 lg:col-span-3">
              <PaymentHistoryTable payments={payments} onRefresh={loadHistory} isLoading={isLoadingHistory} />
            </div>
          </div>
        ) : (
          <div className="text-center py-32 flex flex-col items-center justify-center relative">
            <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-float-8 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full blur opacity-30 animate-pulse"></div>
              <Wallet className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
              CONNECT WALLET TO START
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
              Securely track and send XLM payments on the Stellar Testnet with on-chain Soroban receipts, real-time activity event feeds, and automated registry calculations.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

