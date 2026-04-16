import { requireAuth } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import AiChatClient from '@/components/ai/AiChatClient';

export default async function AiHubPage() {
    const user = await requireAuth();
    const supabase = await createClient();

    // Fetch user's workspaces for context switching
    const { data: workspaceMemberships } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(id, name)')
        .eq('user_id', user.id);

    const workspaces = workspaceMemberships?.map(ws => ws.workspaces) || [];

    // Safely try to fetch conversations (fails gracefully if migration hasn't run yet)
    let history: any[] = [];
    try {
        const { data } = await (supabase as any)
            .from('ai_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        history = data || [];
    } catch (e) {
        // Table probably doesn't exist yet
    }

    return (
        <AiChatClient 
            workspaces={workspaces as any[]} 
            initialHistory={history}
        />
    );
}
