import { RotateCw } from 'lucide-react';

interface PaymentRecord {
  sender: string;
  recipient: string;
  amount: string;
  status: string;
  timestamp: number;
}

interface Props {
  payments: PaymentRecord[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function PaymentHistoryTable({ payments, onRefresh, isLoading }: Props) {
  return (
    <div className="backdrop-blur-md bg-white/[0.01] border border-white/5 p-6 rounded-3xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
          Payment History
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh History"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </h3>
        <span className="text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full">
          {payments.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Recipient</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Status</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Time</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                  No payments found for this account.
                </td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono text-sm text-slate-300">
                    {p.recipient.slice(0, 6)}...{p.recipient.slice(-6)}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {(Number(p.amount) / 10000000).toFixed(2)} XLM
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                      p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      p.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {new Date(p.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

