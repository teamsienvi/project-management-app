import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
    sendTelegramMessage,
    isTelegramConfigured,
    formatTaskList,
    formatReminders,
} from '@/lib/telegram/bot';

export async function POST(req: Request) {
    if (!isTelegramConfigured()) {
        return NextResponse.json({ ok: false, error: 'Telegram not configured' }, { status: 503 });
    }

    // Verify webhook secret
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
        const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
        if (headerSecret !== secret) {
            return NextResponse.json({ ok: false }, { status: 403 });
        }
    }

    try {
        const body = await req.json();
        const message = body.message;
        if (!message?.text) {
            return NextResponse.json({ ok: true }); // Ignore non-text updates
        }

        const chatId = message.chat.id;
        const text = message.text.trim();
        const username = message.from?.username || '';

        const supabase = createAdminClient();

        // Parse command
        const [command, ...args] = text.split(/\s+/);

        switch (command.toLowerCase()) {
            case '/start': {
                await sendTelegramMessage(chatId,
                    `👋 <b>Welcome to Sienvi Nexus!</b>\n\n` +
                    `Link your account to get task notifications right here in Telegram.\n\n` +
                    `<b>Available Commands:</b>\n` +
                    `/link &lt;code&gt; — Link your Sienvi account\n` +
                    `/tasks — View your active tasks\n` +
                    `/reminders — Upcoming deadlines\n\n` +
                    `To get a link code, go to <b>Settings → Telegram</b> in the Sienvi app.`
                );
                break;
            }

            case '/link': {
                const code = args[0];
                if (!code) {
                    await sendTelegramMessage(chatId,
                        `⚠️ Usage: <code>/link YOUR_CODE</code>\n\nGet your code from Settings → Telegram in the Sienvi app.`
                    );
                    break;
                }

                // Look up the link code
                const { data: linkCode } = await supabase
                    .from('telegram_link_codes' as any)
                    .select('*')
                    .eq('code', code)
                    .single();

                if (!linkCode || new Date((linkCode as any).expires_at) < new Date()) {
                    await sendTelegramMessage(chatId, '❌ Invalid or expired link code. Please generate a new one.');
                    break;
                }

                // Create the telegram link
                const { error } = await supabase
                    .from('telegram_links' as any)
                    .upsert({
                        user_id: (linkCode as any).user_id,
                        telegram_chat_id: chatId,
                        telegram_username: username || null,
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[telegram] Link error:', error);
                    await sendTelegramMessage(chatId, '❌ Failed to link account. Please try again.');
                    break;
                }

                // Clean up the used code
                await supabase.from('telegram_link_codes' as any).delete().eq('code', code);

                await sendTelegramMessage(chatId,
                    `✅ <b>Account linked successfully!</b>\n\n` +
                    `You'll now receive task notifications here. Try /tasks to see your tasks.`
                );
                break;
            }

            case '/tasks': {
                // Find linked user
                const { data: link } = await supabase
                    .from('telegram_links' as any)
                    .select('user_id')
                    .eq('telegram_chat_id', chatId)
                    .single();

                if (!link) {
                    await sendTelegramMessage(chatId, '🔗 Please link your account first using /link');
                    break;
                }

                // Get user's tasks
                const { data: memberships } = await supabase
                    .from('workspace_members')
                    .select('workspace_id')
                    .eq('user_id', (link as any).user_id);

                if (!memberships?.length) {
                    await sendTelegramMessage(chatId, '📋 You\'re not part of any workspaces yet.');
                    break;
                }

                const wsIds = memberships.map((m) => m.workspace_id);
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('title, status, priority, due_date')
                    .in('workspace_id', wsIds)
                    .neq('status', 'done')
                    .is('archived_at', null)
                    .order('priority', { ascending: true })
                    .limit(15);

                await sendTelegramMessage(chatId, formatTaskList(tasks || []));
                break;
            }

            case '/reminders': {
                const { data: link } = await supabase
                    .from('telegram_links' as any)
                    .select('user_id')
                    .eq('telegram_chat_id', chatId)
                    .single();

                if (!link) {
                    await sendTelegramMessage(chatId, '🔗 Please link your account first using /link');
                    break;
                }

                const { data: memberships } = await supabase
                    .from('workspace_members')
                    .select('workspace_id')
                    .eq('user_id', (link as any).user_id);

                if (!memberships?.length) {
                    await sendTelegramMessage(chatId, '⏰ No workspaces found.');
                    break;
                }

                const wsIds = memberships.map((m) => m.workspace_id);
                const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('title, due_date, workspace_id, workspaces(name)')
                    .in('workspace_id', wsIds)
                    .neq('status', 'done')
                    .is('archived_at', null)
                    .not('due_date', 'is', null)
                    .lte('due_date', nextWeek)
                    .order('due_date', { ascending: true })
                    .limit(15);

                const formatted = (tasks || []).map((t: any) => ({
                    title: t.title,
                    due_date: t.due_date,
                    workspace_name: t.workspaces?.name,
                }));

                await sendTelegramMessage(chatId, formatReminders(formatted));
                break;
            }

            default: {
                await sendTelegramMessage(chatId,
                    `🤖 I don't recognize that command.\n\n` +
                    `Try: /tasks, /reminders, or /link`
                );
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[telegram] Webhook error:', err);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
