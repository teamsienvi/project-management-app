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
    tasks:       { accent: 'var(--accent-blue)', bg: 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.01) 100%)', icon: '☑' },
    files:       { accent: 'var(--accent-green)', bg: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)', icon: '📄' },
    storyboards: { accent: 'var(--accent-purple)', bg: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)', icon: '📋' },
    team:        { accent: 'var(--accent-orange)', bg: 'linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)', icon: '👥' },
    schedule:    { accent: 'var(--status-warning)', bg: 'linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)', icon: '📅' },
    overdue:     { accent: 'var(--status-error)', bg: 'linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.01) 100%)', icon: '⚠' },
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
            className="glass-card glow-hover"
            onClick={onClick}
            style={{
                background: `var(--glass-bg), ${theme.bg}`,
                position: 'relative',
                overflow: 'hidden',
                padding: 'var(--space-xl)',
                cursor: 'pointer',
                textAlign: 'left' as const,
                fontFamily: 'var(--font-family)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderTop: `3px solid ${theme.accent}`, // Signature sophisticated touch
            }}
        >
            {children}
        </button>
    );

    return (
        <div className="fade-in">
            {/* Dashboard Hero Banner */}
            <div className="glass-card" style={{
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center',
                padding: 'var(--space-3xl) var(--space-xl)',
                marginBottom: 'var(--space-3xl)',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.6) 100%)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 20px 40px -20px rgba(15,23,42,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}>
                {/* Decorative mesh inside the banner */}
                <div style={{
                    position: 'absolute', top: -50, left: -50, right: -50, bottom: -50, zIndex: 0,
                    background: 'radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 40%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', 
                        padding: '6px 16px', background: 'rgba(255,255,255,0.8)', 
                        backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-full)', 
                        marginBottom: 'var(--space-md)', fontSize: 'var(--font-sm)', 
                        fontWeight: 600, color: 'var(--text-secondary)',
                        boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(255,255,255,0.5)'
                    }}>
                        <span style={{ color: 'var(--accent-brand)' }}>✧</span> Workspace Overview
                    </div>

                    <h1 style={{ 
                        fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: 800, 
                        lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 'var(--space-lg)', 
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
                    }}>
                        {workspace.name}
                    </h1>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
                        {members.slice(0, 8).map((m, i) => (
                            <div key={m.id} className={`avatar avatar-lg ${avatarColor(i)}`} title={m.profiles?.full_name || 'Member'} style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '2px solid white' }}>
                                {getInitials(m.profiles?.full_name || null)}
                            </div>
                        ))}
                        {members.length > 8 && (
                            <div className="avatar avatar-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '2px solid white' }}>+{members.length - 8}</div>
                        )}
                    </div>
                    
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-md)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {members.length} member{members.length !== 1 ? 's' : ''} 
                        <span style={{ opacity: 0.3 }}>•</span> 
                        <span className={`badge ${membership.role === 'owner' ? 'badge-blue' : 'badge-violet'}`} style={{ textTransform: 'capitalize' }}>
                            {membership.role}
                        </span>
                    </p>
                </div>
            </div>

            {/* HQ Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>

                {/* To-dos */}
                <PanelButton theme={PANEL_THEMES.tasks} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <span style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: PANEL_THEMES.tasks.accent, fontSize: '24px' }}>{PANEL_THEMES.tasks.icon}</span> To-dos
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: '13px', padding: '4px 12px' }}>{tasks.length}</span>
                    </div>
                    {tasks.length === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', fontStyle: 'italic' }}>No tasks yet — create one!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            {[
                                { label: 'To Do', count: todo.length, color: 'var(--text-tertiary)' },
                                { label: 'In Progress', count: inProgress.length, color: 'var(--accent-blue)' },
                                { label: 'Review', count: review.length, color: 'var(--accent-purple)' },
                                { label: 'Done', count: done.length, color: 'var(--accent-green)' },
                            ].filter(s => s.count > 0).map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)', padding: '6px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />{s.label}
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
                        <span style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: PANEL_THEMES.files.accent, fontSize: '24px' }}>{PANEL_THEMES.files.icon}</span> Docs & Files
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>Access shared documents, media assets, and Drive attachments.</p>
                    <p style={{ color: PANEL_THEMES.files.accent, fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Browse files →</p>
                </PanelButton>

                {/* Storyboards */}
                <PanelButton theme={PANEL_THEMES.storyboards} onClick={() => router.push(`/workspace/${workspace.id}/storyboards`)}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: PANEL_THEMES.storyboards.accent, fontSize: '24px' }}>{PANEL_THEMES.storyboards.icon}</span> Storyboards
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>Organize ideas, timelines, and strategy with folders and boards.</p>
                    <p style={{ color: PANEL_THEMES.storyboards.accent, fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open boards →</p>
                </PanelButton>

                {/* Team */}
                <PanelButton theme={PANEL_THEMES.team} onClick={() => router.push(`/workspace/${workspace.id}/members`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <span style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: PANEL_THEMES.team.accent, fontSize: '24px' }}>{PANEL_THEMES.team.icon}</span> Team
                        </span>
                        <span className="badge badge-orange" style={{ fontSize: '13px', padding: '4px 12px' }}>{members.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        {members.slice(0, 4).map((m, i) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-sm)', padding: '6px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                                <div className={`avatar avatar-md ${avatarColor(i)}`} style={{ width: 26, height: 26, fontSize: '10px' }}>
                                    {getInitials(m.profiles?.full_name || null)}
                                </div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {m.profiles?.full_name || 'Unknown'}
                                </span>
                            </div>
                        ))}
                        {members.length > 4 && <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', fontWeight: 500, textAlign: 'center', marginTop: '8px' }}>+ {members.length - 4} more member{members.length - 4 !== 1 ? 's' : ''}</span>}
                    </div>
                </PanelButton>
            </div>

            {/* Schedule */}
            {(overdue.length > 0 || upcoming.length > 0) && (
                <div className="glass-card" style={{
                    background: `var(--glass-bg), ${overdue.length > 0 ? PANEL_THEMES.overdue.bg : PANEL_THEMES.schedule.bg}`,
                    borderTop: `4px solid ${overdue.length > 0 ? PANEL_THEMES.overdue.accent : PANEL_THEMES.schedule.accent}`,
                    padding: 'var(--space-2xl)',
                }}>
                    <div style={{ fontSize: 'var(--font-2xl)', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: overdue.length > 0 ? PANEL_THEMES.overdue.accent : PANEL_THEMES.schedule.accent }}>{overdue.length > 0 ? PANEL_THEMES.overdue.icon : PANEL_THEMES.schedule.icon}</span> Schedule
                    </div>

                    {overdue.length > 0 && (
                        <div style={{ marginBottom: upcoming.length > 0 ? 'var(--space-xl)' : 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--status-error)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>Overdue</div>
                            {overdue.slice(0, 4).map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', marginBottom: '8px', fontSize: 'var(--font-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' }} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--status-error)', boxShadow: '0 0 10px var(--status-error)', flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                    <span style={{ color: 'var(--status-error)', fontSize: 'var(--font-sm)', fontWeight: 600, flexShrink: 0 }}>{new Date(t.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {upcoming.length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>Coming Up</div>
                            {upcoming.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: 'var(--radius-md)', marginBottom: '8px', fontSize: 'var(--font-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)', border: '1px solid var(--border-subtle)' }} onClick={() => router.push(`/workspace/${workspace.id}/tasks`)} onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-default)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--accent-blue)', flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', flexShrink: 0 }}>{new Date(t.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
