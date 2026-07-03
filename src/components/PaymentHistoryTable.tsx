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
    <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-xl shadow-lg mt-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Payment History
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh History"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </h3>
        <span className="text-sm font-medium bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
          {payments.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-sm">
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No payments found for this account.
                </td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">
                    {p.recipient.slice(0, 4)}...{p.recipient.slice(-4)}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {Number(p.amount) / 10000000} XLM
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
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
