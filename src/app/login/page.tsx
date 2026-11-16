'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
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
  IconFlame,
} from '@/components/ui/icons';
import {
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  loginWithFirebaseGoogle,
} from '@/lib/firebase';

type AuthMethod = 'credentials' | 'firebase';

function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('credentials');
  const [email, setEmail] = useState('admin@datascope.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCredentialsLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      // 1. Authenticate against database auth API and obtain JWT session token
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Update Redux state with verified user profile & token
      dispatch(setUser({ user: data.user, token: data.token }));

      // 2. Synchronize NextAuth session in background without blocking redirect
      signIn('credentials', {
        redirect: false,
        email: targetEmail,
        password: targetPass,
      }).catch((nextAuthErr) => {
        console.warn('NextAuth background sync notice:', nextAuthErr);
      });

      router.push('/dashboard/explorer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseEmailAuth = async (isRegister: boolean = false) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cred = isRegister
        ? await registerWithFirebaseEmail(email, password)
        : await loginWithFirebaseEmail(email, password);

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
        throw new Error(data.error || 'Firebase session synchronization failed');
      }

      dispatch(setUser({ user: data.user, token: data.token }));
      router.push('/dashboard/explorer');
    } catch (err: any) {
      let msg = err.message || 'Firebase authentication failed';
      if (err.code === 'auth/invalid-credential') msg = 'Invalid Firebase email or password.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered in Firebase.';
      if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Authentication popup was closed.';
      if (err.code === 'auth/unauthorized-domain') {
        setIsDomainError(true);
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        msg = `Domain '${host}' is not authorized in Firebase. Add it to Firebase Console > Authentication > Settings > Authorized domains, or use Database Auth.`;
      } else {
        setIsDomainError(false);
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setIsDomainError(false);
    setSuccessMsg('');

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
        throw new Error(data.error || 'Google session synchronization failed');
      }

      dispatch(setUser({ user: data.user, token: data.token }));
      router.push('/dashboard/explorer');
    } catch (err: any) {
      let msg = err.message || 'Google sign-in failed';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Google sign-in popup was closed.';
      if (err.code === 'auth/unauthorized-domain') {
        setIsDomainError(true);
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        msg = `Domain '${host}' is not authorized in Firebase. Add it to Firebase Console > Authentication > Settings > Authorized domains, or use Database Auth.`;
      } else {
        setIsDomainError(false);
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'analyst' | 'viewer' = 'admin') => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (data?.user && data?.token) {
        dispatch(setUser({ user: data.user, token: data.token }));
        if (typeof document !== 'undefined') {
          document.cookie = `datascope_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        }
        router.push('/dashboard/explorer');
        return;
      }
    } catch (_) {}

    // Fallback if network or fetch fails
    const personaMap = {
      admin: {
        id: 'usr-admin-01',
        name: 'Elena Rostova',
        email: 'admin@datascope.io',
        role: 'admin' as const,
        department: 'Enterprise Architecture',
        createdAt: new Date().toISOString(),
      },
      analyst: {
        id: 'usr-analyst-01',
        name: 'Marcus Vance',
        email: 'analyst@datascope.io',
        role: 'analyst' as const,
        department: 'Strategic Intelligence',
        createdAt: new Date().toISOString(),
      },
      viewer: {
        id: 'usr-viewer-01',
        name: 'Sarah Lin',
        email: 'viewer@datascope.io',
        role: 'viewer' as const,
        department: 'Product Operations',
        createdAt: new Date().toISOString(),
      },
    };

    const persona = personaMap[role] || personaMap.admin;
    dispatch(setUser({ user: persona, token: 'datascope-demo-session' }));
    if (typeof document !== 'undefined') {
      document.cookie = 'datascope_token=datascope-demo-session; path=/; max-age=604800; SameSite=Lax';
    }
    router.push('/dashboard/explorer');
    setIsLoading(false);
  };

  const handleQuickLogin = (role: 'admin' | 'analyst' | 'viewer') => {
    handleDemoLogin(role);
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
            Enterprise data discovery, PostgreSQL query analytics, and governance.
          </p>
        </div>
      </div>

      {/* 1-Click Instant Demo Account Sign In */}
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <IconSparkles className="h-4 w-4" />
            <span>Instant Demo Access</span>
          </span>
          <span className="text-[11px] text-emerald-500/80">No password required</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={isLoading}
          onClick={() => handleDemoLogin('admin')}
          className="w-full justify-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
        >
          <IconShield className="h-4 w-4" />
          <span>Sign In to Demo Account (Admin)</span>
        </Button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('analyst')}
            className="w-full text-xs font-medium border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300"
          >
            <span>Analyst Demo</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('viewer')}
            className="w-full text-xs font-medium border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300"
          >
            <span>Viewer Demo</span>
          </Button>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-800" />
        <span className="bg-slate-900 px-3 text-xs text-slate-500 font-medium">
          or sign in with credentials
        </span>
      </div>

      {/* Authentication Provider Selector */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setAuthMethod('firebase');
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] ${
            authMethod === 'firebase'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <IconFlame className="h-3.5 w-3.5" />
          <span>Firebase Auth</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMethod('credentials');
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] ${
            authMethod === 'credentials'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <IconShield className="h-3.5 w-3.5" />
          <span>Database Auth</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/40 text-xs text-rose-300 space-y-2">
          <div>{errorMsg}</div>
          {isDomainError && (
            <button
              type="button"
              onClick={() => {
                setAuthMethod('credentials');
                setErrorMsg('');
                setIsDomainError(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-medium transition-colors"
            >
              <IconShield className="h-3 w-3" />
              <span>Switch to Database Auth (Instant Demo Access)</span>
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-xs text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Firebase Google One-Click Button */}
      {authMethod === 'firebase' && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            isLoading={isLoading}
            onClick={handleFirebaseGoogleLogin}
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
            <span>Continue with Google</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="bg-slate-900 px-2 text-xs text-slate-500">
              or continue with email
            </span>
          </div>
        </div>
      )}

      {/* Form Inputs */}
      <form
        onSubmit={
          authMethod === 'firebase'
            ? (e) => {
                e.preventDefault();
                handleFirebaseEmailAuth(false);
              }
            : handleCredentialsLogin
        }
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Email address</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@datascope.io"
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

        {authMethod === 'firebase' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isLoading}
              onClick={() => handleFirebaseEmailAuth(true)}
              className="w-full text-xs font-semibold border-slate-800 bg-slate-950 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Register
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Sign in with credentials
          </Button>
        )}
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
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
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
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
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
            className="flex-col py-2.5 h-auto border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
          >
            <IconUser className="h-4 w-4 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Viewer</span>
            <span className="text-[10px] text-slate-400">Read only</span>
          </Button>
        </div>
      </div>

      {/* Registration link */}
      <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
        Need an enterprise account?{' '}
        <Link
          href="/register"
          className="text-emerald-400 hover:text-emerald-300 font-medium focus-visible:outline-none focus-visible:underline"
        >
          Register new account
        </Link>
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
