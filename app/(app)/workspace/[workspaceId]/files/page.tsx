import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import FilesListClient from '@/components/files/FilesListClient';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function FilesPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const { data: files } = await supabase
        .from('file_assets')
        .select('*, profiles:uploaded_by(full_name)')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    return <FilesListClient files={files || []} workspaceId={workspaceId} />;
}
