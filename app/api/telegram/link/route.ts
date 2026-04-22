import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/telegram/link — Generate a one-time link code for the current user.
 * The user shares this code with the Telegram bot via /link <code>.
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        // Generate a short code
        const code = uuidv4().slice(0, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Clean up any existing codes for this user
        await (supabase as any).from('telegram_link_codes').delete().eq('user_id', user.id);

        // Insert new code
        const { error } = await (supabase as any).from('telegram_link_codes').insert({
            code,
            user_id: user.id,
            expires_at: expiresAt,
        });

        if (error) return apiError(error.message, 500);

        return apiSuccess({ code, expiresAt });
    } catch {
        return apiError('Internal server error', 500);
    }
}

/**
 * GET /api/telegram/link — Check if the current user has a linked Telegram account.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { data: link } = await (supabase as any)
            .from('telegram_links')
            .select('telegram_username, linked_at')
            .eq('user_id', user.id)
            .single();

        return apiSuccess({ linked: !!link, link: link || null });
    } catch {
        return apiError('Internal server error', 500);
    }
}

/**
 * DELETE /api/telegram/link — Unlink Telegram account.
 */
export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await (supabase as any).from('telegram_links').delete().eq('user_id', user.id);

        return apiSuccess({ unlinked: true });
    } catch {
        return apiError('Internal server error', 500);
    }
}
