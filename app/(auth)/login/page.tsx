'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push(redirect);
        router.refresh();
    }

    return (
        <>
            <h2>Sign In</h2>
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <label className="form-label" htmlFor="login-email">
                        Email
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        className="form-input"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="login-password">
                        Password
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
            <div className="auth-links">
                <Link href="/forgot-password">Forgot your password?</Link>
                <Link href="/signup">Create an account</Link>
            </div>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />}>
            <LoginForm />
        </Suspense>
    );
}
