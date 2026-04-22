// ============================================================
// Telegram Bot Service — Sienvi Nexus
// Wraps the Telegram Bot API for sending messages and handling
// webhook commands. Gracefully handles missing TELEGRAM_BOT_TOKEN.
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = 'https://api.telegram.org';

/**
 * Check if Telegram bot is configured.
 */
export function isTelegramConfigured(): boolean {
    return !!BOT_TOKEN;
}

/**
 * Send a text message to a Telegram chat.
 */
export async function sendTelegramMessage(chatId: number | string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    if (!BOT_TOKEN) {
        console.warn('[telegram] BOT_TOKEN not set — skipping message');
        return false;
    }

    try {
        const res = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: parseMode,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error('[telegram] Failed to send message:', err);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[telegram] Network error:', err);
        return false;
    }
}

/**
 * Format a task list as Telegram-friendly HTML.
 */
export function formatTaskList(tasks: Array<{ title: string; status: string; priority: string; due_date: string | null }>): string {
    if (tasks.length === 0) return '📋 <b>No active tasks found.</b>';

    const statusEmoji: Record<string, string> = {
        todo: '⬜', in_progress: '🔵', review: '🟡', done: '✅',
    };

    const priorityEmoji: Record<string, string> = {
        urgent: '🔴', high: '🟠', medium: '🟡', low: '⚪',
    };

    const lines = tasks.map((t) => {
        const status = statusEmoji[t.status] || '⬜';
        const priority = priorityEmoji[t.priority] || '';
        const due = t.due_date ? ` · 📅 ${new Date(t.due_date).toLocaleDateString()}` : '';
        return `${status} ${priority} <b>${escapeHtml(t.title)}</b>${due}`;
    });

    return `📋 <b>Your Tasks (${tasks.length})</b>\n\n${lines.join('\n')}`;
}

/**
 * Format upcoming deadlines as Telegram-friendly HTML.
 */
export function formatReminders(tasks: Array<{ title: string; due_date: string; workspace_name?: string }>): string {
    if (tasks.length === 0) return '⏰ <b>No upcoming deadlines!</b>\n\nYou\'re all caught up 🎉';

    const lines = tasks.map((t) => {
        const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000);
        const urgency = daysLeft <= 1 ? '🔴' : daysLeft <= 3 ? '🟠' : '🟡';
        const ws = t.workspace_name ? ` <i>(${escapeHtml(t.workspace_name)})</i>` : '';
        return `${urgency} <b>${escapeHtml(t.title)}</b> — ${daysLeft <= 0 ? 'Overdue!' : `${daysLeft}d left`}${ws}`;
    });

    return `⏰ <b>Upcoming Deadlines</b>\n\n${lines.join('\n')}`;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Set the webhook URL for the Telegram bot.
 * Call this once during setup.
 */
export async function setWebhook(url: string): Promise<boolean> {
    if (!BOT_TOKEN) return false;

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
    const res = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url,
            secret_token: secret || undefined,
        }),
    });

    return res.ok;
}
