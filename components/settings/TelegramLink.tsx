'use client';

import { useState, useEffect } from 'react';

export default function TelegramLink() {
    const [linked, setLinked] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [unlinking, setUnlinking] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        setLoading(true);
        try {
            const res = await fetch('/api/telegram/link');
            const data = await res.json();
            if (res.ok) {
                setLinked(data.linked);
                setUsername(data.link?.telegram_username || null);
            }
        } catch (err) {
            console.error('Failed to fetch Telegram status:', err);
        } finally {
            setLoading(false);
        }
    }

    async function generateCode() {
        setGenerating(true);
        try {
            const res = await fetch('/api/telegram/link', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setLinkCode(data.code);
            }
        } catch (err) {
            console.error('Failed to generate link code:', err);
        } finally {
            setGenerating(false);
        }
    }

    async function handleUnlink() {
        setUnlinking(true);
        try {
            const res = await fetch('/api/telegram/link', { method: 'DELETE' });
            if (res.ok) {
                setLinked(false);
                setUsername(null);
            }
        } catch (err) {
            console.error('Failed to unlink Telegram:', err);
        } finally {
            setUnlinking(false);
        }
    }

    async function copyCode() {
        if (linkCode) {
            await navigator.clipboard.writeText(linkCode);
        }
    }

    if (loading) {
        return (
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span style={{ fontSize: 24 }}>💬</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Loading Telegram status...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #0088cc, #00aaee)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                    }}>
                        💬
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 4 }}>
                            Telegram Notifications
                        </h3>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 0 }}>
                            Receive task reminders and alerts directly in Telegram.
                        </p>
                    </div>
                </div>

                {linked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-success)' }} />
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--status-success)', fontWeight: 600 }}>Connected</span>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-subtle)' }}>
                {linked ? (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                                Linked to: <strong style={{ color: 'var(--text-primary)' }}>@{username || 'Telegram User'}</strong>
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>
                            Available commands: <code>/tasks</code> · <code>/reminders</code>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={handleUnlink} disabled={unlinking}>
                            {unlinking ? 'Unlinking...' : 'Unlink Telegram'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
                            <strong>How to connect:</strong>
                            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
                                <li>Click &quot;Generate Link Code&quot; below</li>
                                <li>Open the Sienvi Nexus bot in Telegram</li>
                                <li>Send: <code>/link YOUR_CODE</code></li>
                            </ol>
                        </div>

                        {linkCode ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                padding: 'var(--space-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px dashed var(--border-default)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <code style={{
                                    fontSize: 'var(--font-xl)', fontWeight: 700, letterSpacing: '0.1em',
                                    color: 'var(--accent-brand)', flex: 1,
                                }}>
                                    {linkCode}
                                </code>
                                <button className="btn btn-secondary btn-sm" onClick={copyCode}>Copy</button>
                            </div>
                        ) : null}

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-primary btn-sm" onClick={generateCode} disabled={generating}>
                                {generating ? 'Generating...' : linkCode ? 'Regenerate Code' : 'Generate Link Code'}
                            </button>
                        </div>

                        {linkCode && (
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                                Code expires in 10 minutes.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
