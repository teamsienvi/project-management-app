import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminWorkspacesPage() {
    const supabase = createAdminClient();
    const { data: workspaces } = await supabase.from('workspaces').select('*, profiles:created_by(full_name)').order('created_at', { ascending: false });

    return (
        <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>All Workspaces</h1>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Slug</th><th>Created By</th><th>Created</th></tr></thead>
                    <tbody>
                        {(workspaces || []).map((ws: Record<string, unknown>) => (
                            <tr key={ws.id as string}>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ws.name as string}</td>
                                <td>{ws.slug as string}</td>
                                <td>{(ws.profiles as { full_name: string | null } | null)?.full_name || '—'}</td>
                                <td>{new Date(ws.created_at as string).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
