'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FilesListClient({ files: initialFiles, workspaceId }: { files: any[]; workspaceId: string }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<any[]>(initialFiles);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

            // Optimistic: add the file to local state immediately
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

            // Also refresh SSR data for consistency
            router.refresh();
        } catch {
            setUploadMsg({ type: 'error', text: 'Network error. Please check your connection and try again.' });
        } finally {
            setUploading(false);
            // Reset file input so same file can be re-selected
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
