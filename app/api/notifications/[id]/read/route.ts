import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) return apiError(error.message, 500);
        return apiSuccess({ ok: true });
    } catch {
        return apiError('Internal server error', 500);
    }
}
