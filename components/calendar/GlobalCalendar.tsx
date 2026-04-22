'use client';

import { useState, useEffect, useCallback } from 'react';

interface CalendarTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    color: string;
    due_date: string;
    workspace_id: string;
    assignee_user_id: string | null;
    workspaces: { name: string } | null;
    profiles: { full_name: string | null } | null;
}

interface FilterOption {
    id: string;
    name: string;
}

const STATUS_LABELS: Record<string, string> = {
    todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
};

const PRIORITY_BADGE: Record<string, string> = {
    urgent: 'badge-error', high: 'badge-magenta', medium: 'badge-warning', low: 'badge-cyan',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GlobalCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [workspaces, setWorkspaces] = useState<FilterOption[]>([]);
    const [members, setMembers] = useState<FilterOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterWorkspace, setFilterWorkspace] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Day detail panel
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ month: monthStr });
        if (filterWorkspace) params.set('workspaceId', filterWorkspace);
        if (filterUser) params.set('userId', filterUser);
        if (filterStatus) params.set('status', filterStatus);

        try {
            const res = await fetch(`/api/calendar?${params}`);
            const data = await res.json();
            if (res.ok) {
                setTasks(data.tasks || []);
                setWorkspaces(data.workspaces || []);
                setMembers(data.members || []);
            }
        } catch (err) {
            console.error('Failed to fetch calendar data:', err);
        } finally {
            setLoading(false);
        }
    }, [monthStr, filterWorkspace, filterUser, filterStatus]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Calendar grid computation
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        calendarDays.push({ date: d, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        calendarDays.push({ date: d, month, year, isCurrentMonth: true });
    }
    // Next month padding
    const remaining = 42 - calendarDays.length;
    for (let d = 1; d <= remaining; d++) {
        calendarDays.push({ date: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
    }

    function getDateKey(y: number, m: number, d: number): string {
        const actualMonth = m < 0 ? 11 : m > 11 ? 0 : m;
        const actualYear = m < 0 ? y - 1 : m > 11 ? y + 1 : y;
        return `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    function getTasksForDate(dateKey: string): CalendarTask[] {
        return tasks.filter((t) => t.due_date?.startsWith(dateKey));
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

    function navigateMonth(delta: number) {
        setCurrentDate(new Date(year, month + delta, 1));
        setSelectedDate(null);
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    <span style={{ marginRight: 8 }}>📅</span> Calendar
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(-1)}>‹</button>
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, minWidth: 180, textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(1)}>›</button>
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'var(--space-sm)' }} onClick={() => { setCurrentDate(new Date()); setSelectedDate(todayKey); }}>
                        Today
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-sm)' }} value={filterWorkspace} onChange={(e) => setFilterWorkspace(e.target.value)} aria-label="Filter by workspace">
                    <option value="">All Workspaces</option>
                    {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-sm)' }} value={filterUser} onChange={(e) => setFilterUser(e.target.value)} aria-label="Filter by user">
                    <option value="">All Members</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-sm)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
                    <option value="">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                </select>
                {loading && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', alignSelf: 'center' }}>Loading...</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 340px' : '1fr', gap: 'var(--space-lg)' }}>
                {/* Calendar Grid */}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-default)' }}>
                        {DAY_NAMES.map((d) => (
                            <div key={d} style={{
                                padding: '10px 0', textAlign: 'center',
                                fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                fontFamily: 'var(--font-heading)',
                            }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {calendarDays.map((day, idx) => {
                            const dateKey = getDateKey(day.year, day.month, day.date);
                            const dayTasks = getTasksForDate(dateKey);
                            const isToday = dateKey === todayKey;
                            const isSelected = dateKey === selectedDate;
                            const isPast = new Date(dateKey) < new Date(todayKey) && !isToday;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                                    style={{
                                        minHeight: 80,
                                        padding: '6px 8px',
                                        border: 'none',
                                        borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                                        borderBottom: idx < 35 ? '1px solid var(--border-subtle)' : 'none',
                                        background: isSelected
                                            ? 'rgba(79, 70, 229, 0.06)'
                                            : isToday
                                                ? 'rgba(79, 70, 229, 0.03)'
                                                : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        verticalAlign: 'top',
                                        transition: 'background var(--transition-fast)',
                                        opacity: day.isCurrentMonth ? 1 : 0.35,
                                        position: 'relative',
                                        fontFamily: 'var(--font-family)',
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(79, 70, 229, 0.03)' : 'transparent'; }}
                                >
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 26, height: 26, borderRadius: '50%',
                                        fontSize: 12, fontWeight: isToday ? 700 : 500,
                                        color: isToday ? '#fff' : isPast ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                        background: isToday ? 'var(--accent-brand)' : 'transparent',
                                    }}>
                                        {day.date}
                                    </span>

                                    {/* Task dots */}
                                    {dayTasks.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                                            {dayTasks.slice(0, 3).map((t) => (
                                                <div key={t.id} style={{
                                                    width: '100%',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    fontSize: 10,
                                                    fontWeight: 500,
                                                    backgroundColor: `color-mix(in srgb, var(--color-${t.color || 'gray'}) 15%, transparent)`,
                                                    color: `var(--color-${t.color || 'gray'})`,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '16px',
                                                    borderLeft: `2px solid var(--color-${t.color || 'gray'})`,
                                                }}>
                                                    {t.title}
                                                </div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500, paddingLeft: 4 }}>
                                                    +{dayTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail Panel */}
                {selectedDate && (
                    <div className="glass-card fade-in" style={{ padding: 'var(--space-lg)', alignSelf: 'start', position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-lg))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDate(null)} style={{ fontSize: 12, width: 28, height: 28 }}>✕</button>
                        </div>

                        {selectedTasks.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--space-xl) 0' }}>
                                No tasks due on this day
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {selectedTasks.map((task) => (
                                    <a
                                        key={task.id}
                                        href={`/workspace/${task.workspace_id}/tasks/${task.id}`}
                                        style={{
                                            display: 'block',
                                            padding: 'var(--space-sm) var(--space-md)',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-subtle)',
                                            borderLeft: `4px solid var(--color-${task.color || 'gray'})`,
                                            textDecoration: 'none',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                    >
                                        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                                            {task.title}
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                                            <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-cyan'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                                                {task.priority}
                                            </span>
                                            <span>{STATUS_LABELS[task.status] || task.status}</span>
                                            {task.workspaces && <span>· {(task.workspaces as any).name}</span>}
                                        </div>
                                        {task.profiles && (
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                👤 {(task.profiles as any).full_name || 'Unassigned'}
                                            </div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
