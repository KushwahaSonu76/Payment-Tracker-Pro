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
    <form onSubmit={handleSubmit} className="bg-gray-800/80 border border-gray-700 p-8 rounded-2xl shadow-2xl backdrop-blur-sm mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Send Payments</h2>
      
      <div className="space-y-4">
        {payments.map((p, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Recipient Public Key</label>
              <input
                type="text"
                required
                value={p.recipient}
                onChange={(e) => updatePayment(i, 'recipient', e.target.value)}
                placeholder="G..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount (XLM)</label>
              <input
                type="number"
                required
                step="0.0000001"
                min="0.0000001"
                value={p.amount}
                onChange={(e) => updatePayment(i, 'amount', e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() => removeRecipient(i)}
                className="mt-7 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={addRecipient}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Recipient
        </button>

        <button
          type="submit"
          disabled={!publicKey || isProcessing}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Send Payments'}
        </button>
      </div>
    </form>
  );
}
