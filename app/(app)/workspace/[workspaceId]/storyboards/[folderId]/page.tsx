import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import FolderDetailClient from '@/components/storyboards/FolderDetailClient';

interface PageProps {
    params: Promise<{ workspaceId: string; folderId: string }>;
}

export default async function FolderDetailPage({ params }: PageProps) {
    const { workspaceId, folderId } = await params;
    const user = await requireAuth();
    await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const [folderRes, subFoldersRes, filesRes] = await Promise.all([
        supabase.from('storyboard_folders').select('*').eq('id', folderId).single(),
        supabase.from('storyboard_folders').select('*').eq('parent_folder_id', folderId).order('created_at'),
        supabase.from('file_assets').select('*').eq('storyboard_folder_id', folderId).is('deleted_at', null).order('created_at', { ascending: false }),
    ]);

    return (
        <FolderDetailClient
            folder={folderRes.data!}
            subFolders={subFoldersRes.data || []}
            files={filesRes.data || []}
            workspaceId={workspaceId}
        />
    );
}
