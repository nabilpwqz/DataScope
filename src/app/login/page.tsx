'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setUser, switchRole } from '@/store/slices/authSlice';
import { ReduxProvider } from '@/store/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap,
  Lock,
  Mail,
  Shield,
  User,
  Sparkles,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('admin@datascope.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      dispatch(setUser({ user: data.user, token: data.token }));
      router.push('/dashboard/explorer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'analyst' | 'viewer') => {
    dispatch(switchRole(role));
    router.push('/dashboard/explorer');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
      {/* Brand Icon */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Sign In to DataScope
        </h1>
        <p className="text-xs text-slate-400">
          Enter your credentials to access enterprise datasets &amp; analytics.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/40 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Email address</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@datascope.io"
            icon={<Mail className="h-4 w-4" />}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Password</label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Sign in with credentials
        </Button>
      </form>

      {/* One-Click Persona Test Switcher */}
      <div className="pt-4 border-t border-slate-800 space-y-2.5">
        <span className="text-xs text-slate-400 block text-center font-medium">
          Evaluator demo accounts
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin')}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-500 hover:text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex flex-col items-center gap-1"
          >
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('analyst')}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-500 hover:text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex flex-col items-center gap-1"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Analyst</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('viewer')}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-500 hover:text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex flex-col items-center gap-1"
          >
            <User className="h-4 w-4 text-emerald-400" />
            <span>Viewer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ReduxProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <LoginForm />
      </div>
    </ReduxProvider>
  );
}
