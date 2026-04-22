import { google } from '@ai-sdk/google';
import { streamText, tool, smoothStream, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { listFolderContents } from '@/lib/google-drive/service';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(req: Request) {
    const { messages, workspaceId, conversationId: reqConvId } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (!workspaceId) {
        return new Response('Workspace ID is required', { status: 400 });
    }

    // Verify user owns/is part of the workspace
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .single();

    if (!membership) {
        return new Response('Forbidden', { status: 403 });
    }

    let conversationId = reqConvId;

    // Handle new conversation creation in background
    if (!conversationId) {
        conversationId = uuidv4();
        // Fire and forget creation
        (supabase as any).from('ai_conversations').insert({
            id: conversationId,
            user_id: user.id,
            title: messages[0]?.content?.substring(0, 50) || 'New Conversation'
        }).then();
    }

    // Save the incoming user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
        (supabase as any).from('ai_messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: lastUserMessage.content
        }).then();
    }

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

const systemPrompt = `You are a highly intelligent and helpful project management assistant for Sienvi.
You are assisting a user in the workspace "${workspace?.name}".
Your goal is to answer their questions accurately and help manage the project data.

Always be concise, professional, and use clear markdown formatting. 
If the user asks about a specific document or file, use the 'list_drive_files' tool to find the document, then use the 'read_drive_document' tool to extract its contents.
If the user asks to create or assign a task, use the 'create_workspace_task' tool. If the assignee name is not found, you must tell the user and ask them to clarify based on the available members list provided by the tool error.`;

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
        maxSteps: 5,
        onFinish: async (event) => {
            // Save the AI response once finished
            try {
                await (supabase as any).from('ai_messages').insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: event.text || '',
                    tool_invocations: event.toolCalls?.length ? JSON.stringify(event.toolCalls) : null
                });
            } catch (err) {
                console.error('Failed to log AI message:', err);
            }
        },
        tools: {
            create_workspace_task: tool({
                description: 'Create a new task in the current workspace. Use this when the user asks you to assign or create a task. You can lookup assignees by their name.',
                parameters: z.object({
                    title: z.string().describe('The title of the task.'),
                    description: z.string().optional().describe('Details about the task.'),
                    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Priority of the task.'),
                    color: z.enum(['gray', 'red', 'orange', 'amber', 'green', 'blue', 'indigo', 'pink']).optional().describe('Color category for the task.'),
                    assignee_name: z.string().optional().describe('Name of the person to assign this task to.'),
                }),
                // @ts-expect-error - Vercel AI SDK generic overload mismatch
                execute: async ({ title, description, priority, color, assignee_name }) => {
                    let assignee_user_id = null;
                    if (assignee_name) {
                        const { data: members } = await supabase
                            .from('workspace_members')
                            .select('user_id, profiles(full_name)')
                            .eq('workspace_id', workspaceId);
                            
                        const match = members?.find(m => {
                            const name = (m.profiles as any)?.full_name || '';
                            return name.toLowerCase().includes(assignee_name.toLowerCase());
                        });

                        if (match) {
                            assignee_user_id = match.user_id;
                        } else {
                            const available = members?.map(m => (m.profiles as any)?.full_name || m.user_id).filter(Boolean).join(', ') || 'No members';
                            return { error: `Assignee '${assignee_name}' not found. Available members: ${available}. Please ask the user to clarify who they mean.` };
                        }
                    }

                    const { data: task, error } = await supabase.from('tasks').insert({
                        workspace_id: workspaceId,
                        title,
                        description: description || null,
                        priority: priority || 'medium',
                        color: color || 'gray',
                        assignee_user_id,
                        status: 'todo',
                        created_by: user.id
                    }).select().single();

                    if (error) return { error: error.message };

                    await supabase.from('task_activity').insert({
                        task_id: task.id,
                        workspace_id: workspaceId,
                        actor_user_id: user.id,
                        event_type: 'task_created',
                        metadata_json: { title } as any
                    });

                    return { success: true, task };
                }
            }),
            get_workspace_tasks: tool({
                description: 'Get all active or overdue tasks in the current workspace',
                parameters: z.object({
                    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
                }),
                // @ts-expect-error - Vercel AI SDK generic overload mismatch
                execute: async ({ status }: { status?: 'todo' | 'in_progress' | 'review' | 'done' }) => {
                    let query = supabase.from('tasks').select('*').eq('workspace_id', workspaceId);
                    if (status) query = query.eq('status', status);
                    
                    const { data, error } = await query;
                    if (error) return { error: error.message };
                    return { success: true, tasks: data };
                },
            }),
            list_drive_files: tool({
                description: 'List files and folders inside a specific Google Drive folder. If no folderId is provided, it lists the root workspace folder.',
                parameters: z.object({
                    folderId: z.string().optional().describe('The ID of the folder to list contents of. Leave empty to list the root workspace folder.'),
                }),
                // @ts-expect-error - Vercel AI SDK generic overload mismatch
                execute: async ({ folderId }) => {
                    const targetFolder = folderId || workspace?.google_drive_root_folder_id;
                    console.log('list_drive_files called. FolderId:', folderId, 'Workspace root:', workspace?.google_drive_root_folder_id, 'Target:', targetFolder);
                    
                    if (!targetFolder) {
                        console.error('No Drive folder linked to this workspace.');
                        return { error: 'No Drive folder linked to this workspace.' };
                    }

                    try {
                        const contents = await listFolderContents(targetFolder);
                        console.log('Successfully fetched drive contents. Count:', contents.length);
                        if (contents.length === 0) {
                            return { success: true, message: 'The folder is currently empty. There are no files or subfolders here.' };
                        }
                        return { success: true, files: contents };
                    } catch (error: any) {
                        console.error('Failed to fetch drive contents:', error.message);
                        return { error: 'Failed to fetch drive contents. Is the Drive service configured properly?' };
                    }
                },
            }),
            read_drive_document: tool({
                description: "Read the full text content of a Google Drive file. Use this ONLY if you need to know what's inside a specific document to answer the user's question.",
                parameters: z.object({
                    fileId: z.string().describe('The ID of the Google Drive file to read.'),
                }),
                // @ts-expect-error - Vercel AI SDK generic overload mismatch
                execute: async ({ fileId }) => {
                    try {
                        const { createDriveClient } = await import('@/lib/google-drive/client');
                        const drive = createDriveClient();
                        
                        const meta = await drive.files.get({
                            fileId, fields: 'name, mimeType', supportsAllDrives: true,
                        });
                        
                        const mimeType = meta.data.mimeType || '';
                        const isGoogleDoc = mimeType.includes('google-apps.');
                        let textContent = '';

                        if (isGoogleDoc) {
                            let exportMimeType = 'text/plain';
                            if (mimeType.includes('spreadsheet')) exportMimeType = 'text/csv';

                            const contentRes = await drive.files.export(
                                { fileId, mimeType: exportMimeType },
                                { responseType: 'stream' }
                            );
                            
                            const chunks: Buffer[] = [];
                            for await (const chunk of contentRes.data as unknown as NodeJS.ReadableStream) {
                                chunks.push(Buffer.from(chunk as Uint8Array));
                            }
                            textContent = Buffer.concat(chunks).toString('utf-8');
                        } else {
                            if (!mimeType.includes('text') && !mimeType.includes('json') && !mimeType.includes('csv')) {
                                return { error: `File type ${mimeType} is not supported for raw text extraction yet. Tell the user you can only read Docs, Sheets, and text files.` };
                            }
                            const contentRes = await drive.files.get(
                                { fileId, alt: 'media' },
                                { responseType: 'stream' }
                            );
                            const chunks: Buffer[] = [];
                            for await (const chunk of contentRes.data as unknown as NodeJS.ReadableStream) {
                                chunks.push(Buffer.from(chunk as Uint8Array));
                            }
                            textContent = Buffer.concat(chunks).toString('utf-8');
                        }
                        
                        if (textContent.length > 200000) {
                            textContent = textContent.slice(0, 200000) + '... [TRUNCATED]';
                        }
                        
                        return { success: true, text: textContent };
                    } catch (err: any) {
                        return { error: 'Failed to read document: ' + err.message };
                    }
                }
            })
        },
    });

    return result.toUIMessageStreamResponse({ headers: { 'x-conversation-id': conversationId } });
}
