'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    cleanFolderName,
    getFolderSortOrder,
    getFolderIcon,
    getFolderAccentColor,
} from '@/lib/storyboard-helpers';

interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string | null;
    createdTime: string | null;
}

function getFileIcon(m: string): string {
    if (m.includes('spreadsheet')) return '📊';
    if (m.includes('document') || m.includes('word')) return '📝';
    if (m.includes('presentation')) return '📽️';
    if (m.startsWith('image/')) return '🖼️';
    if (m.startsWith('video/')) return '🎬';
    if (m.startsWith('audio/')) return '🎵';
    if (m.includes('pdf')) return '📕';
    if (m.includes('text/') || m.includes('markdown')) return '📄';
    if (m.includes('zip') || m.includes('archive') || m.includes('compressed')) return '📦';
    return '📄';
}

function getShortType(m: string): string {
    if (m.includes('spreadsheet')) return 'Spreadsheet';
    if (m.includes('document') || m.includes('word')) return 'Document';
    if (m.includes('presentation')) return 'Slides';
    if (m.startsWith('image/')) return 'Image';
    if (m.startsWith('video/')) return 'Video';
    if (m.startsWith('audio/')) return 'Audio';
    if (m.includes('pdf')) return 'PDF';
    if (m.includes('zip') || m.includes('archive')) return 'Archive';
    if (m.includes('text/') || m.includes('markdown')) return 'Text';
    return 'File';
}

