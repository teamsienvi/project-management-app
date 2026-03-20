export default function NotificationSettingsPage() {
    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Notification Settings</h1>
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Notification preferences will be available in a future update. Currently all in-app notifications are enabled by default.</p>
            </div>
        </div>
    );
}
