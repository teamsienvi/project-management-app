import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import StoryboardListClient from '@/components/storyboards/StoryboardListClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function StoryboardsPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    const membership = await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const { data: folders } = await supabase
        .from('storyboard_folders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('parent_folder_id', null)
        .order('created_at', { ascending: false });

    return (
        <StoryboardListClient
            folders={folders || []}
            workspaceId={workspaceId}
            role={membership.role}
        />
    );
}
