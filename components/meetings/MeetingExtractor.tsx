'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExtractedTask {
    title: string;
    assignee: string;
    deadline: string;
    priority: string;
    color?: string;
}

interface MeetingExtractorProps {
    workspaceId: string;
    workspaceName: string;
    members: { user_id: string; profiles: { full_name: string | null } | null }[];
}

const PRIORITY_BADGE: Record<string, string> = {
    urgent: 'badge-error',
    high: 'badge-magenta',
    medium: 'badge-warning',
    low: 'badge-cyan',
};

export default function MeetingExtractor({ workspaceId, workspaceName, members }: MeetingExtractorProps) {
    const router = useRouter();
    const [transcript, setTranscript] = useState('');
    const [extracting, setExtracting] = useState(false);
    const [extracted, setExtracted] = useState<ExtractedTask[] | null>(null);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<number | null>(null);
    const [error, setError] = useState('');

    async function handleExtract() {
        if (!transcript.trim()) return;
        setExtracting(true);
        setError('');
        setExtracted(null);
        setCreated(null);

        try {
            const res = await fetch('/api/meetings/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, workspaceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Extraction failed');
            setExtracted(data.extraction.tasks || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExtracting(false);
        }
    }

    function updateTask(index: number, field: keyof ExtractedTask, value: string) {
        if (!extracted) return;
        const updated = [...extracted];
        updated[index] = { ...updated[index], [field]: value };
        setExtracted(updated);
    }

    function removeTask(index: number) {
        if (!extracted) return;
        setExtracted(extracted.filter((_, i) => i !== index));
    }

    async function handleCreateAll() {
        if (!extracted || extracted.length === 0) return;
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/meetings/create-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: extracted, workspaceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create tasks');
            setCreated(data.created);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <span style={{ marginRight: 8 }}>🎤</span>
                        Meeting Task Extractor
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 4 }}>
                        Paste a meeting transcript or summary — AI will extract actionable tasks for <strong>{workspaceName}</strong>
                    </p>
                </div>
            </div>

            {/* Input Section */}
            {created === null && (
                <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="meeting-transcript">
                            Meeting Transcript or Summary
                        </label>
                        <textarea
                            id="meeting-transcript"
                            className="form-input"
                            rows={10}
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder={`Paste your meeting notes here...\n\nExample:\n"Sarah said she'll handle the homepage redesign by next Friday. Mike needs to update the API documentation. The team agreed to move the deadline for the MVP to April 30th — this is urgent. Alex will review the PRs by Wednesday."`}
                            style={{ fontFamily: 'var(--font-family)', resize: 'vertical', minHeight: 180 }}
                            disabled={extracting}
                        />
                        <div className="form-hint">Supports raw transcripts, meeting summaries, and bullet-point notes.</div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', alignItems: 'center' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleExtract}
                            disabled={extracting || !transcript.trim()}
                        >
                            {extracting ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>✦</span>
                                    Extracting with AI...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>✦</span> Extract Tasks
                                </span>
                            )}
                        </button>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                            Powered by Gemini
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="auth-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>
            )}

            {/* Extraction Results */}
            {extracted !== null && created === null && (
                <div className="glass-card pop-in" style={{ padding: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
                            Extracted Tasks
                            <span className="badge badge-blue" style={{ marginLeft: 8 }}>{extracted.length}</span>
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setExtracted(null); setTranscript(''); }}>
                                Start Over
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleCreateAll} disabled={creating || extracted.length === 0}>
                                {creating ? 'Creating...' : `Create ${extracted.length} Task${extracted.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>

                    {extracted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🤷</div>
                            <p>No actionable tasks found in the transcript.</p>
                            <p style={{ fontSize: 'var(--font-sm)', marginTop: 4 }}>Try providing more detailed meeting notes.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {extracted.map((task, idx) => (
                                <div
                                    key={idx}
                                    className="fade-in"
                                    style={{
                                        padding: 'var(--space-md) var(--space-lg)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        borderLeft: `4px solid var(--color-${task.color || priorityToColor(task.priority)})`,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: 'var(--space-md)',
                                        alignItems: 'start',
                                        animationDelay: `${idx * 80}ms`,
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        <input
                                            className="form-input"
                                            value={task.title}
                                            onChange={(e) => updateTask(idx, 'title', e.target.value)}
                                            style={{ fontWeight: 600, fontSize: 'var(--font-md)', background: 'transparent', border: '1px solid transparent', padding: '4px 8px' }}
                                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                                        />
                                        <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', paddingLeft: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: 'var(--text-tertiary)' }}>👤</span>
                                                <input
                                                    className="form-input"
                                                    value={task.assignee}
                                                    onChange={(e) => updateTask(idx, 'assignee', e.target.value)}
                                                    placeholder="Unassigned"
                                                    style={{ border: 'none', background: 'transparent', padding: '2px 4px', width: 120, fontSize: 'var(--font-sm)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: 'var(--text-tertiary)' }}>📅</span>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={task.deadline}
                                                    onChange={(e) => updateTask(idx, 'deadline', e.target.value)}
                                                    style={{ border: 'none', background: 'transparent', padding: '2px 4px', fontSize: 'var(--font-sm)' }}
                                                />
                                            </div>
                                            <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-cyan'}`}>{task.priority}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => removeTask(idx)}
                                        title="Remove task"
                                        style={{ color: 'var(--text-tertiary)', fontSize: 14 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Success State */}
            {created !== null && (
                <div className="glass-card pop-in" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 'var(--space-md)' }}>🎉</div>
                    <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                        {created} Task{created !== 1 ? 's' : ''} Created!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                        Tasks have been added to <strong>{workspaceName}</strong> and assigned team members have been notified.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => router.push(`/workspace/${workspaceId}/tasks`)}>
                            View Tasks
                        </button>
                        <button className="btn btn-secondary" onClick={() => { setCreated(null); setExtracted(null); setTranscript(''); }}>
                            Extract More
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function priorityToColor(priority: string): string {
    switch (priority) {
        case 'urgent': return 'red';
        case 'high': return 'orange';
        case 'medium': return 'amber';
        case 'low': return 'blue';
        default: return 'gray';
    }
}
