import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: string | null;
}

export function ErrorBanner({ error }: Props) {
  if (!error) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3 my-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm font-medium">{error}</p>
    </div>
  );
}
