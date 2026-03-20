import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) return apiError(error.message, 500);
        return apiSuccess({ notifications });
    } catch {
        return apiError('Internal server error', 500);
    }
}
