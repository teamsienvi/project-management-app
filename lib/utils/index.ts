import { NextResponse } from 'next/server';

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

/**
 * Standard API error response
 */
export function apiError(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60);
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(date);
}

/**
 * Extract initials from a name (for avatars)
 */
export function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
