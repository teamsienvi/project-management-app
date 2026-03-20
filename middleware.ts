import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password'];

// Routes that require admin access
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Create Supabase client and refresh session
    const { user, supabaseResponse } = await createMiddlewareClient(request);

    // Allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        // If already authenticated, redirect to dashboard
        if (user) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // All other routes require authentication
    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Admin routes require admin flag (checked via profile in the page/layout)
    // We do a lightweight check here; full admin verification is done server-side
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
        // Admin check is enforced in the admin layout server-side
        // Middleware just ensures the user is authenticated
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon)
         * - public folder
         * - api routes (handled by their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
    ],
};
