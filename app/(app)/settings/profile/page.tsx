'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
    const supabase = createClient();
    const [profile, setProfile] = useState({ full_name: '', avatar_url: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile({ full_name: data?.full_name || '', avatar_url: data?.avatar_url || '', email: user.email || '' });
            }
            setLoading(false);
        })();
    }, [supabase]);

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ full_name: profile.full_name, avatar_url: profile.avatar_url || null }).eq('id', user.id);
            setSaved(true);
        }
        setSaving(false);
    }

    if (loading) return <div className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />;

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Profile Settings</h1>
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                {saved && <div style={{ padding: 'var(--space-sm)', background: 'rgba(29,233,182,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', color: 'var(--status-success)', fontSize: 'var(--font-sm)' }}>Profile updated successfully.</div>}
                <form onSubmit={handleSave} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-email">Email</label>
                        <input id="profile-email" className="form-input" value={profile.email} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-name">Full Name</label>
                        <input id="profile-name" className="form-input" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-avatar">Avatar URL</label>
                        <input id="profile-avatar" className="form-input" placeholder="https://" value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </form>
            </div>
        </div>
    );
}
