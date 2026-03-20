import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

/**
 * Log an admin action to the audit log.
 * Uses service-role client (no RLS constraints).
 */
export async function logAdminAction(params: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('admin_audit_logs').insert({
        admin_user_id: params.adminUserId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        metadata_json: (params.metadata || {}) as Json,
    });

    if (error) {
        console.error('Failed to log admin action:', error);
    }
}
