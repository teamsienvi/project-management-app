import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminDashboardPage() {
    const supabase = createAdminClient();
    const [usersRes, workspacesRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('workspaces').select('id', { count: 'exact' }),
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    return (
        <div>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginBottom: 'var(--space-xl)' }}>
                <span className="gradient-text">Admin Portal</span>
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {[
                    { label: 'Total Users', value: usersRes.count || 0 },
                    { label: 'Total Workspaces', value: workspacesRes.count || 0 },
                    { label: 'Recent Audit Logs', value: logsRes.data?.length || 0 },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginTop: 'var(--space-xs)' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Recent Audit Logs</h2>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Action</th><th>Target</th><th>Time</th></tr></thead>
                    <tbody>
                        {(logsRes.data || []).map((log) => (
                            <tr key={log.id}>
                                <td style={{ color: 'var(--text-primary)' }}>{log.action}</td>
                                <td>{log.target_type}{log.target_id ? ` → ${log.target_id.slice(0, 8)}` : ''}</td>
                                <td>{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
