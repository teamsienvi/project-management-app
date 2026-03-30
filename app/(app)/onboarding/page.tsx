'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'create' | 'join';

export default function OnboardingPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('create');
    const [name, setName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Failed to create workspace');
            setLoading(false);
            return;
        }

        router.push(`/workspace/${data.workspace.id}`);
        router.refresh();
    }

    async function handleJoin(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const code = inviteCode.trim();

        // If it looks like a UUID (36 chars), try the email-invite token flow first
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);

        if (isUuid) {
            const res = await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: code }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/workspace/${data.workspace.id}`);
                router.refresh();
                return;
            }
            // If the token didn't work, fall through to join-by-code
        }

        // Try workspace join code
        const res = await fetch('/api/invites/join-by-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Failed to join workspace');
            setLoading(false);
            return;
        }

        router.push(`/workspace/${data.workspace.id}`);
        router.refresh();
    }

    return (
        <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 'var(--space-3xl)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                    Welcome! 🎉
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                    Create a new workspace or join an existing one with an invite code from a colleague.
                </p>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-lg)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                }}>
                    <button
                        type="button"
                        onClick={() => { setTab('create'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 'var(--font-sm)',
                            transition: 'all 0.2s ease',
                            background: tab === 'create' ? 'var(--bg-secondary)' : 'transparent',
                            color: tab === 'create' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            boxShadow: tab === 'create' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                        }}
                    >
                        Create Workspace
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('join'); setError(''); }}
                        style={{
                            flex: 1,
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 'var(--font-sm)',
                            transition: 'all 0.2s ease',
                            background: tab === 'join' ? 'var(--bg-secondary)' : 'transparent',
                            color: tab === 'join' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            boxShadow: tab === 'join' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                        }}
                    >
                        Join Workspace
                    </button>
                </div>

                {error && <div className="auth-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

                {tab === 'create' ? (
                    <form onSubmit={handleCreate} className="auth-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="workspace-name">Workspace Name</label>
                            <input
                                id="workspace-name"
                                className="form-input"
                                type="text"
                                placeholder="e.g., Marketing Ops"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                maxLength={100}
                            />
                            <span className="form-hint">You can rename it later.</span>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Creating workspace...' : 'Create Workspace'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleJoin} className="auth-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="invite-code">Invite Code</label>
                            <input
                                id="invite-code"
                                className="form-input"
                                type="text"
                                placeholder="e.g., a1b2c3d4"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                required
                            />
                            <span className="form-hint">Ask your team member for the workspace invite code.</span>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Joining workspace...' : 'Join Workspace'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
