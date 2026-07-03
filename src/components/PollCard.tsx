import React, { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { contractId, rpcUrl, networkPassphrase, server, fetchResults, pollTransactionStatus } from '../lib/soroban';
import { kit } from '../lib/wallet';
import { TxStatusTracker, TxState } from './TxStatusTracker';
import { ResultsDisplay } from './ResultsDisplay';

interface Props {
  publicKey: string | null;
  setError: (err: string | null) => void;
}

import { PollOption } from '../lib/types';

const POLL_OPTIONS: PollOption[] = [
  { id: 1, text: "Rust" },
  { id: 2, text: "TypeScript" },
  { id: 3, text: "Go" },
  { id: 4, text: "Python" }
];

export function PollCard({ publicKey, setError }: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, number>>({});
  
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  
  const loadResults = async () => {
    setIsFetchLoading(true);
    try {
      const res = await fetchResults();
      setResults(res);
    } catch (err: any) {
      console.error("Failed to fetch results", err);
    } finally {
      setIsFetchLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // Poll results every 10 seconds to show live updates
    const interval = setInterval(loadResults, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first.");
      return;
    }
    if (selectedOption === null) {
      setError("Please select an option.");
      return;
    }

    try {
      setError(null);
      setTxState("simulating");
      setTxHash(null);

      // 1. Build and Simulate
      const contract = new StellarSdk.Contract(contractId);
      
      // Fetch the real account details to get the current sequence number for the transaction
      const sourceAccount = await server.getAccount(publicKey).catch(() => null);
      if (!sourceAccount) {
        throw new Error("Account not found on testnet. Please fund it first.");
      }
      
      // Build the transaction to call the "vote" function with the selected option
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "1000",
        networkPassphrase,
      })
      .addOperation(contract.call("vote", new StellarSdk.xdr.ScVal.scvU32(selectedOption)))
      .setTimeout(30)
      .build();

      // Simulate the transaction to estimate fees and state changes (mandatory in Soroban)
      const simResponse = await server.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationError(simResponse)) {
        throw new Error(`Simulation failed: ${simResponse.error}`);
      }

      // Assemble transaction with simulation data (adds auth footprints and real fees)
      const assembledTx = StellarSdk.assembleTransaction(tx, simResponse).build();

      // 2. Sign via wallet (StellarWalletsKit)
      setTxState("signing");
      const signedXdr = await kit.signTransaction(assembledTx.toXDR());
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase) as StellarSdk.Transaction;

      // 3. Submit to the Soroban RPC server
      setTxState("submitting");
      const submitResponse = await server.sendTransaction(signedTx);
      
      if (submitResponse.status === "ERROR") {
        throw new Error(`Submit error: ${JSON.stringify(submitResponse.errorResultXdr)}`);
      }

      // 4. Poll status
      setTxState("pending");
      const hash = submitResponse.hash;
      setTxHash(hash);
      
      const pollResponse = await pollTransactionStatus(hash);
      
      if (pollResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        setTxState("success");
        await loadResults();
      } else {
        throw new Error("Transaction failed during execution.");
      }

    } catch (err: any) {
      console.error(err);
      setTxState("error");
      
      // Handle the 3 required error types
      if (err.message?.includes("Account not found")) {
         setError(err.message);
      } else if (err?.message?.includes("User declined") || err?.message?.includes("rejected")) {
         setError("Transaction was rejected in the wallet.");
      } else if (err?.message?.includes("Simulation failed") || err?.message?.includes("Submit error")) {
         setError(`Contract execution error: ${err.message}`);
      } else {
         setError(err?.message || "An unknown error occurred.");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800/80 border border-gray-700 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
          What is your favorite programming language for smart contracts?
        </h2>
        <p className="text-gray-400 mb-8">Vote using your Stellar Testnet wallet.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {POLL_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden group ${
                selectedOption === option.id 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between z-10 relative">
                <span className={`font-semibold ${selectedOption === option.id ? 'text-indigo-300' : 'text-gray-300'}`}>
                  {option.text}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === option.id ? 'border-indigo-500' : 'border-gray-600'
                }`}>
                  {selectedOption === option.id && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleVote}
          disabled={!selectedOption || txState === 'simulating' || txState === 'signing' || txState === 'submitting' || txState === 'pending'}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {txState === 'idle' || txState === 'success' || txState === 'error' ? 'Submit Vote' : 'Processing...'}
        </button>
      </div>

      <TxStatusTracker state={txState} hash={txHash} />
      
      <ResultsDisplay results={results} options={POLL_OPTIONS} onRefresh={loadResults} isLoading={isFetchLoading} />
    </div>
  );
}
