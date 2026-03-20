'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSignup(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}${redirect}`,
            },
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
            <h2>Create Account</h2>
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleSignup}>
                <div className="form-group">
                    <label className="form-label" htmlFor="signup-email">
                        Email
                    </label>
                    <input
                        id="signup-email"
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
                    <label className="form-label" htmlFor="signup-password">
                        Password
                    </label>
                    <input
                        id="signup-password"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="signup-confirm-password">
                        Confirm Password
                    </label>
                    <input
                        id="signup-confirm-password"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>
            <div className="auth-links">
                <Link href="/login">Already have an account? Sign In</Link>
            </div>
        </>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />}>
            <SignupForm />
        </Suspense>
    );
}
