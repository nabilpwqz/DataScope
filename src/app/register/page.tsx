'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { ReduxProvider } from '@/store/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataScopeLogo } from '@/components/brand/logo';
import {
  IconLock,
  IconMail,
  IconUser,
  IconSparkles,
  IconLayers,
  IconFlame,
} from '@/components/ui/icons';
import { loginWithFirebaseGoogle } from '@/lib/firebase';

function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Strategic Intelligence');
  const [role, setRole] = useState<'analyst' | 'viewer'>('analyst');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      dispatch(setUser({ user: data.user, token: data.token }));
      router.push('/dashboard/explorer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const cred = await loginWithFirebaseGoogle();
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          idToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google registration synchronization failed');
      }

      dispatch(setUser({ user: data.user, token: data.token }));
      router.push('/dashboard/explorer');
    } catch (err: any) {
      let msg = err.message || 'Google registration failed';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Google authentication popup was closed.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
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
            Create DataScope Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register to explore, search, and analyze indexed enterprise datasets.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/40 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Google Quick Signup */}
      <Button
        type="button"
        variant="outline"
        size="md"
        isLoading={isLoading}
        onClick={handleGoogleSignup}
        className="w-full justify-center gap-2 border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Sign up with Google</span>
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-800" />
        <span className="bg-slate-900 px-2 text-xs text-slate-500">
          or register with work email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Full Name</label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            icon={<IconUser className="h-4 w-4" />}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Work Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@datascope.io"
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
            placeholder="Minimum 6 characters"
            icon={<IconLock className="h-4 w-4" />}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Department</label>
          <Input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Strategic Intelligence"
            icon={<IconLayers className="h-4 w-4" />}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Account Access Role</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('analyst')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                role === 'analyst'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <IconSparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Data Analyst</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Explore, query, save views, and export.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                role === 'viewer'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <IconUser className="h-3.5 w-3.5 text-blue-400" />
                <span>Viewer</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Read-only discovery on authorized sets.
              </span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 mt-2"
        >
          Create Enterprise Account
        </Button>
      </form>

      {/* Footer navigation */}
      <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
        Already have an enterprise account?{' '}
        <Link
          href="/login"
          className="text-emerald-400 hover:text-emerald-300 font-medium focus-visible:outline-none focus-visible:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ReduxProvider>
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 selection:bg-emerald-600 selection:text-white">
        <RegisterForm />
      </main>
    </ReduxProvider>
  );
}

