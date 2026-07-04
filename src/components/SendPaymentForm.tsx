import { useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Plus, Trash2, Send } from 'lucide-react';
import type { TxState } from './TxStatusTracker';

interface PaymentInput {
  recipient: string;
  amount: string;
}

interface Props {
  publicKey: string | null;
  txState: TxState;
  onSubmit: (payments: PaymentInput[]) => Promise<void>;
}

export function SendPaymentForm({ publicKey, txState, onSubmit }: Props) {
  const [payments, setPayments] = useState<PaymentInput[]>([{ recipient: '', amount: '' }]);

  const addRecipient = () => {
    setPayments([...payments, { recipient: '', amount: '' }]);
  };

  const removeRecipient = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof PaymentInput, value: string) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    
    // Validation
    for (const p of payments) {
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(p.recipient)) {
        alert(`Invalid recipient public key: ${p.recipient}`);
        return;
      }
      if (isNaN(Number(p.amount)) || Number(p.amount) <= 0) {
        alert(`Invalid amount for recipient: ${p.recipient}`);
        return;
      }
    }

    onSubmit(payments);
  };

  const isProcessing = txState !== 'idle' && txState !== 'success' && txState !== 'error';

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.15)] w-full max-w-md relative overflow-hidden">
      {/* Inner Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
      
      <h2 className="text-2xl font-bold mb-8 text-center text-white tracking-wide">
        Payment Input
      </h2>
      
      <div className="space-y-6 max-h-[300px] overflow-y-auto pr-1">
        {payments.map((p, i) => (
          <div key={i} className="space-y-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-blue-200/50 uppercase tracking-widest">Recipient #{i + 1}</span>
              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRecipient(i)}
                  className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-blue-200/70 uppercase tracking-wider pl-1 font-semibold">Recipient Address</label>
              <input
                type="text"
                required
                value={p.recipient}
                onChange={(e) => updatePayment(i, 'recipient', e.target.value)}
                placeholder="G..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-blue-200/70 uppercase tracking-wider pl-1 font-semibold">Amount (XLM)</label>
              <input
                type="number"
                required
                step="0.0000001"
                min="0.0000001"
                value={p.amount}
                onChange={(e) => updatePayment(i, 'amount', e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <button
          type="button"
          onClick={addRecipient}
          className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm py-2 border border-dashed border-blue-500/30 rounded-xl bg-blue-500/5 hover:bg-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Recipient
        </button>

        <button 
          type="submit" 
          disabled={!publicKey || isProcessing} 
          className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center justify-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl text-white font-medium hover:bg-black/20 transition-all">
            <Send size={18} className="text-blue-400 group-hover:text-white transition-colors animate-pulse" />
            <span>{isProcessing ? 'Processing...' : 'Send Transaction'}</span>
          </div>
        </button>
      </div>
    </form>
  );
}

