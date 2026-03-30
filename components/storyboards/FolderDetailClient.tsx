'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Types ─── */
interface DriveFile {
    id: string; name: string; mimeType: string;
    webViewLink: string | null; createdTime: string | null;
}
interface PreviewData {
    previewUrl: string; previewType: string; name: string;
    mimeType: string; webViewLink: string;
}
interface Note {
    id: string; title: string; format: string;
    content?: string; created_at: string; updated_at: string;
}

/* ─── Helpers ─── */
function getFileIcon(m: string): string {
    if (m.includes('spreadsheet')) return '📊'; if (m.includes('document') || m.includes('word')) return '📝';
    if (m.includes('presentation')) return '📽️'; if (m.startsWith('image/')) return '🖼️';
    if (m.startsWith('video/')) return '🎬'; if (m.startsWith('audio/')) return '🎵';
    if (m.includes('pdf')) return '📕'; return '📄';
}
function getFileColor(m: string): string {
    if (m.includes('spreadsheet')) return '#0f9d58'; if (m.includes('document') || m.includes('word')) return '#4285f4';
    if (m.includes('presentation')) return '#f4b400'; if (m.startsWith('image/')) return '#e040fb';
    if (m.startsWith('video/')) return '#e53935'; if (m.startsWith('audio/')) return '#ff6d00';
    if (m.includes('pdf')) return '#db4437'; return '#5f6368';
}
function formatFileSize(b: number): string {
    if (b < 1024) return `${b} B`; if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
function getShortType(m: string): string {
    if (m.includes('spreadsheet')) return 'Spreadsheet'; if (m.includes('document') || m.includes('word')) return 'Document';
    if (m.includes('presentation')) return 'Slides'; if (m.startsWith('image/')) return 'Image';
    if (m.startsWith('video/')) return 'Video'; if (m.startsWith('audio/')) return 'Audio';
    if (m.includes('pdf')) return 'PDF'; return 'File';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface FolderDetailClientProps {
    folder: any; subFolders: any[]; files: any[];
    driveFiles?: DriveFile[]; notes?: Note[]; workspaceId: string;
}

type ViewMode = 'list' | 'grid';
type ModalType = 'none' | 'newFolder' | 'newNote' | 'editNote';

export default function FolderDetailClient({
    folder, subFolders: initialSubFolders, files: initialFiles,
    driveFiles = [], notes: initialNotes = [], workspaceId,
}: FolderDetailClientProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ─── State ─── */
    const [uploading, setUploading] = useState(false);
    const [subFolders, setSubFolders] = useState(initialSubFolders);
    const [files, setFiles] = useState(initialFiles);
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<string | null>(null);
    const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Modals
    const [modal, setModal] = useState<ModalType>('none');
    const [newFolderName, setNewFolderName] = useState('');
    const [newNoteName, setNewNoteName] = useState('');
    const [newNoteFormat, setNewNoteFormat] = useState<'markdown' | 'plaintext'>('markdown');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [creatingNote, setCreatingNote] = useState(false);

    // Note editor
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState('');
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('storyboard-view-mode');
        if (saved === 'list' || saved === 'grid') setViewMode(saved);
    }, []);

    function changeViewMode(mode: ViewMode) {
        setViewMode(mode);
        localStorage.setItem('storyboard-view-mode', mode);
    }

    /* ─── File Upload ─── */
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

    /* ─── Preview ─── */
    async function openPreview(fileId: string) {
        setLoadingPreview(true);
        try {
            const res = await fetch(`/api/files/${fileId}/preview`);
            if (res.ok) { setPreview(await res.json()); }
            else {
                const res2 = await fetch(`/api/files/${fileId}/open`);
                if (res2.ok) { const d = await res2.json(); window.open(d.url, '_blank'); }
            }
        } catch { /* noop */ } finally { setLoadingPreview(false); }
    }

    async function openDrivePreview(df: DriveFile) {
        setLoadingPreview(true);
        try {
            const res = await fetch(`/api/drive/preview?fileId=${df.id}&mimeType=${encodeURIComponent(df.mimeType)}&name=${encodeURIComponent(df.name)}`);
            if (res.ok) { setPreview(await res.json()); }
            else { window.open(df.webViewLink || '#', '_blank'); }
        } catch { window.open(df.webViewLink || '#', '_blank'); }
        finally { setLoadingPreview(false); }
    }

    /* ─── Create Subfolder ─── */
    async function handleCreateFolder() {
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/storyboards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName.trim(), parentFolderId: folder.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setSubFolders(prev => [...prev, data.folder]);
                setNewFolderName('');
                setModal('none');
            }
        } catch (err) { console.error(err); }
        finally { setCreatingFolder(false); }
    }

    /* ─── Create Note ─── */
    async function handleCreateNote() {
        if (!newNoteName.trim()) return;
        setCreatingNote(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/storyboards/${folder.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newNoteName.trim(), format: newNoteFormat }),
            });
            if (res.ok) {
                const data = await res.json();
                setNotes(prev => [data.note, ...prev]);
                setNewNoteName('');
                setModal('none');
                // Open the note for editing immediately
                openNoteEditor(data.note);
            }
        } catch (err) { console.error(err); }
        finally { setCreatingNote(false); }
    }

    /* ─── Note Editor ─── */
    async function openNoteEditor(note: Note) {
        // Fetch full content
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/storyboards/${folder.id}/notes/${note.id}`);
            if (res.ok) {
                const data = await res.json();
                setEditingNote(data.note);
                setNoteContent(data.note.content || '');
                setNoteTitle(data.note.title || '');
                setModal('editNote');
            }
        } catch (err) { console.error(err); }
    }

    const saveNote = useCallback(async () => {
        if (!editingNote) return;
        setSaving(true);
        try {
            await fetch(`/api/workspaces/${workspaceId}/storyboards/${folder.id}/notes/${editingNote.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: noteTitle, content: noteContent }),
            });
            setLastSaved(new Date().toLocaleTimeString());
            // Update in the list
            setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, title: noteTitle, updated_at: new Date().toISOString() } : n));
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }, [editingNote, noteTitle, noteContent, workspaceId, folder.id]);

    // Auto-save debounce
    function handleNoteChange(content: string) {
        setNoteContent(content);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveNote(), 1500);
    }

    function handleTitleChange(title: string) {
        setNoteTitle(title);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveNote(), 1500);
    }

    function closeEditor() {
        if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); }
        saveNote();
        setEditingNote(null);
        setModal('none');
    }

    /* ─── Deletes ─── */
    async function doDeleteFile(fileId: string) {
        setDeletingId(fileId); setConfirmDeleteFileId(null);
        try { const r = await fetch(`/api/files/${fileId}`, { method: 'DELETE' }); if (r.ok) setFiles(p => p.filter(f => f.id !== fileId)); }
        catch (e) { console.error(e); } finally { setDeletingId(null); }
    }
    async function doDeleteSubFolder(folderId: string) {
        setDeletingId(folderId); setConfirmDeleteId(null);
        try { const r = await fetch(`/api/workspaces/${workspaceId}/storyboards/${folderId}`, { method: 'DELETE' }); if (r.ok) setSubFolders(p => p.filter(f => f.id !== folderId)); }
        catch (e) { console.error(e); } finally { setDeletingId(null); }
    }
    async function doDeleteNote(noteId: string) {
        setDeletingId(noteId); setConfirmDeleteNoteId(null);
        try {
            const r = await fetch(`/api/workspaces/${workspaceId}/storyboards/${folder.id}/notes/${noteId}`, { method: 'DELETE' });
            if (r.ok) setNotes(p => p.filter(n => n.id !== noteId));
        } catch (e) { console.error(e); } finally { setDeletingId(null); }
    }

    const syncedSubFolders = subFolders.filter((f: any) => f.description === 'Synced from Google Drive');
    const appSubFolders = subFolders.filter((f: any) => f.description !== 'Synced from Google Drive');
    const allFiles: Array<{ type: 'db' | 'drive'; data: any }> = [
        ...files.map((f: any) => ({ type: 'db' as const, data: f })),
        ...driveFiles.map(f => ({ type: 'drive' as const, data: f })),
    ];

    /* ─── Render helpers ─── */
    function renderSubFolderCard(sf: any, isSynced = false) {
        const isConfirming = confirmDeleteId === sf.id;
        const isDeleting = deletingId === sf.id;
        return (
            <div key={sf.id} className="glass-card glow-hover" style={{ textAlign: 'left', width: '100%', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', ...(isSynced ? { background: '#f8f6f0' } : {}), ...(isDeleting ? { opacity: 0.5, pointerEvents: 'none' as const } : {}) }}>
                {isConfirming && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>Delete &quot;{sf.name}&quot;?</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => doDeleteSubFolder(sf.id)}>Delete</button>
                            <button style={{ background: '#eee', border: '1px solid #ccc', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                        </div>
                    </div>
                )}
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(sf.id); }} title="Delete" style={{ position: 'absolute', top: 6, right: 6, zIndex: 5, background: 'rgba(255,255,255,0.85)', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 11, padding: '2px 6px', lineHeight: 1, color: '#999', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999'; }}
                >✕</button>
                <div onClick={() => { if (!isConfirming) router.push(`/workspace/${workspaceId}/storyboards/${sf.id}`); }} style={{ padding: 'var(--space-md)', cursor: isConfirming ? 'default' : 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>📁</span>
                        {isSynced && <span className="badge badge-success" style={{ fontSize: 9 }}>DRIVE</span>}
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sf.name}</div>
                </div>
            </div>
        );
    }

    function renderNoteCard(note: Note) {
        const isConfirming = confirmDeleteNoteId === note.id;
        const isDeleting = deletingId === note.id;
        return (
            <div key={note.id} className="glass-card glow-hover" style={{ textAlign: 'left', width: '100%', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden', ...(isDeleting ? { opacity: 0.5, pointerEvents: 'none' as const } : {}) }}>
                {isConfirming && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>Delete &quot;{note.title}&quot;?</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => doDeleteNote(note.id)}>Delete</button>
                            <button style={{ background: '#eee', border: '1px solid #ccc', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => setConfirmDeleteNoteId(null)}>Cancel</button>
                        </div>
                    </div>
                )}
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteNoteId(note.id); }} title="Delete" style={{ position: 'absolute', top: 6, right: 6, zIndex: 5, background: 'rgba(255,255,255,0.85)', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 11, padding: '2px 6px', lineHeight: 1, color: '#999', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999'; }}
                >✕</button>
                <div onClick={() => openNoteEditor(note)} style={{ padding: 'var(--space-md)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{note.format === 'markdown' ? '📝' : '📄'}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{note.format === 'markdown' ? 'MD' : 'TXT'}</span>
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{note.title}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                        Edited {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        );
    }

    function renderFileCard(item: { type: 'db' | 'drive'; data: any }) {
        const isDb = item.type === 'db';
        const name = isDb ? item.data.original_name : item.data.name;
        const mimeType = isDb ? (item.data.mime_type || '') : item.data.mimeType;
        const id = item.data.id;
        const isDeleting = deletingId === id;
        const isConfirming = confirmDeleteFileId === id;
        return (
            <div key={id} className="glass-card glow-hover" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-default)', ...(isDeleting ? { opacity: 0.5, pointerEvents: 'none' as const } : {}) }}>
                {isConfirming && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, textAlign: 'center' }}>Delete?</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }} onClick={() => isDb ? doDeleteFile(id) : null}>Delete</button>
                            <button style={{ background: '#eee', border: '1px solid #ccc', padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }} onClick={() => setConfirmDeleteFileId(null)}>Cancel</button>
                        </div>
                    </div>
                )}
                {isDb && (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteFileId(id); }} title="Delete" style={{ position: 'absolute', top: 6, right: 6, zIndex: 5, background: 'rgba(255,255,255,0.85)', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 11, padding: '2px 6px', lineHeight: 1, color: '#999', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999'; }}
                    >✕</button>
                )}
                <div onClick={() => isDb ? openPreview(id) : openDrivePreview(item.data)} style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, margin: '0 auto var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${getFileColor(mimeType)}15`, fontSize: 28 }}>
                        {getFileIcon(mimeType)}
                    </div>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{getShortType(mimeType)}</p>
                    {isDb && item.data.size_bytes && <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{formatFileSize(item.data.size_bytes)}</p>}
                </div>
            </div>
        );
    }

    function renderFileRow(item: { type: 'db' | 'drive'; data: any }) {
        const isDb = item.type === 'db';
        const name = isDb ? item.data.original_name : item.data.name;
        const mimeType = isDb ? (item.data.mime_type || '') : item.data.mimeType;
        const id = item.data.id;
        const isDeleting = deletingId === id;
        const date = isDb ? item.data.created_at : item.data.createdTime;
        return (
            <tr key={id} style={{ cursor: 'pointer', ...(isDeleting ? { opacity: 0.5 } : {}) }} onClick={() => isDb ? openPreview(id) : openDrivePreview(item.data)}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18, flexShrink: 0 }}>{getFileIcon(mimeType)}</span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{name}</span>{!isDb && <span className="badge badge-success" style={{ fontSize: 8 }}>DRIVE</span>}</div></td>
                <td>{getShortType(mimeType)}</td>
                <td>{isDb && item.data.size_bytes ? formatFileSize(item.data.size_bytes) : '—'}</td>
                <td>{date ? new Date(date).toLocaleDateString() : '—'}</td>
                <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {isDb && (confirmDeleteFileId === id ? (
                            <><button style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => doDeleteFile(id)}>Yes</button>
                            <button style={{ background: '#eee', border: '1px solid #ccc', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => setConfirmDeleteFileId(null)}>No</button></>
                        ) : (
                            <button type="button" onClick={() => setConfirmDeleteFileId(id)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 11, padding: '2px 6px', color: '#999', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999'; }}
                            >✕</button>
                        ))}
                    </div>
                </td>
            </tr>
        );
    }

    /* ─── Main render ─── */
    return (
        <div>
            <button className="btn btn-ghost" onClick={() => router.push(`/workspace/${workspaceId}/storyboards`)} style={{ marginBottom: 'var(--space-md)' }}>← Back to Storyboards</button>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>{folder.name}</h1>
                    {folder.description && folder.description !== 'Synced from Google Drive' && <p style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>{folder.description}</p>}
                    {folder.description === 'Synced from Google Drive' && <span className="badge badge-success" style={{ marginTop: 'var(--space-xs)' }}>Synced from Google Drive</span>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => { setNewFolderName(''); setModal('newFolder'); }} style={{ fontSize: 13 }}>📁 New Folder</button>
                    <button className="btn btn-secondary" onClick={() => { setNewNoteName(''); setNewNoteFormat('markdown'); setModal('newNote'); }} style={{ fontSize: 13 }}>📝 New Note</button>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : '⬆ Upload'}</button>
                </div>
            </div>

            {/* Subfolders */}
            {(appSubFolders.length > 0 || syncedSubFolders.length > 0) && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Folders</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
                        {appSubFolders.map((sf: any) => renderSubFolderCard(sf, false))}
                        {syncedSubFolders.map((sf: any) => renderSubFolderCard(sf, true))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Notes</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
                        {notes.map(note => renderNoteCard(note))}
                    </div>
                </div>
            )}

            {/* Files */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>Files</h2>
                {allFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', borderRadius: 8, padding: 2 }}>
                        <button onClick={() => changeViewMode('grid')} title="Grid view" style={{ padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1, transition: 'all 0.15s', background: viewMode === 'grid' ? 'white' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)' }}>▦</button>
                        <button onClick={() => changeViewMode('list')} title="List view" style={{ padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1, transition: 'all 0.15s', background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}>☰</button>
                    </div>
                )}
            </div>

            {allFiles.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⧉</div>
                    <div className="empty-state-title">No files yet</div>
                    <div className="empty-state-desc">Upload a file, create a note, or add files in Google Drive.</div>
                </div>
            ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-md)' }}>
                    {allFiles.map(item => renderFileCard(item))}
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Date</th><th></th></tr></thead>
                        <tbody>{allFiles.map(item => renderFileRow(item))}</tbody>
                    </table>
                </div>
            )}

            {/* ═══ Modals ═══ */}

            {/* New Folder modal */}
            {modal === 'newFolder' && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal('none'); }} role="dialog" aria-modal="true">
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', width: '100%', maxWidth: 420 }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>New Subfolder</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="sf-name">Folder name</label>
                                <input id="sf-name" className="form-input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} required autoFocus />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal('none')}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creatingFolder}>{creatingFolder ? 'Creating...' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Note modal */}
            {modal === 'newNote' && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal('none'); }} role="dialog" aria-modal="true">
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', width: '100%', maxWidth: 420 }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>New Note</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateNote(); }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="note-title">Title</label>
                                <input id="note-title" className="form-input" value={newNoteName} onChange={(e) => setNewNoteName(e.target.value)} required autoFocus placeholder="My note..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Format</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={() => setNewNoteFormat('markdown')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: newNoteFormat === 'markdown' ? '2px solid var(--accent-blue)' : '1px solid #ddd', background: newNoteFormat === 'markdown' ? '#e8f0fe' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                                        📝 Markdown
                                    </button>
                                    <button type="button" onClick={() => setNewNoteFormat('plaintext')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: newNoteFormat === 'plaintext' ? '2px solid var(--accent-blue)' : '1px solid #ddd', background: newNoteFormat === 'plaintext' ? '#e8f0fe' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                                        📄 Plain Text
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal('none')}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creatingNote}>{creatingNote ? 'Creating...' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Note Editor (full-screen overlay) */}
            {modal === 'editNote' && editingNote && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 900, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        {/* Editor header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #e5e5e5', background: '#fafafa', borderRadius: '16px 16px 0 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                <span style={{ fontSize: 18 }}>{editingNote.format === 'markdown' ? '📝' : '📄'}</span>
                                <input
                                    value={noteTitle}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    style={{ border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, background: 'transparent', flex: 1, padding: '4px 0' }}
                                    placeholder="Note title..."
                                />
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                                    {editingNote.format === 'markdown' ? 'MARKDOWN' : 'PLAIN TEXT'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {saving && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saving...</span>}
                                {!saving && lastSaved && <span style={{ fontSize: 12, color: '#0f9d58' }}>✓ Saved {lastSaved}</span>}
                                <button onClick={() => { saveNote(); }} className="btn btn-primary" style={{ fontSize: 12, padding: '4px 12px' }}>Save</button>
                                <button onClick={closeEditor} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 16, padding: '4px 10px', color: '#666', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >✕</button>
                            </div>
                        </div>
                        {/* Editor body */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <textarea
                                value={noteContent}
                                onChange={(e) => handleNoteChange(e.target.value)}
                                style={{
                                    width: '100%', height: '100%', border: 'none', outline: 'none',
                                    padding: '20px 24px', fontSize: 15, lineHeight: 1.7, resize: 'none',
                                    fontFamily: editingNote.format === 'markdown' ? "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" : "'Inter', system-ui, sans-serif",
                                    color: '#1a1a1a', background: '#fff',
                                }}
                                placeholder={editingNote.format === 'markdown' ? '# Start writing in Markdown...\n\nUse **bold**, *italic*, `code`, and more.' : 'Start writing...'}
                                spellCheck
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {loadingPreview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'inline-block', width: 20, height: 20, border: '3px solid #ddd', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 800ms linear infinite' }} />
                        <span style={{ fontWeight: 500 }}>Loading preview…</span>
                    </div>
                </div>
            )}
            {preview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setPreview(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 1100, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e5e5e5', background: '#fafafa', borderRadius: '16px 16px 0 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>{getFileIcon(preview.mimeType)}</span>
                                <span style={{ fontWeight: 600, fontSize: 15 }}>{preview.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{getShortType(preview.mimeType)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <a href={preview.webViewLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--accent-blue)' }} onClick={(e) => e.stopPropagation()}>Open in Drive ↗</a>
                                <button onClick={() => setPreview(null)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 16, padding: '4px 10px', color: '#666' }}>✕</button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}><iframe src={preview.previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay" title={preview.name} /></div>
                    </div>
                </div>
            )}
        </div>
    );
}
