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
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800 }}>
                    <span className="gradient-text">Dashboard</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                    Welcome back. Select a workspace to get started.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {workspaces.map((ws) => (
                    <button
                        key={ws.workspace_id}
                        className="glass-card glow-hover"
                        onClick={() => router.push(`/workspace/${ws.workspace_id}`)}
                        style={{
                            padding: 'var(--space-lg)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            border: '1px solid var(--glass-border)',
                            width: '100%',
                            fontFamily: 'var(--font-family)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div
                                className="avatar avatar-lg"
                                style={{ background: 'var(--gradient-cool)' }}
                            >
                                {ws.workspaces?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {ws.workspaces?.name || 'Unnamed Workspace'}
                                </h3>
                                <span className={`badge ${ws.role === 'owner' ? 'badge-cyan' : ws.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>
                                    {ws.role}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                            Joined {new Date(ws.joined_at).toLocaleDateString()}
                        </p>
                    </button>
                ))}

                {/* Add workspace card */}
                <button
                    className="glass-card glow-hover"
                    onClick={() => router.push('/onboarding')}
                    style={{
                        padding: 'var(--space-lg)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '1px dashed var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 140,
                        fontFamily: 'var(--font-family)',
                        width: '100%',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)', opacity: 0.4 }}>+</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-md)' }}>
                            Create New Workspace
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
