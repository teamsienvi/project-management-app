import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

export type NotificationType =
    | 'workspace_invite'
    | 'task_assigned'
    | 'task_due_soon'
    | 'task_completed'
    | 'file_uploaded'
    | 'member_added';

/**
 * Create a notification for a user (uses service role to bypass RLS).
 */
export async function createNotification(params: {
    userId: string;
    workspaceId?: string;
    type: NotificationType;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
}) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: params.userId,
            workspace_id: params.workspaceId || null,
            type: params.type,
            title: params.title,
            body: params.body || null,
            metadata_json: (params.metadata || {}) as Json,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
    return data;
}

/**
 * Create notifications for multiple users at once.
 */
export async function createBulkNotifications(
    userIds: string[],
    params: {
        workspaceId?: string;
        type: NotificationType;
        title: string;
        body?: string;
        metadata?: Record<string, unknown>;
    }
) {
    const supabase = createAdminClient();
    const rows = userIds.map((userId) => ({
        user_id: userId,
        workspace_id: params.workspaceId || null,
        type: params.type,
        title: params.title,
        body: params.body || null,
        metadata_json: (params.metadata || {}) as Json,
    }));

    const { data, error } = await supabase
        .from('notifications')
        .insert(rows)
        .select();

    if (error) {
        console.error('Failed to create bulk notifications:', error);
        return [];
    }
    return data;
}
