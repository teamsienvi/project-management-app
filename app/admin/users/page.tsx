import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminUsersPage() {
    const supabase = createAdminClient();
    const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

    return (
        <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>All Users</h1>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Admin</th><th>Created</th></tr></thead>
                    <tbody>
                        {(users || []).map((u) => (
                            <tr key={u.id}>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.full_name || u.id.slice(0, 8)}</td>
                                <td>{u.is_admin ? <span className="badge badge-cyan">Admin</span> : <span className="badge badge-magenta">User</span>}</td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
