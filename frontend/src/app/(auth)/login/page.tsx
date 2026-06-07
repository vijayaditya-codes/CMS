'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { GraduationCap, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-slate-950 z-0" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl z-10 transform transition-all duration-300 hover:border-slate-700/50">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AuraCMS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Course & Learner Management
          </p>
        </div>

        {/* Info Box with test accounts */}
        <div className="mb-6 bg-slate-950/80 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-400">
          <div className="font-semibold text-slate-300 mb-1">Demo Credentials:</div>
          <div className="flex justify-between">
            <span>Admin: <code className="text-indigo-400">admin@cms.com</code></span>
            <span>Pass: <code className="text-indigo-400">Password123</code></span>
          </div>
          <div className="flex justify-between mt-0.5">
            <span>Instructor: <code className="text-indigo-400">instructor@cms.com</code></span>
            <span>Pass: <code className="text-indigo-400">Password123</code></span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3.5 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-medium py-2.5 rounded-lg text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-8">
          Authorized personnel access only. Actions may be audited.
        </p>

      </div>
    </div>
  );
}
