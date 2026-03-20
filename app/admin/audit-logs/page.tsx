import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminAuditLogsPage() {
    const supabase = createAdminClient();
    const { data: logs } = await supabase
        .from('admin_audit_logs')
        .select('*, profiles:admin_user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Audit Logs</h1>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Target ID</th><th>Time</th></tr></thead>
                    <tbody>
                        {(logs || []).map((log: Record<string, unknown>) => (
                            <tr key={log.id as string}>
                                <td>{((log.profiles as { full_name: string | null } | null)?.full_name) || '—'}</td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.action as string}</td>
                                <td>{log.target_type as string}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>{(log.target_id as string)?.slice(0, 8) || '—'}</td>
                                <td>{new Date(log.created_at as string).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
