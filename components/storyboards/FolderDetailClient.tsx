'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface FolderDetailClientProps {
    folder: any;
    subFolders: any[];
    files: any[];
    workspaceId: string;
}

export default function FolderDetailClient({ folder, subFolders, files, workspaceId }: FolderDetailClientProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleUpload(file: File) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('storyboardFolderId', folder.id);
        formData.append('targetFolderType', 'storyboard');

        await fetch('/api/files/upload', { method: 'POST', body: formData });
        setUploading(false);
        router.refresh();
    }

    async function handleOpenFile(fileId: string) {
        const res = await fetch(`/api/files/${fileId}/open`);
        if (res.ok) {
            const data = await res.json();
            window.open(data.url, '_blank');
        }
    }

    return (
        <div>
            <button className="btn btn-ghost" onClick={() => router.push(`/workspace/${workspaceId}/storyboards`)} style={{ marginBottom: 'var(--space-md)' }}>
                ← Back to Storyboards
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>{folder.name}</h1>
                    {folder.description && <p style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>{folder.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : '⬆ Upload File'}
                    </button>
                </div>
            </div>

            {/* Subfolders */}
            {subFolders.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Subfolders</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                        {subFolders.map((sf: any) => (
                            <button key={sf.id} className="glass-card glow-hover" onClick={() => router.push(`/workspace/${workspaceId}/storyboards/${sf.id}`)}
                                style={{ padding: 'var(--space-md)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--font-family)', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '20px', marginBottom: 'var(--space-xs)' }}>📁</div>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sf.name}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Files */}
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Files</h2>
            {files.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⧉</div>
                    <div className="empty-state-title">No files yet</div>
                    <div className="empty-state-desc">Upload a file to this folder to get started.</div>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {files.map((file: any) => (
                                <tr key={file.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.original_name}</td>
                                    <td>{file.mime_type || '—'}</td>
                                    <td>{file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : '—'}</td>
                                    <td>{new Date(file.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenFile(file.id)}>Open</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
