import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type WorkspaceRole = 'owner' | 'manager' | 'member';

/**
 * Check if a user is a member of a workspace. Returns the member record or null.
 */
export async function getWorkspaceMembership(userId: string, workspaceId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();
    return data;
}

/**
 * Require workspace membership. Throws if user is not a member.
 */
export async function requireWorkspaceMembership(userId: string, workspaceId: string) {
    const membership = await getWorkspaceMembership(userId, workspaceId);
    if (!membership) {
        throw new Error('Not a member of this workspace');
    }
    return membership;
}

/**
 * Require a specific workspace role. Throws if role is insufficient.
 */
export async function requireWorkspaceRole(
    userId: string,
    workspaceId: string,
    allowedRoles: WorkspaceRole[]
) {
    const membership = await requireWorkspaceMembership(userId, workspaceId);
    if (!allowedRoles.includes(membership.role as WorkspaceRole)) {
        throw new Error(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
    }
    return membership;
}

/**
 * Check if user is an admin via the profiles table (server-side).
 * Uses service role to bypass RLS.
 */
export async function isAdmin(userId: string): Promise<boolean> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
    return data?.is_admin === true;
}

/**
 * Get all workspaces a user is a member of.
 */
export async function getUserWorkspaces(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('workspace_members')
        .select(`
      workspace_id,
      role,
      joined_at,
      workspaces (*)
    `)
        .eq('user_id', userId);
    return data || [];
}

/**
 * Check if a user has access to a specific task (via workspace membership).
 */
export async function checkTaskAccess(userId: string, taskId: string) {
    const supabase = await createClient();
    const { data: task } = await supabase
        .from('tasks')
        .select('workspace_id')
        .eq('id', taskId)
        .single();

    if (!task) {
        throw new Error('Task not found');
    }

    return requireWorkspaceMembership(userId, task.workspace_id);
}
