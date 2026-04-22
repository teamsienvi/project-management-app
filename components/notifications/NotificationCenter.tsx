'use client';

import { useState, useEffect, useCallback } from 'react';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    priority: string;
    read_at: string | null;
    created_at: string;
    workspace_id: string | null;
}

const TYPE_ICONS: Record<string, string> = {
    task_assigned: '📋',
    task_completed: '✅',
    task_due_soon: '⏰',
    file_uploaded: '📎',
    workspace_invite: '💌',
    member_added: '👋',
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'var(--status-error)',
    high: 'var(--accent-orange)',
    normal: 'var(--accent-blue)',
    low: 'var(--text-tertiary)',
};

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.notifications || []);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    async function markRead(id: string) {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
    }

    async function markAllRead() {
        const unread = notifications.filter((n) => !n.read_at);
        await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })));
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    }

    const filtered = filterType
        ? notifications.filter((n) => n.type === filterType)
        : notifications;

    // Group by date
    const grouped = new Map<string, Notification[]>();
    filtered.forEach((n) => {
        const dateKey = new Date(n.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey)!.push(n);
    });

    const unreadCount = notifications.filter((n) => !n.read_at).length;
    const types = [...new Set(notifications.map((n) => n.type))];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        🔔 Notifications
                    </h1>
                    {unreadCount > 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 4 }}>
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                        Mark All Read
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <button
                    className={`btn btn-sm ${!filterType ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType('')}
                    style={{ fontSize: 12 }}
                >
                    All
                </button>
                {types.map((type) => (
                    <button
                        key={type}
                        className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterType(type)}
                        style={{ fontSize: 12 }}
                    >
                        {TYPE_ICONS[type] || '🔔'} {type.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}>
                    Loading...
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ fontSize: 48, marginBottom: 'var(--space-md)' }}>🔕</div>
                    <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>All caught up!</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>No notifications to show.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {Array.from(grouped.entries()).map(([dateLabel, items]) => (
                        <div key={dateLabel}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                marginBottom: 'var(--space-sm)', paddingLeft: 4,
                                fontFamily: 'var(--font-heading)',
                            }}>
                                {dateLabel}
                            </div>
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                {items.map((n, idx) => (
                                    <button
                                        key={n.id}
                                        onClick={() => !n.read_at && markRead(n.id)}
                                        style={{
                                            display: 'flex',
                                            gap: 'var(--space-md)',
                                            padding: '14px var(--space-lg)',
                                            background: n.read_at ? 'transparent' : 'rgba(79, 70, 229, 0.02)',
                                            borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                            border: 'none',
                                            width: '100%',
                                            textAlign: 'left',
                                            cursor: n.read_at ? 'default' : 'pointer',
                                            transition: 'background var(--transition-fast)',
                                            fontFamily: 'var(--font-family)',
                                        }}
                                        onMouseEnter={(e) => { if (!n.read_at) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = n.read_at ? 'transparent' : 'rgba(79, 70, 229, 0.02)'; }}
                                    >
                                        {/* Priority indicator */}
                                        <div style={{
                                            position: 'relative',
                                            width: 36, height: 36,
                                            borderRadius: 10,
                                            background: `rgba(${n.priority === 'urgent' ? '239,68,68' : n.priority === 'high' ? '249,115,22' : '59,130,246'}, 0.08)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, flexShrink: 0,
                                        }}>
                                            {TYPE_ICONS[n.type] || '🔔'}
                                            {!n.read_at && (
                                                <div style={{
                                                    position: 'absolute', top: -2, right: -2,
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.normal,
                                                    border: '2px solid white',
                                                }} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 'var(--font-sm)',
                                                fontWeight: n.read_at ? 400 : 600,
                                                color: 'var(--text-primary)',
                                                marginBottom: 2,
                                            }}>
                                                {n.title}
                                            </div>
                                            {n.body && (
                                                <div style={{
                                                    fontSize: 'var(--font-xs)',
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: 1.4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {n.body}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                                {formatTimeAgo(n.created_at)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}
