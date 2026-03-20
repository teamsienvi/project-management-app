'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Folder {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export default function StoryboardListClient({ folders: initialFolders, workspaceId }: { folders: Folder[]; workspaceId: string; role: string }) {
    const router = useRouter();
    const [folders, setFolders] = useState(initialFolders);
    const [showCreate, setShowCreate] = useState(false);
    const [newFolder, setNewFolder] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setCreating(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/storyboards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolder.name, description: newFolder.description || undefined }),
        });
        if (res.ok) {
            const data = await res.json();
            setFolders((prev) => [data.folder, ...prev]);
            setShowCreate(false);
            setNewFolder({ name: '', description: '' });
        }
        setCreating(false);
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Storyboards</h1>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Folder</button>
            </div>

            {folders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⊞</div>
                    <div className="empty-state-title">No storyboard folders yet</div>
                    <div className="empty-state-desc">Create a folder to start organizing your storyboards and files.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                    {folders.map((folder) => (
                        <button
                            key={folder.id}
                            className="glass-card glow-hover"
                            onClick={() => router.push(`/workspace/${workspaceId}/storyboards/${folder.id}`)}
                            style={{ padding: 'var(--space-lg)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--font-family)', border: '1px solid var(--glass-border)' }}
                        >
                            <div style={{ fontSize: '24px', marginBottom: 'var(--space-sm)' }}>📁</div>
                            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{folder.name}</h3>
                            {folder.description && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>{folder.description}</p>}
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>Created {new Date(folder.created_at).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowCreate(false); }} role="dialog" aria-modal="true" aria-label="Create folder">
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', width: '100%', maxWidth: 460 }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>New Storyboard Folder</h2>
                        <form onSubmit={handleCreate} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="folder-name">Name</label>
                                <input id="folder-name" className="form-input" value={newFolder.name} onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="folder-desc">Description</label>
                                <textarea id="folder-desc" className="form-input" rows={2} value={newFolder.description} onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Folder'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
