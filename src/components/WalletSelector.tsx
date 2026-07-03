import { useState } from 'react';
import { kit } from '../lib/wallet';

interface Props {
  onConnect: (publicKey: string) => void;
  onError: (error: string) => void;
}

export function WalletSelector({ onConnect, onError }: Props) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      const { address } = await kit.authModal();
      setPublicKey(address);
      onConnect(address);
    } catch (e: any) {
      console.error(e);
      onError("Wallet not found / not installed or connection failed");
    }
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-3 bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono text-sm text-gray-300">
          {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
    >
      Connect Wallet
    </button>
  );
}
