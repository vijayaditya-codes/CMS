'use client';

import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isLoading } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-955 z-0 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Verifying authorization session...</p>
      </div>
    </div>
  );
}
