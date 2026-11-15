'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { setUser, switchRole } from '@/store/slices/authSlice';
import { ReduxProvider } from '@/store/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataScopeLogo } from '@/components/brand/logo';
import {
  IconLock,
  IconMail,
  IconShield,
  IconUser,
  IconSparkles,
} from '@/components/ui/icons';

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
      {/* Brand Icon & Heading */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Link
          href="/"
          className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1"
          title="DataScope Home"
        >
          <DataScopeLogo size="lg" showText={false} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sign In to DataScope
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your credentials to access enterprise datasets and analytics.
          </p>
        </div>
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
            icon={<IconMail className="h-4 w-4" />}
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
            icon={<IconLock className="h-4 w-4" />}
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
        <span className="text-xs font-semibold text-slate-400 block text-center">
          Instant Role Evaluation
        </span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin('admin')}
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconShield className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Admin</span>
            <span className="text-[10px] text-slate-400">Full control</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin('analyst')}
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconSparkles className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Analyst</span>
            <span className="text-[10px] text-slate-400">Explore &amp; save</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin('viewer')}
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconUser className="h-4 w-4 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Viewer</span>
            <span className="text-[10px] text-slate-400">Read only</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ReduxProvider>
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 selection:bg-emerald-600 selection:text-white">
        <LoginForm />
      </main>
    </ReduxProvider>
  );
}
