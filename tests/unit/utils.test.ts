import { slugify, formatDate, formatRelativeTime, getInitials } from '@/lib/utils';

describe('Utility Functions', () => {
    describe('slugify', () => {
        it('converts to lowercase kebab-case', () => {
            expect(slugify('Marketing Ops')).toBe('marketing-ops');
        });

        it('removes special characters', () => {
            expect(slugify('My Project! (v2)')).toBe('my-project-v2');
        });

        it('trims leading/trailing hyphens', () => {
            expect(slugify('--test--')).toBe('test');
        });

        it('limits to 60 chars', () => {
            const long = 'a'.repeat(100);
            expect(slugify(long).length).toBeLessThanOrEqual(60);
        });
    });

    describe('formatDate', () => {
        it('formats date string', () => {
            const result = formatDate('2026-03-18T00:00:00Z');
            expect(result).toContain('Mar');
            expect(result).toContain('2026');
        });
    });

    describe('formatRelativeTime', () => {
        it('returns "just now" for recent times', () => {
            expect(formatRelativeTime(new Date())).toBe('just now');
        });

        it('returns minutes ago', () => {
            const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
            expect(formatRelativeTime(tenMinAgo)).toBe('10m ago');
        });
    });

    describe('getInitials', () => {
        it('returns two letter initials', () => {
            expect(getInitials('John Doe')).toBe('JD');
        });

        it('handles single name', () => {
            expect(getInitials('Alice')).toBe('A');
        });

        it('returns ? for null', () => {
            expect(getInitials(null)).toBe('?');
        });
    });
});
