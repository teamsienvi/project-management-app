import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import { isGeminiAvailable, callGemini } from '@/lib/gemini/client';
import { PRIORITIZE_NOTIFICATION_PROMPT, fillPrompt } from '@/lib/gemini/prompts';
import { NotificationDecisionSchema } from '@/lib/gemini/schemas';
import { sendTelegramMessage, isTelegramConfigured } from '@/lib/telegram/bot';

export type NotificationType =
    | 'workspace_invite'
    | 'task_assigned'
    | 'task_due_soon'
    | 'task_completed'
    | 'file_uploaded'
    | 'member_added';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Create a notification for a user (uses service role to bypass RLS).
 */
export async function createNotification(params: {
    userId: string;
    workspaceId?: string;
    type: NotificationType;
    title: string;
    body?: string;
    priority?: NotificationPriority;
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
            priority: params.priority || 'normal',
            metadata_json: (params.metadata || {}) as Json,
        } as any)
        .select()
        .single();

    if (error) {
        console.error('Failed to create notification:', error);
        return null;
    }

    // Dispatch to external channels for high/urgent priority
    if (params.priority === 'high' || params.priority === 'urgent') {
        dispatchExternalNotification(params.userId, params.title, params.body || '');
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
        priority?: NotificationPriority;
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
        priority: params.priority || 'normal',
        metadata_json: (params.metadata || {}) as Json,
    }));

    const { data, error } = await supabase
        .from('notifications')
        .insert(rows as any)
        .select();

    if (error) {
        console.error('Failed to create bulk notifications:', error);
        return [];
    }
    return data;
}

/**
 * Smart notification: use Gemini to decide priority and whether to send.
 * Falls back to always-send with 'normal' priority if AI is unavailable.
 */
export async function createSmartNotification(params: {
    userId: string;
    workspaceId?: string;
    type: NotificationType;
    title: string;
    body?: string;
    taskPriority?: string;
    taskDueDate?: string;
    metadata?: Record<string, unknown>;
}) {
    let priority: NotificationPriority = 'normal';
    let shouldSend = true;

    if (isGeminiAvailable()) {
        try {
            // Count recent notifications for anti-spam
            const supabase = createAdminClient();
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', params.userId)
                .gte('created_at', oneHourAgo);

            const prompt = fillPrompt(PRIORITIZE_NOTIFICATION_PROMPT, {
                notificationType: params.type,
                title: params.title,
                body: params.body || '',
                taskPriority: params.taskPriority || 'medium',
                taskDueDate: params.taskDueDate || 'Not set',
                recentCount: String(count || 0),
            });

            const decision = await callGemini(prompt, NotificationDecisionSchema);
            priority = decision.priority;
            shouldSend = decision.shouldNotify;

            console.log(`[notifications] AI decision: send=${shouldSend}, priority=${priority}, reason=${decision.reasoning}`);
        } catch (err) {
            console.warn('[notifications] AI prioritization failed, using defaults:', err);
        }
    }

    if (!shouldSend) {
        console.log(`[notifications] Suppressed notification: "${params.title}" for user ${params.userId}`);
        return null;
    }

    return createNotification({ ...params, priority });
}

/**
 * Dispatch a notification to external channels (Telegram).
 * Called automatically for high/urgent priority notifications.
 */
async function dispatchExternalNotification(userId: string, title: string, body: string) {
    if (!isTelegramConfigured()) return;

    try {
        const supabase = createAdminClient();
        const { data: link } = await supabase
            .from('telegram_links' as any)
            .select('telegram_chat_id')
            .eq('user_id', userId)
            .single();

        if (link) {
            const message = `🔔 <b>${title}</b>\n${body}`;
            await sendTelegramMessage((link as any).telegram_chat_id, message);
        }
    } catch (err) {
        console.error('[notifications] Failed to dispatch to Telegram:', err);
    }
}
