'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { setUser, switchRole } from '@/store/slices/authSlice';
import { ReduxProvider } from '@/store/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Lock,
  Mail,
  Shield,
  User,
  ArrowRight,
  CheckCircle2,
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
    <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur space-y-6">
      {/* Brand Icon */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold text-xl">
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
          <label className="text-xs font-medium text-slate-300">Email Address</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@datascope.io"
            icon={<Mail className="h-4 w-4" />}
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
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full text-xs font-semibold shadow-md shadow-blue-600/20"
        >
          Sign In with Credentials
        </Button>
      </form>

      {/* One-Click Persona Test Switcher */}
      <div className="pt-4 border-t border-slate-800 space-y-2.5">
        <span className="text-[11px] font-mono uppercase text-slate-400 block text-center font-semibold">
          Evaluator Quick Demo Logins
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickLogin('admin')}
            className="p-2 rounded-lg border border-purple-500/30 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 text-xs font-medium transition-colors flex flex-col items-center gap-1"
          >
            <Shield className="h-4 w-4 text-purple-400" />
            <span>Admin</span>
          </button>

          <button
            onClick={() => handleQuickLogin('analyst')}
            className="p-2 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-200 hover:bg-blue-900/40 text-xs font-medium transition-colors flex flex-col items-center gap-1"
          >
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Analyst</span>
          </button>

          <button
            onClick={() => handleQuickLogin('viewer')}
            className="p-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40 text-xs font-medium transition-colors flex flex-col items-center gap-1"
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

