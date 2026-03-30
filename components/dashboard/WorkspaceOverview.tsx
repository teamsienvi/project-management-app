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

const AVATAR_COLORS = ['avatar-blue', 'avatar-green', 'avatar-violet', 'avatar-orange', 'avatar-rose', 'avatar-cyan', 'avatar-yellow'];

const PANEL_THEMES = {
    tasks:       { bg: '#e8f0fe', border: '#c4d9f7', color: '#1a5fa8', icon: '☑' },
    files:       { bg: '#e6f5ec', border: '#b8e2c8', color: '#157347', icon: '📄' },
    storyboards: { bg: '#f0ebfa', border: '#d5caf0', color: '#6b48a8', icon: '📋' },
    team:        { bg: '#ffedd5', border: '#f5d0a9', color: '#9a3412', icon: '👥' },
    schedule:    { bg: '#fef9c3', border: '#f5e68c', color: '#854d0e', icon: '📅' },
    overdue:     { bg: '#fde8e8', border: '#f5c6c6', color: '#b42318', icon: '⚠' },
};

export default function WorkspaceOverview({ workspace, tasks, members, membership }: WorkspaceOverviewProps) {
    const router = useRouter();

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const avatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const todo = tasks.filter(t => t.status === 'todo');
    const review = tasks.filter(t => t.status === 'review');
    const done = tasks.filter(t => t.status === 'done');
    const upcoming = tasks
        .filter(t => t.due_date && new Date(t.due_date) >= new Date() && t.status !== 'done')
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5);

    const PanelButton = ({ theme, onClick, children }: { theme: typeof PANEL_THEMES.tasks; onClick: () => void; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                cursor: 'pointer',
                textAlign: 'left' as const,
                fontFamily: 'var(--font-family)',
                transition: 'all 150ms ease',
                width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {children}
        </button>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)', paddingBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-default)' }}>
                <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    {workspace.name}
                </h1>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
                    {members.slice(0, 8).map((m, i) => (
                        <div key={m.id} className={`avatar avatar-md ${avatarColor(i)}`} title={m.profiles?.full_name || 'Member'}>
                            {getInitials(m.profiles?.full_name || null)}
                        </div>
                    ))}
                    {members.length > 8 && (
                        <div className="avatar avatar-md" style={{ background: '#f3f1ee', color: '#888', fontSize: '11px' }}>+{members.length - 8}</div>
                    )}
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''} · <span className={`badge ${membership.role === 'owner' ? 'badge-blue' : 'badge-violet'}`}>{membership.role}</span>
                </p>
            </div>

            {/* HQ Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>

                {/* To-dos */}
                <PanelButton theme={PANEL_THEMES.tasks} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: PANEL_THEMES.tasks.color }}>{PANEL_THEMES.tasks.icon} To-dos</span>
                        <span className="badge badge-blue">{tasks.length}</span>
                    </div>
                    {tasks.length === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>No tasks yet — create one!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {[
                                { label: 'To Do', count: todo.length, color: '#bcbcbc' },
                                { label: 'In Progress', count: inProgress.length, color: '#1d72b8' },
                                { label: 'Review', count: review.length, color: '#7c5cbf' },
                                { label: 'Done', count: done.length, color: '#1a8a5c' },
                            ].filter(s => s.count > 0).map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.label}
                                    </span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{s.count}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </PanelButton>

                {/* Docs & Files */}
                <PanelButton theme={PANEL_THEMES.files} onClick={() => router.push(`/workspace/${workspace.id}/files`)}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: PANEL_THEMES.files.color }}>{PANEL_THEMES.files.icon} Docs & Files</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '4px' }}>Shared documents, uploads & attachments</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>Browse files →</p>
                </PanelButton>

                {/* Storyboards */}
                <PanelButton theme={PANEL_THEMES.storyboards} onClick={() => router.push(`/workspace/${workspace.id}/storyboards`)}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: PANEL_THEMES.storyboards.color }}>{PANEL_THEMES.storyboards.icon} Storyboards</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '4px' }}>Organize ideas with folders & boards</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>Open boards →</p>
                </PanelButton>

                {/* Team */}
                <PanelButton theme={PANEL_THEMES.team} onClick={() => router.push(`/workspace/${workspace.id}/members`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: PANEL_THEMES.team.color }}>{PANEL_THEMES.team.icon} Team</span>
                        <span className="badge badge-orange">{members.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {members.slice(0, 4).map((m, i) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)' }}>
                                <div className={`avatar avatar-sm ${avatarColor(i)}`} style={{ width: 22, height: 22, fontSize: '8px' }}>
                                    {getInitials(m.profiles?.full_name || null)}
                                </div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {m.profiles?.full_name || 'Unknown'}
                                </span>
                            </div>
                        ))}
                        {members.length > 4 && <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>+ {members.length - 4} more →</span>}
                    </div>
                </PanelButton>
            </div>

            {/* Schedule */}
            {(overdue.length > 0 || upcoming.length > 0) && (
                <div style={{
                    background: overdue.length > 0 ? PANEL_THEMES.overdue.bg : PANEL_THEMES.schedule.bg,
                    border: `1px solid ${overdue.length > 0 ? PANEL_THEMES.overdue.border : PANEL_THEMES.schedule.border}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                }}>
                    <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: overdue.length > 0 ? PANEL_THEMES.overdue.color : PANEL_THEMES.schedule.color, marginBottom: 'var(--space-md)' }}>
                        {overdue.length > 0 ? PANEL_THEMES.overdue.icon : PANEL_THEMES.schedule.icon} Schedule
                    </div>

                    {overdue.length > 0 && (
                        <div style={{ marginBottom: upcoming.length > 0 ? 'var(--space-md)' : 0 }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#b42318', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>Overdue</div>
                            {overdue.slice(0, 4).map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 'var(--font-sm)', cursor: 'pointer' }} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c93c37', flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                    <span style={{ color: '#c93c37', fontSize: 'var(--font-xs)', flexShrink: 0 }}>{new Date(t.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {upcoming.length > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>Coming Up</div>
                            {upcoming.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 'var(--font-sm)', cursor: 'pointer' }} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d72b8', flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', flexShrink: 0 }}>{new Date(t.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
