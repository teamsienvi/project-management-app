import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import MeetingExtractor from '@/components/meetings/MeetingExtractor';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function MeetingsPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();

    try {
        await requireWorkspaceMembership(user.id, workspaceId);
    } catch {
        redirect('/dashboard');
    }

    const supabase = await createClient();

    const [workspaceRes, membersRes] = await Promise.all([
        supabase.from('workspaces').select('name').eq('id', workspaceId).single(),
        supabase.from('workspace_members').select('user_id, profiles(full_name)').eq('workspace_id', workspaceId),
    ]);

    return (
        <MeetingExtractor
            workspaceId={workspaceId}
            workspaceName={workspaceRes.data?.name || 'Workspace'}
            members={(membersRes.data || []) as any}
        />
    );
}
