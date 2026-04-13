/**
 * Storyboard display helpers.
 * Cleans up Basecamp-style folder names and adds contextual icons.
 */

/**
 * Strip leading numeric prefixes like "01_", "06_", "10_" from folder names
 * and replace underscores with spaces for cleaner display.
 * e.g. "06_Docs and Files" → "Docs and Files"
 *      "10_Assets" → "Assets"
 *      "05_Card Table (Kanban Board)" → "Card Table (Kanban Board)"
 */
export function cleanFolderName(name: string): string {
    // Match patterns like "01_", "02_", "10_" at the start
    return name.replace(/^\d{1,3}[_\-]\s*/, '');
}

/**
 * Extract numeric prefix for sorting (e.g. "06_Docs" → 6)
 * Returns Infinity for folders without a numeric prefix so they sort last.
 */
export function getFolderSortOrder(name: string): number {
    const match = name.match(/^(\d{1,3})[_\-]/);
    return match ? parseInt(match[1], 10) : Infinity;
}

/**
 * Get a contextual icon for a folder based on its name.
 */
export function getFolderIcon(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes('team member')) return '👥';
    if (lower.includes('message') || lower.includes('board')) return '💬';
    if (lower.includes('chat')) return '🗨️';
    if (lower.includes('to-do') || lower.includes('todo')) return '✅';
    if (lower.includes('card table') || lower.includes('kanban')) return '📋';
    if (lower.includes('docs') || lower.includes('files') || lower.includes('documents')) return '📂';
    if (lower.includes('schedule') || lower.includes('calendar')) return '📅';
    if (lower.includes('check-in') || lower.includes('checkin')) return '📊';
    if (lower.includes('email') || lower.includes('forward')) return '📧';
    if (lower.includes('asset')) return '🗃️';
    if (lower.includes('brand') || lower.includes('logo') || lower.includes('guideline')) return '🎨';
    if (lower.includes('account') || lower.includes('finance') || lower.includes('invoice')) return '💰';
    if (lower.includes('legal') || lower.includes('lawyer') || lower.includes('contract') || lower.includes('patent')) return '⚖️';
    if (lower.includes('product') || lower.includes('development') || lower.includes('prototype')) return '🚀';
    if (lower.includes('research') || lower.includes('keyword')) return '🔍';
    if (lower.includes('meeting') || lower.includes('notes')) return '📝';
    if (lower.includes('competitor')) return '🏁';
    if (lower.includes('social') || lower.includes('media')) return '📱';
    if (lower.includes('admin')) return '⚙️';
    if (lower.includes('archive')) return '📦';
    if (lower.includes('client')) return '🤝';
    if (lower.includes('company') || lower.includes('structure')) return '🏢';
    if (lower.includes('course') || lower.includes('digital')) return '🎓';

    return '📁';
}

/**
 * Get a subtle color accent for a folder based on its name.
 * Returns an HSL string for consistent, harmonious colors.
 */
export function getFolderAccentColor(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes('team')) return 'hsl(210, 70%, 50%)';
    if (lower.includes('message') || lower.includes('chat')) return 'hsl(270, 60%, 55%)';
    if (lower.includes('to-do') || lower.includes('todo')) return 'hsl(145, 60%, 42%)';
    if (lower.includes('card table') || lower.includes('kanban')) return 'hsl(35, 80%, 50%)';
    if (lower.includes('docs') || lower.includes('files')) return 'hsl(210, 55%, 50%)';
    if (lower.includes('schedule')) return 'hsl(340, 65%, 50%)';
    if (lower.includes('check-in')) return 'hsl(180, 50%, 42%)';
    if (lower.includes('email')) return 'hsl(20, 70%, 50%)';
    if (lower.includes('asset')) return 'hsl(260, 55%, 55%)';

    // Generate a consistent color from the name hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 50%)`;
}
