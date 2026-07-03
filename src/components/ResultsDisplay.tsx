import { PollOption } from '../lib/types';
import { RotateCw } from 'lucide-react';

interface Props {
  results: Record<number, number>;
  options: PollOption[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function ResultsDisplay({ results, options, onRefresh, isLoading }: Props) {
  const totalVotes = options.reduce((acc, opt) => acc + (results[opt.id] || 0), 0);

  return (
    <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-xl shadow-lg mt-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Live Results</span>
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Results"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <span className="text-sm font-medium bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
          {totalVotes} total votes
        </span>
      </h3>
      
      <div className="space-y-4">
        {options.map((option) => {
          const count = results[option.id] || 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          
          return (
            <div key={option.id} className="relative">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-200">{option.text}</span>
                <span className="font-mono text-gray-400">{count} votes ({percentage}%)</span>
              </div>
              <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
