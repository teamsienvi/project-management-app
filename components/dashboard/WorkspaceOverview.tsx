'use client';

import { useRouter } from 'next/navigation';

interface WorkspaceOverviewProps {
    workspace: {
        id: string;
        name: string;
        created_at: string;
    };
    tasks: Array<{
        id: string;
        status: string;
        priority: string;
        title: string;
        due_date: string | null;
    }>;
    members: Array<{
        id: string;
        user_id: string;
        role: string;
        profiles: { full_name: string | null; avatar_url: string | null } | null;
    }>;
    membership: {
        role: string;
    };
}

export default function WorkspaceOverview({ workspace, tasks, members, membership }: WorkspaceOverviewProps) {
    const router = useRouter();

    const stats = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        review: tasks.filter((t) => t.status === 'review').length,
        done: tasks.filter((t) => t.status === 'done').length,
        overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800 }}>
                        <span className="gradient-text">{workspace.name}</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
                        Your role: <span className={`badge ${membership.role === 'owner' ? 'badge-cyan' : 'badge-violet'}`}>{membership.role}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-primary" onClick={() => router.push(`/workspace/${workspace.id}/tasks`)}>
                        View Tasks
                    </button>
                </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {[
                    { label: 'Total Tasks', value: stats.total, color: 'var(--text-primary)' },
                    { label: 'To Do', value: stats.todo, color: 'var(--text-tertiary)' },
                    { label: 'In Progress', value: stats.inProgress, color: 'var(--accent-blue)' },
                    { label: 'In Review', value: stats.review, color: 'var(--accent-violet)' },
                    { label: 'Done', value: stats.done, color: 'var(--status-success)' },
                    { label: 'Overdue', value: stats.overdue, color: 'var(--status-error)' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-xs)' }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                {[
                    { label: 'Tasks', desc: 'Manage your tasks', href: `/workspace/${workspace.id}/tasks`, icon: '☑' },
                    { label: 'Storyboards', desc: 'Organize your folders', href: `/workspace/${workspace.id}/storyboards`, icon: '⊞' },
                    { label: 'Files', desc: 'View uploaded files', href: `/workspace/${workspace.id}/files`, icon: '⧉' },
                    { label: 'Members', desc: `${members.length} members`, href: `/workspace/${workspace.id}/members`, icon: '⊕' },
                ].map((link) => (
                    <button
                        key={link.label}
                        className="glass-card glow-hover"
                        onClick={() => router.push(link.href)}
                        style={{ padding: 'var(--space-lg)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--font-family)', border: '1px solid var(--glass-border)' }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: 'var(--space-sm)' }}>{link.icon}</div>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{link.label}</h3>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>{link.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
