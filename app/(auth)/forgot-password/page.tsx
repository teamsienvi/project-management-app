'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleReset(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appUrl}/settings/profile`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSent(true);
        setLoading(false);
    }

    if (sent) {
        return (
            <>
                <h2>Check Your Email</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
                </p>
                <Link href="/login" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                    Back to Sign In
                </Link>
            </>
        );
    }

    return (
        <>
            <h2>Reset Password</h2>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)', fontSize: 'var(--font-sm)' }}>
                Enter your email and we&apos;ll send you a reset link.
            </p>
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleReset}>
                <div className="form-group">
                    <label className="form-label" htmlFor="reset-email">
                        Email
                    </label>
                    <input
                        id="reset-email"
                        type="email"
                        className="form-input"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            <div className="auth-links">
                <Link href="/login">Back to Sign In</Link>
            </div>
        </>
    );
}
