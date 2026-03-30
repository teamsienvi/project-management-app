'use client';

import { useState, type FormEvent } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string | null;
    created_at: string;
}

interface MembersClientProps {
    members: any[];
    workspace: { name: string; join_code: string; join_code_enabled: boolean };
    workspaceId: string;
    currentUserRole: string;
    currentUserId: string;
    pendingInvitations: Invitation[];
}

export default function MembersClient({ members, workspace, workspaceId, currentUserRole, currentUserId, pendingInvitations }: MembersClientProps) {
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState('');

    const [joinCode, setJoinCode] = useState(workspace.join_code);
    const [joinCodeEnabled, setJoinCodeEnabled] = useState(workspace.join_code_enabled);
    const [copiedCode, setCopiedCode] = useState(false);
    const [rotatingCode, setRotatingCode] = useState(false);

    const canManage = currentUserRole === 'owner' || currentUserRole === 'manager';
    const isOwner = currentUserRole === 'owner';

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    async function handleInvite(e: FormEvent) {
        e.preventDefault();
        setInviting(true);
        setInviteMsg('');
        const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });
        const data = await res.json();
        if (res.ok) {
            setInviteMsg(data.emailSent ? 'Invitation email sent!' : 'Invitation created (email delivery was skipped).');
            setInviteEmail('');
        } else {
            setInviteMsg(data.error || 'Failed to send invite');
        }
        setInviting(false);
    }

    async function handleRoleChange(memberId: string, newRole: string) {
        await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
        });
        window.location.reload();
    }

    function copyJoinCode() {
        navigator.clipboard.writeText(joinCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    }

    async function rotateJoinCode() {
        if (!confirm('Rotate the invite code? The current code will stop working.')) return;
        setRotatingCode(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/join-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rotate' }),
        });
        if (res.ok) {
            const data = await res.json();
            setJoinCode(data.joinCode);
        }
        setRotatingCode(false);
    }

    async function toggleJoinCode() {
        const action = joinCodeEnabled ? 'disable' : 'enable';
        const res = await fetch(`/api/workspaces/${workspaceId}/join-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        });
        if (res.ok) {
            const data = await res.json();
            setJoinCodeEnabled(data.joinCodeEnabled);
        }
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Team</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
                        {workspace.name} · {members.length} member{members.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => { setShowInvite(true); setInviteMsg(''); }}>
                        + Invite
                    </button>
                )}
            </div>

            {/* Workspace Invite Code */}
            {canManage && (
                <div style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-lg)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Invite Code</span>
                        {isOwner && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={joinCodeEnabled} onChange={toggleJoinCode} style={{ cursor: 'pointer' }} />
                                {joinCodeEnabled ? 'Active' : 'Disabled'}
                            </label>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', marginBottom: 'var(--space-sm)' }}>
                        Share this code so others can join as a member.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <code style={{
                            flex: 1,
                            fontSize: 'var(--font-lg)',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            background: 'var(--bg-tertiary)',
                            padding: '6px var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            color: joinCodeEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            opacity: joinCodeEnabled ? 1 : 0.5,
                            userSelect: 'all',
                            border: '1px solid var(--border-subtle)',
                        }}>{joinCode}</code>
                        <button className="btn btn-sm btn-secondary" onClick={copyJoinCode} disabled={!joinCodeEnabled}>
                            {copiedCode ? '✓ Copied' : 'Copy'}
                        </button>
                        {isOwner && (
                            <button className="btn btn-sm btn-ghost" onClick={rotateJoinCode} disabled={rotatingCode}>
                                {rotatingCode ? '...' : 'Rotate'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Role</th>
                            <th>Joined</th>
                            {isOwner && <th style={{ width: 120 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m: any) => (
                            <tr key={m.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div className="avatar avatar-sm" style={{ fontSize: '9px' }}>
                                            {getInitials(m.profiles?.full_name || null)}
                                        </div>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 'var(--font-sm)' }}>
                                            {m.profiles?.full_name || 'Unknown'}
                                            {m.user_id === currentUserId && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (you)</span>}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${m.role === 'owner' ? 'badge-cyan' : m.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>{m.role}</span>
                                </td>
                                <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                                {isOwner && (
                                    <td>
                                        {m.role !== 'owner' && m.user_id !== currentUserId && (
                                            <select
                                                className="form-input"
                                                style={{ width: 'auto', padding: '3px 6px', fontSize: 'var(--font-xs)' }}
                                                value={m.role}
                                                onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                                aria-label={`Change role for ${m.profiles?.full_name}`}
                                            >
                                                <option value="manager">Manager</option>
                                                <option value="member">Member</option>
                                            </select>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pending Invitations */}
            {canManage && pendingInvitations.length > 0 && (
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>
                        Pending Invitations · {pendingInvitations.length}
                    </h2>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Email</th><th>Role</th><th>Sent</th><th>Expires</th></tr>
                            </thead>
                            <tbody>
                                {pendingInvitations.map((inv) => (
                                    <tr key={inv.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 'var(--font-sm)' }}>{inv.email}</td>
                                        <td><span className={`badge ${inv.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>{inv.role}</span></td>
                                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInvite && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowInvite(false); }} role="dialog" aria-modal="true" aria-label="Invite member">
                    <div style={{
                        padding: 'var(--space-xl)',
                        width: '100%',
                        maxWidth: 420,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Invite by Email</h2>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', marginBottom: 'var(--space-md)' }}>
                            They&apos;ll receive an email with a link to accept.
                        </p>
                        {inviteMsg && (
                            <div style={{
                                padding: 'var(--space-sm) var(--space-md)',
                                background: inviteMsg.includes('sent') || inviteMsg.includes('created') ? 'rgba(77,182,172,0.08)' : 'rgba(239,83,80,0.08)',
                                border: `1px solid ${inviteMsg.includes('sent') || inviteMsg.includes('created') ? 'rgba(77,182,172,0.15)' : 'rgba(239,83,80,0.15)'}`,
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-md)',
                                fontSize: 'var(--font-sm)',
                                color: inviteMsg.includes('sent') || inviteMsg.includes('created') ? 'var(--status-success)' : 'var(--status-error)',
                            }}>{inviteMsg}</div>
                        )}
                        <form onSubmit={handleInvite} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="invite-email">Email</label>
                                <input id="invite-email" className="form-input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="colleague@company.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="invite-role">Role</label>
                                <select id="invite-role" className="form-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
