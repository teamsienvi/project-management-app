'use client';

import { useRouter } from 'next/navigation';

interface DashboardClientProps {
    workspaces: Array<{
        workspace_id: string;
        role: string;
        joined_at: string;
        workspaces: {
            id: string;
            name: string;
            slug: string;
            created_at: string;
        } | null;
    }>;
    userId: string;
}

export default function DashboardClient({ workspaces }: DashboardClientProps) {
    const router = useRouter();

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Your Workspaces
                </h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
                    {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Workspace list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                {workspaces.map((ws) => (
                    <button
                        key={ws.workspace_id}
                        onClick={() => router.push(`/workspace/${ws.workspace_id}`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-md) var(--space-lg)',
                            background: 'var(--bg-surface)',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'var(--font-family)',
                            transition: 'background 120ms ease',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                    >
                        <div className="avatar avatar-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                            {ws.workspaces?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {ws.workspaces?.name || 'Unnamed Workspace'}
                            </div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                Joined {new Date(ws.joined_at).toLocaleDateString()}
                            </div>
                        </div>
                        <span className={`badge ${ws.role === 'owner' ? 'badge-cyan' : ws.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>
                            {ws.role}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
                    </button>
                ))}
            </div>

            {/* Create/Join action */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => router.push('/onboarding')}
                    style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-md)' }}
                >
                    + Create or Join Workspace
                </button>
            </div>
        </div>
    );
}
