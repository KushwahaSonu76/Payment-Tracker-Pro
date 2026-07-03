import { AlertTriangle, X } from 'lucide-react';

interface Props {
  error: string | null;
  onClose: () => void;
}

export function ErrorBanner({ error, onClose }: Props) {
  if (!error) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center justify-between gap-3 my-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
      <button onClick={onClose} className="text-red-400 hover:text-red-300">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
