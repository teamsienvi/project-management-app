'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FilesListClient({ files, workspaceId }: { files: any[]; workspaceId: string }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleUpload(file: File) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('targetFolderType', 'general');
        await fetch('/api/files/upload', { method: 'POST', body: formData });
        setUploading(false);
        router.refresh();
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
        router.refresh();
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Files</h1>
                <div>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : '⬆ Upload File'}
                    </button>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⧉</div>
                    <div className="empty-state-title">No files uploaded yet</div>
                    <div className="empty-state-desc">Upload files to this workspace to share with your team.</div>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Type</th><th>Size</th><th>Uploader</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {files.map((file: any) => (
                                <tr key={file.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.original_name}</td>
                                    <td>{file.mime_type || '—'}</td>
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
            )}
        </div>
    );
}
