'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    cleanFolderName,
    getFolderSortOrder,
    getFolderIcon,
    getFolderAccentColor,
} from '@/lib/storyboard-helpers';

interface Folder {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    google_drive_folder_id?: string | null;
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string | null;
    createdTime: string | null;
}

function getDriveFileIcon(mimeType: string): string {
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('document')) return '📝';
    if (mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    return '📄';
}

export default function StoryboardListClient({
    folders: initialFolders,
    driveFiles: initialDriveFiles = [],
    workspaceId,
}: {
    folders: Folder[];
    driveFiles?: DriveFile[];
    workspaceId: string;
    role: string;
}) {
    const router = useRouter();
    const [folders, setFolders] = useState(initialFolders);
    const [driveFiles, setDriveFiles] = useState(initialDriveFiles);
    const [showCreate, setShowCreate] = useState(false);
    const [newFolder, setNewFolder] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [syncing, setSyncing] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const syncWithDrive = useCallback(async () => {
        setSyncing(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/storyboards/sync`);
            if (res.ok) {
                const data = await res.json();
                if (data.folders) setFolders(data.folders);
                if (data.driveFiles) setDriveFiles(data.driveFiles);
            }
        } catch (err) {
            console.error('Drive sync failed:', err);
        } finally {
            setSyncing(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        syncWithDrive();
    }, [syncWithDrive]);

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

    async function doDelete(folderId: string) {
        setDeletingId(folderId);
        setConfirmDeleteId(null);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/storyboards/${folderId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setFolders((prev) => prev.filter(f => f.id !== folderId));
            } else {
                const text = await res.text();
                console.error('Delete failed:', res.status, text);
                alert('Failed to delete folder: ' + text);
            }
        } catch (err) {
            console.error('Failed to delete folder:', err);
            alert('Failed to delete folder');
        } finally {
            setDeletingId(null);
        }
    }

    // Split into synced and app-created, sort synced by numeric prefix
    const syncedFolders = useMemo(() =>
        folders
            .filter(f => f.description === 'Synced from Google Drive')
            .sort((a, b) => getFolderSortOrder(a.name) - getFolderSortOrder(b.name)),
        [folders]
    );
    const appFolders = folders.filter(f => f.description !== 'Synced from Google Drive');

    function renderFolderCard(folder: Folder, isSynced = false) {
        const isConfirming = confirmDeleteId === folder.id;
        const isDeleting = deletingId === folder.id;
        const displayName = isSynced ? cleanFolderName(folder.name) : folder.name;
        const icon = isSynced ? getFolderIcon(folder.name) : '📁';
        const accentColor = isSynced ? getFolderAccentColor(folder.name) : 'var(--accent-blue)';

        return (
            <div
                key={folder.id}
                className="glass-card glow-hover"
                style={{
                    textAlign: 'left', width: '100%', fontFamily: 'var(--font-family)',
                    border: '1px solid var(--border-default)',
                    position: 'relative', overflow: 'hidden',
                    ...(isDeleting ? { opacity: 0.5, pointerEvents: 'none' as const } : {}),
                }}
            >
                {/* Color accent strip */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: accentColor, opacity: 0.8,
                }} />

                {/* Confirm delete overlay */}
                {isConfirming && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        background: 'rgba(255,255,255,0.95)', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', padding: '12px',
                    }}>
                        <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, textAlign: 'center' }}>
                            Delete &quot;{displayName}&quot;?
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-sm"
                                style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                onClick={() => doDelete(folder.id)}
                            >
                                Delete
                            </button>
                            <button
                                className="btn btn-sm"
                                style={{ background: '#eee', border: '1px solid #ccc', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                onClick={() => setConfirmDeleteId(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete trigger button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDeleteId(folder.id);
                    }}
                    title="Delete folder"
                    style={{
                        position: 'absolute', top: 12, right: 8, zIndex: 5,
                        background: 'rgba(255,255,255,0.85)', border: '1px solid #ddd',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                        padding: '3px 7px', lineHeight: 1, color: '#999',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999'; }}
                >
                    ✕
                </button>

                {/* Clickable area for navigation */}
                <div
                    onClick={() => {
                        if (!isConfirming) router.push(`/workspace/${workspaceId}/storyboards/${folder.id}`);
                    }}
                    style={{ padding: 'var(--space-lg)', paddingTop: 'calc(var(--space-lg) + 4px)', cursor: isConfirming ? 'default' : 'pointer' }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        marginBottom: 'var(--space-sm)',
                    }}>
                        <span style={{
                            fontSize: '28px', width: 44, height: 44, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: `${accentColor}12`, borderRadius: 10,
                        }}>{icon}</span>
                        {isSynced && (
                            <span style={{
                                fontSize: '9px', fontWeight: 600, color: 'hsl(145, 55%, 40%)',
                                background: 'hsl(145, 50%, 94%)', padding: '2px 7px',
                                borderRadius: 4, letterSpacing: '0.5px',
                            }}>DRIVE</span>
                        )}
                    </div>
                    <h3 style={{
                        fontSize: 'var(--font-lg)', fontWeight: 600,
                        color: 'var(--text-primary)', marginBottom: 'var(--space-xs)',
                    }}>{displayName}</h3>
                    {folder.description && folder.description !== 'Synced from Google Drive' && (
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>{folder.description}</p>
                    )}
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {isSynced ? 'Synced' : 'Created'} {new Date(folder.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Storyboards</h1>
                    {syncing && (
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid transparent', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 800ms linear infinite' }} />
                            Syncing Drive…
                        </span>
                    )}
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Folder</button>
            </div>

            {folders.length === 0 && driveFiles.length === 0 && !syncing ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⊞</div>
                    <div className="empty-state-title">No storyboard folders yet</div>
                    <div className="empty-state-desc">Create a folder to start organizing your storyboards.</div>
                </div>
            ) : (
                <>
                    {appFolders.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                            {appFolders.map((folder) => renderFolderCard(folder, false))}
                        </div>
                    )}

                    {syncedFolders.length > 0 && (
                        <>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <span style={{
                                    fontSize: 'var(--font-sm)', fontWeight: 600,
                                    color: 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Synced from Google Drive
                                </span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                <span style={{
                                    fontSize: 'var(--font-xs)', color: 'var(--text-muted)',
                                    background: 'var(--bg-secondary)', padding: '2px 8px',
                                    borderRadius: 10,
                                }}>
                                    {syncedFolders.length} folder{syncedFolders.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                                {syncedFolders.map((folder) => renderFolderCard(folder, true))}
                            </div>
                        </>
                    )}

                    {driveFiles.length > 0 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-tertiary)' }}>📎 Files in Drive</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
                                {driveFiles.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.webViewLink || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-card glow-hover"
                                        style={{
                                            padding: 'var(--space-md)',
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                            textDecoration: 'none', color: 'inherit',
                                            border: '1px solid var(--border-default)',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{getDriveFileIcon(file.mimeType)}</span>
                                        <div style={{ overflow: 'hidden', flex: 1 }}>
                                            <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                                            {file.createdTime && (
                                                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{new Date(file.createdTime).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>↗</span>
                                    </a>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {showCreate && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }} role="dialog" aria-modal="true" aria-label="Create folder">
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
