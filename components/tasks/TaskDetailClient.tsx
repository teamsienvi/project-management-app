'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TaskDetailClientProps {
    task: any;
    notes: any[];
    activity: any[];
    members: any[];
    watchers: any[];
    workspaceId: string;
    currentUserId: string;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
const COLOR_OPTIONS = ['gray', 'red', 'orange', 'amber', 'green', 'blue', 'indigo', 'pink'] as const;
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskDetailClient({ task, notes: initialNotes, activity: initialActivity, members, workspaceId, currentUserId }: TaskDetailClientProps) {
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        color: task.color || 'gray',
        dueDate: task.due_date?.slice(0, 10) || '',
        assigneeUserId: task.assignee_user_id || '',
    });
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [activity, setActivity] = useState(initialActivity);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [suggestingColor, setSuggestingColor] = useState(false);

    async function handleSuggestColor() {
        setSuggestingColor(true);
        try {
            const res = await fetch('/api/tasks/suggest-color', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    priority: form.priority,
                    dueDate: form.dueDate,
                }),
            });
            const data = await res.json();
            if (res.ok && data.suggestion?.color) {
                setForm((prev) => ({ ...prev, color: data.suggestion.color }));
            }
        } catch (err) {
            console.error('Failed to suggest color:', err);
        } finally {
            setSuggestingColor(false);
        }
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: form.title,
                description: form.description || undefined,
                status: form.status,
                priority: form.priority,
                color: form.color,
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
                assigneeUserId: form.assigneeUserId || null,
            }),
        });
        if (res.ok) {
            setEditMode(false);
            router.refresh();
        }
        setSaving(false);
    }

    async function handleComplete() {
        const res = await fetch(`/api/tasks/${task.id}/complete`, { method: 'POST' });
        if (res.ok) router.refresh();
    }

    async function handleAddNote(e: FormEvent) {
        e.preventDefault();
        if (!newNote.trim()) return;
        setAddingNote(true);
        const res = await fetch(`/api/tasks/${task.id}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: newNote }),
        });
        if (res.ok) {
            const data = await res.json();
            setNotes((prev) => [...prev, data.note]);
            setNewNote('');
        }
        setAddingNote(false);
    }

    return (
        <div>
            <button className="btn btn-ghost" onClick={() => router.push(`/workspace/${workspaceId}/tasks`)} style={{ marginBottom: 'var(--space-md)' }}>
                ← Back to Tasks
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-xl)' }}>
                {/* Main content */}
                <div>
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                        {editMode ? (
                            <form onSubmit={handleSave}>
                                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label className="form-label" htmlFor="edit-title">Title</label>
                                    <input id="edit-title" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label className="form-label" htmlFor="edit-desc">Description</label>
                                    <textarea id="edit-desc" className="form-input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Supports **markdown** formatting" />
                                    <div className="form-hint">Markdown supported: **bold**, *italic*, `code`, lists, links</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="edit-status">Status</label>
                                        <select id="edit-status" className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="edit-priority">Priority</label>
                                        <select id="edit-priority" className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="edit-color">Color Tag</label>
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                            <select id="edit-color" className="form-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ flex: 1 }}>
                                                {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-ghost btn-sm" onClick={handleSuggestColor} disabled={suggestingColor} title="AI Color Suggestion" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                                {suggestingColor ? '⏳' : '✨ AI'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="edit-due">Due Date</label>
                                        <input id="edit-due" type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="edit-assignee">Assignee</label>
                                        <select id="edit-assignee" className="form-input" value={form.assigneeUserId} onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}>
                                            <option value="">Unassigned</option>
                                            {members.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.user_id}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>{task.title}</h1>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>Edit</button>
                                        {task.status !== 'done' && (
                                            <button className="btn btn-primary btn-sm" onClick={handleComplete}>Mark Complete</button>
                                        )}
                                    </div>
                                </div>
                                {task.description && (
                                    <div style={{ marginTop: 'var(--space-md)' }}>
                                        <MarkdownRenderer content={task.description} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Notes section */}
                    <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Notes & Comments</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                            {notes.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>No notes yet.</p>}
                            {notes.map((note: any) => (
                                <div key={note.id} style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                                        <span style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{note.profiles?.full_name || 'User'}</span>
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{new Date(note.created_at).toLocaleString()}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)', whiteSpace: 'pre-wrap' }}>{note.body}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <textarea className="form-input" placeholder="Add a note..." rows={2} style={{ flex: 1 }} value={newNote} onChange={(e) => setNewNote(e.target.value)} aria-label="New note" />
                            <button type="submit" className="btn btn-primary" disabled={addingNote || !newNote.trim()} style={{ alignSelf: 'flex-end' }}>
                                {addingNote ? '...' : 'Add'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Status</span>
                                <span className={`badge badge-${task.status === 'done' ? 'success' : 'cyan'}`}>{STATUS_LABELS[task.status]}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Priority</span>
                                <span className={`badge badge-${task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'magenta' : 'warning'}`}>{task.priority}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Color Tag</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: `var(--color-${task.color || 'gray'}, gray)` }} />
                                    {task.color ? task.color.charAt(0).toUpperCase() + task.color.slice(1) : 'Gray'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Assignee</span>
                                <span>{task.assignee?.full_name || 'Unassigned'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Creator</span>
                                <span>{task.creator?.full_name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Due Date</span>
                                <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Created</span>
                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Activity</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {activity.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>No activity yet.</p>}
                            {activity.map((a: any) => (
                                <div key={a.id} style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{a.profiles?.full_name || 'User'}</span>{' '}
                                    {a.event_type.replace(/_/g, ' ')}{' '}
                                    <span>{new Date(a.created_at).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
