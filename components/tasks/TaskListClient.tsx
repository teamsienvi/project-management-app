'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    assignee_user_id: string | null;
    created_at: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface Member {
    user_id: string;
    profiles: { full_name: string | null } | null;
}

interface TaskListClientProps {
    tasks: Task[];
    members: Member[];
    workspaceId: string;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskListClient({ tasks: initialTasks, members, workspaceId }: TaskListClientProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
    const [showCreate, setShowCreate] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPriority, setFilterPriority] = useState<string>('');
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assigneeUserId: '' });
    const [creating, setCreating] = useState(false);

    const filteredTasks = tasks.filter((t) => {
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterPriority && t.priority !== filterPriority) return false;
        return true;
    });

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setCreating(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTask.title,
                description: newTask.description || undefined,
                priority: newTask.priority,
                assigneeUserId: newTask.assigneeUserId || undefined,
            }),
        });
        if (res.ok) {
            setShowCreate(false);
            setNewTask({ title: '', description: '', priority: 'medium', assigneeUserId: '' });
            router.refresh();
            const data = await res.json();
            setTasks((prev) => [data.task, ...prev]);
        }
        setCreating(false);
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Tasks</h1>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Task</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-sm)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-sm)' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} aria-label="Filter by priority">
                    <option value="">All Priority</option>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
            </div>

            {/* Task Table */}
            {filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">☑</div>
                    <div className="empty-state-title">No tasks yet</div>
                    <div className="empty-state-desc">Create your first task to get started.</div>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Assignee</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} onClick={() => router.push(`/workspace/${workspaceId}/tasks/${task.id}`)} style={{ cursor: 'pointer' }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/workspace/${workspaceId}/tasks/${task.id}`); }}>
                                    <td><span className={`status-dot status-${task.status}`} style={{ display: 'inline-block', marginRight: '8px' }} />{STATUS_LABELS[task.status] || task.status}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{task.title}</td>
                                    <td><span className={`badge badge-${task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'magenta' : task.priority === 'medium' ? 'warning' : 'cyan'}`}>{task.priority}</span></td>
                                    <td>{task.profiles?.full_name || '—'}</td>
                                    <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowCreate(false); }} role="dialog" aria-modal="true" aria-label="Create task">
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', width: '100%', maxWidth: 500 }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>New Task</h2>
                        <form onSubmit={handleCreate} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="task-title">Title</label>
                                <input id="task-title" className="form-input" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="task-desc">Description</label>
                                <textarea id="task-desc" className="form-input" rows={3} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="task-priority">Priority</label>
                                    <select id="task-priority" className="form-input" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="task-assignee">Assignee</label>
                                    <select id="task-assignee" className="form-input" value={newTask.assigneeUserId} onChange={(e) => setNewTask({ ...newTask, assigneeUserId: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.user_id}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Task'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
