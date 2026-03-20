'use client';

import { useState, type FormEvent } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Invitation {
    id: string;
    email: string;
    role: string;
    token: string;
    status: string;
    expires_at: string | null;
    created_at: string;
}

interface MembersClientProps {
    members: any[];
    workspace: { name: string };
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
    const [newInviteToken, setNewInviteToken] = useState('');
    const [copiedToken, setCopiedToken] = useState('');

    const canManage = currentUserRole === 'owner' || currentUserRole === 'manager';

    async function handleInvite(e: FormEvent) {
        e.preventDefault();
        setInviting(true);
        setInviteMsg('');
        setNewInviteToken('');
        const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });
        const data = await res.json();
        if (res.ok) {
            setInviteMsg('Invitation created! Share the invite code below with your colleague.');
            setNewInviteToken(data.invitation.token);
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

    function copyToClipboard(token: string) {
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(''), 2000);
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Members</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>{workspace.name} · {members.length} members</p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => { setShowInvite(true); setNewInviteToken(''); setInviteMsg(''); }}>+ Invite Member</button>
                )}
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>Member</th><th>Role</th><th>Joined</th>{currentUserRole === 'owner' && <th>Actions</th>}</tr>
                    </thead>
                    <tbody>
                        {members.map((m: any) => (
                            <tr key={m.id}>
                                <td style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <div className="avatar avatar-sm">{m.profiles?.full_name?.[0]?.toUpperCase() || '?'}</div>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {m.profiles?.full_name || 'Unknown'} {m.user_id === currentUserId && <span style={{ color: 'var(--text-tertiary)' }}>(you)</span>}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${m.role === 'owner' ? 'badge-cyan' : m.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>{m.role}</span>
                                </td>
                                <td>{new Date(m.joined_at).toLocaleDateString()}</td>
                                {currentUserRole === 'owner' && (
                                    <td>
                                        {m.role !== 'owner' && m.user_id !== currentUserId && (
                                            <select className="form-input" style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--font-sm)' }} value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} aria-label={`Change role for ${m.profiles?.full_name}`}>
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

            {/* Pending Invitations Section */}
            {canManage && pendingInvitations.length > 0 && (
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        Pending Invitations
                    </h2>
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Email</th><th>Role</th><th>Invite Code</th><th>Expires</th></tr>
                            </thead>
                            <tbody>
                                {pendingInvitations.map((inv) => (
                                    <tr key={inv.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.email}</td>
                                        <td>
                                            <span className={`badge ${inv.role === 'manager' ? 'badge-violet' : 'badge-magenta'}`}>{inv.role}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <code style={{
                                                    fontSize: 'var(--font-xs)',
                                                    background: 'var(--bg-tertiary)',
                                                    padding: '2px 6px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    maxWidth: 140,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>{inv.token}</code>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ padding: '2px 8px', fontSize: 'var(--font-xs)', minWidth: 'auto' }}
                                                    onClick={() => copyToClipboard(inv.token)}
                                                >
                                                    {copiedToken === inv.token ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                                            {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showInvite && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowInvite(false); }} role="dialog" aria-modal="true" aria-label="Invite member">
                    <div className="glass-card" style={{ padding: 'var(--space-xl)', width: '100%', maxWidth: 440 }}>
                        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Invite Member</h2>
                        {inviteMsg && <div style={{ padding: 'var(--space-sm)', background: inviteMsg.includes('created') ? 'rgba(29,233,182,0.1)' : 'rgba(255,82,82,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: 'var(--font-sm)', color: inviteMsg.includes('created') ? 'var(--status-success)' : 'var(--status-error)' }}>{inviteMsg}</div>}

                        {/* Show the invite code after successful creation */}
                        {newInviteToken && (
                            <div style={{
                                padding: 'var(--space-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-lg)',
                                border: '1px solid var(--border-default)',
                            }}>
                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                                    Share this invite code with your colleague:
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <code style={{
                                        flex: 1,
                                        fontSize: 'var(--font-sm)',
                                        background: 'var(--bg-primary)',
                                        padding: 'var(--space-sm)',
                                        borderRadius: 'var(--radius-sm)',
                                        wordBreak: 'break-all',
                                        userSelect: 'all',
                                    }}>{newInviteToken}</code>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '6px 12px', fontSize: 'var(--font-sm)', minWidth: 'auto', whiteSpace: 'nowrap' }}
                                        onClick={() => copyToClipboard(newInviteToken)}
                                    >
                                        {copiedToken === newInviteToken ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!newInviteToken && (
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
                        )}

                        {newInviteToken && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowInvite(false); window.location.reload(); }}>Done</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
