import { Tooltip } from './Tooltip';
import React from 'react';
import { kit } from '../lib/wallet';

interface Props {
  publicKey: string | null;
  setPublicKey: (key: string | null) => void;
  setError: (err: string | null) => void;
}

export function WalletSelector({ publicKey, setPublicKey, setError }: Props) {
  const handleConnect = async () => {
    try {
      setError(null);
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          setPublicKey(address);
        }
      });
    } catch (error: any) {
      setError(error?.message || "Wallet not found / not installed or connection failed");
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
  };

  return (
    <div className="flex justify-end p-4">
      {publicKey ? (
        <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg shadow-md border border-gray-700">
          <span className="text-sm font-mono text-gray-300">
            <button onClick={() => navigator.clipboard.writeText(publicKey || '')} className="hover:text-white transition-colors"><Tooltip text="Click to copy public key">{publicKey.slice(0, 6)}...{publicKey.slice(-4)}</Tooltip></button>
          </span>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors font-semibold"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-all shadow-lg hover:shadow-indigo-500/50"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
