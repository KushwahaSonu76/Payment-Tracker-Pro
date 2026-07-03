import { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletSelector } from './components/WalletSelector';
import { SendPaymentForm } from './components/SendPaymentForm';
import { PaymentHistoryTable } from './components/PaymentHistoryTable';
import { TxStatusTracker, type TxState } from './components/TxStatusTracker';
import { ErrorBanner } from './components/ErrorBanner';
import { kit } from './lib/wallet';
import { simulateTransaction, pollTransactionStatus, getAllPayments } from './lib/soroban';
import { buildPaymentTransaction, submitPaymentTransaction, networkPassphrase } from './lib/stellar';
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
        if (recordStatus.resultMetaXdr) {
          const meta = recordStatus.resultMetaXdr as any;
          const resultVal = meta.v3().sorobanMeta()?.returnValue();
          if (resultVal && resultVal.switch() === StellarSdk.xdr.ScValType.scvU32()) {
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
          // Actual horizon error (e.g., underfunded)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white selection:bg-indigo-500/30">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-xl">PT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Payment Tracker</h1>
              <p className="text-indigo-400 font-medium text-xs uppercase tracking-wider">Testnet Edition</p>
            </div>
          </div>
          <WalletSelector onConnect={setPublicKey} onError={setError} />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <ErrorBanner error={error} onClose={() => setError(null)} />

        {publicKey ? (
          <>
            <SendPaymentForm publicKey={publicKey} txState={txState} onSubmit={handleSendPayments} />
            <TxStatusTracker state={txState} hash={txHash} />
            <PaymentHistoryTable payments={payments} onRefresh={loadHistory} isLoading={isLoadingHistory} />
          </>
        ) : (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect Wallet to Start</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Securely track and send XLM payments on the Stellar Testnet with on-chain Soroban receipts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
