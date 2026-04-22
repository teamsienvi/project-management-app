import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month'); // YYYY-MM format
        const workspaceId = searchParams.get('workspaceId');
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        // Get all workspaces the user belongs to
        const { data: memberships } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id);

        if (!memberships || memberships.length === 0) {
            return apiSuccess({ tasks: [], workspaces: [] });
        }

        const workspaceIds = workspaceId
            ? [workspaceId]
            : memberships.map((m) => m.workspace_id);

        // Calculate date range for the month (include padding for calendar view)
        let startDate: string;
        let endDate: string;

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            // Start from beginning of the month's first week
            const firstDay = new Date(year, mon - 1, 1);
            const lastDay = new Date(year, mon, 0);
            // Pad by 7 days on each side for calendar display
            startDate = new Date(firstDay.getTime() - 7 * 86400000).toISOString();
            endDate = new Date(lastDay.getTime() + 7 * 86400000).toISOString();
        } else {
            // Default: current month ± 7 days
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            startDate = new Date(firstDay.getTime() - 7 * 86400000).toISOString();
            endDate = new Date(lastDay.getTime() + 7 * 86400000).toISOString();
        }

        // Build query
        let query = supabase
            .from('tasks')
            .select(`
                id, title, status, priority, color, due_date,
                workspace_id, assignee_user_id,
                workspaces(name),
                profiles:assignee_user_id(full_name)
            `)
            .in('workspace_id', workspaceIds)
            .not('due_date', 'is', null)
            .gte('due_date', startDate)
            .lte('due_date', endDate)
            .is('archived_at', null)
            .order('due_date', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }
        if (userId) {
            query = query.eq('assignee_user_id', userId);
        }

        const { data: tasks, error } = await query;
        if (error) return apiError(error.message, 500);

        // Get workspace names for the filter
        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id, name')
            .in('id', memberships.map((m) => m.workspace_id));

        // Get workspace members for the user filter
        const { data: allMembers } = await supabase
            .from('workspace_members')
            .select('user_id, profiles(full_name)')
            .in('workspace_id', workspaceIds);

        // Deduplicate members
        const memberMap = new Map<string, string>();
        allMembers?.forEach((m: any) => {
            if (!memberMap.has(m.user_id)) {
                memberMap.set(m.user_id, m.profiles?.full_name || m.user_id);
            }
        });
        const members = Array.from(memberMap.entries()).map(([id, name]) => ({ id, name }));

        return apiSuccess({ tasks: tasks || [], workspaces: workspaces || [], members });
    } catch (err: any) {
        console.error('[calendar] Error:', err);
        return apiError('Internal server error', 500);
    }
}
