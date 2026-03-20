import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Get the current session. Returns null if no session.
 */
export async function getSession() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Get the current authenticated user. Returns null if not authed.
 * Uses getUser() for server-side verification (secure).
 */
export async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Require authentication. Redirects to /login if not authed.
 */
export async function requireAuth() {
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

/**
 * Get the current user's profile from the profiles table.
 */
export async function getProfile(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return data;
}

/**
 * Require admin access. Redirects to /dashboard if not admin.
 */
export async function requireAdmin() {
    const user = await requireAuth();
    const profile = await getProfile(user.id);

    if (!profile?.is_admin) {
        redirect('/dashboard');
    }

    return { user, profile };
}