function getFileColor(m: string): string {
    if (m.includes('spreadsheet')) return '#0f9d58';
    if (m.includes('document') || m.includes('word')) return '#4285f4';
    if (m.includes('presentation')) return '#f4b400';
    if (m.startsWith('image/')) return '#e040fb';
    if (m.startsWith('video/')) return '#e53935';
    if (m.startsWith('audio/')) return '#ff6d00';
    if (m.includes('pdf')) return '#db4437';
    return '#5f6368';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FilesListClient({
    files: initialFiles,
    workspaceId,
    driveFolders = [],
    driveFiles = [],
    driveIdToStoryboardId = {},
}: {
    files: any[];
    workspaceId: string;
    driveFolders?: DriveItem[];
    driveFiles?: DriveItem[];
    driveIdToStoryboardId?: Record<string, string>;
}) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<any[]>(initialFiles);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sort Drive folders by numeric prefix
    const sortedDriveFolders = [...driveFolders].sort(
        (a, b) => getFolderSortOrder(a.name) - getFolderSortOrder(b.name)
    );

    async function handleUpload(file: File) {
        setUploading(true);
        setUploadMsg(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('targetFolderType', 'general');

        try {
            const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                setUploadMsg({ type: 'error', text: data.error || 'Upload failed. Please try again.' });
                setUploading(false);
                return;
            }

            setFiles((prev) => [{
                id: data.file.id,
                original_name: data.file.originalName,
                mime_type: file.type || null,
                size_bytes: file.size,
                profiles: null,
                created_at: new Date().toISOString(),
                google_drive_web_view_link: data.file.webViewLink,
            }, ...prev]);

            setUploadMsg({ type: 'success', text: `"${file.name}" uploaded successfully.` });
            router.refresh();
        } catch {
            setUploadMsg({ type: 'error', text: 'Network error. Please check your connection and try again.' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleOpen(fileId: string) {
        const res = await fetch(`/api/files/${fileId}/open`);
        if (res.ok) {
            const data = await res.json();
            window.open(data.url, '_blank');
        }
    }

    async function handleDelete(fileId: string) {
        if (!confirm('Delete this file?')) return;
        await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        router.refresh();
    }

    const hasDriveContent = sortedDriveFolders.length > 0 || driveFiles.length > 0;
    const isEmpty = files.length === 0 && !hasDriveContent;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Docs & Files</h1>
                <div>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : '⬆ Upload File'}
                    </button>
                </div>
            </div>

            {uploadMsg && (
                <div style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-sm)',
                    background: uploadMsg.type === 'success' ? 'rgba(29,233,182,0.1)' : 'rgba(255,82,82,0.1)',
                    border: `1px solid ${uploadMsg.type === 'success' ? 'rgba(29,233,182,0.2)' : 'rgba(255,82,82,0.2)'}`,
                    color: uploadMsg.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>{uploadMsg.text}</span>
                    <button onClick={() => setUploadMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'var(--font-lg)' }}>×</button>
                </div>
            )}

            {isEmpty ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⧉</div>
                    <div className="empty-state-title">No files uploaded yet</div>
                    <div className="empty-state-desc">Upload files to this workspace to share with your team.</div>
                </div>
            ) : (
                <>
                    {/* Google Drive Folders */}
                    {sortedDriveFolders.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <span style={{
                                    fontSize: 'var(--font-sm)', fontWeight: 600,
                                    color: 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                    Folders from Google Drive
                                </span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                <span style={{
                                    fontSize: 'var(--font-xs)', color: 'var(--text-muted)',
                                    background: 'var(--bg-secondary)', padding: '2px 8px',
                                    borderRadius: 10,
                                }}>
                                    {sortedDriveFolders.length} folder{sortedDriveFolders.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                                {sortedDriveFolders.map((folder) => {
                                    const displayName = cleanFolderName(folder.name);
                                    const icon = getFolderIcon(folder.name);
                                    const accentColor = getFolderAccentColor(folder.name);

                                    return (
                                        <div
                                            key={folder.id}
                                            className="glass-card glow-hover"
                                            onClick={() => {
                                                const storyboardId = driveIdToStoryboardId?.[folder.id];
                                                if (storyboardId) {
                                                    router.push(`/workspace/${workspaceId}/storyboards/${storyboardId}`);
                                                } else {
                                                    router.push(`/workspace/${workspaceId}/storyboards`);
                                                }
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                border: '1px solid var(--border-default)',
                                                position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            {/* Color accent strip */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                                background: accentColor, opacity: 0.7,
                                            }} />
                                            <div style={{ padding: 'var(--space-md)', paddingTop: 'calc(var(--space-md) + 4px)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <span style={{
                                                        fontSize: 22, width: 36, height: 36, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        background: `${accentColor}12`, borderRadius: 8,
                                                    }}>{icon}</span>
                                                    <span style={{
                                                        fontSize: 8, fontWeight: 600, color: 'hsl(145, 55%, 40%)',
                                                        background: 'hsl(145, 50%, 94%)', padding: '1px 6px',
                                                        borderRadius: 3, letterSpacing: '0.5px',
                                                    }}>DRIVE</span>
                                                </div>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{displayName}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Drive loose files */}
                    {driveFiles.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                    📎 Files in Google Drive
                                </span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10 }}>
                                    {driveFiles.length}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-md)' }}>
                                {driveFiles.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.webViewLink || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-card glow-hover"
                                        style={{
                                            textDecoration: 'none', color: 'inherit',
                                            border: '1px solid var(--border-default)',
                                            padding: 'var(--space-md)', textAlign: 'center',
                                        }}
                                    >
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 10,
                                            margin: '0 auto var(--space-sm)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: `${getFileColor(file.mimeType)}15`,
                                            fontSize: 24,
                                        }}>
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <p style={{
                                            fontSize: 'var(--font-xs)', fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{file.name}</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                                            {getShortType(file.mimeType)}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Uploaded files from DB */}
                    {files.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>Uploaded Files</h2>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10 }}>
                                    {files.length}
                                </span>
                            </div>
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Name</th><th>Type</th><th>Size</th><th>Uploader</th><th>Date</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {files.map((file: any) => (
                                            <tr key={file.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>{getFileIcon(file.mime_type || '')}</span>
                                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.original_name}</span>
                                                    </div>
                                                </td>
                                                <td>{getShortType(file.mime_type || '')}</td>
                                                <td>{file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : '—'}</td>
                                                <td>{file.profiles?.full_name || '—'}</td>
                                                <td>{new Date(file.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(file.id)}>Open</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(file.id)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
