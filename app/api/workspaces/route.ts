import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createWorkspaceSchema } from '@/lib/validators';
import { ensureWorkspaceFolderTree } from '@/lib/google-drive/service';
import { apiSuccess, apiError, slugify } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const body = await request.json();
        const parsed = createWorkspaceSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const { name } = parsed.data;
        const workspaceId = uuidv4();
        const slug = slugify(name) + '-' + uuidv4().slice(0, 6);

        // Provision Google Drive folder tree
        let driveFolders = {
            rootFolderId: null as string | null,
            storyboardsFolderId: null as string | null,
            generalFilesFolderId: null as string | null,
            taskAttachmentsFolderId: null as string | null,
        };

        try {
            const folders = await ensureWorkspaceFolderTree(name);
            driveFolders = folders;
        } catch (err) {
            console.warn('Google Drive provisioning failed (Drive may not be configured):', err);
            // Non-fatal: workspace can be created without Drive folders
        }

        // Create workspace using service role
        const adminSupabase = createAdminClient();
        const { data: workspace, error: wsError } = await adminSupabase
            .from('workspaces')
            .insert({
                id: workspaceId,
                name,
                slug,
                created_by: user.id,
                google_drive_root_folder_id: driveFolders.rootFolderId,
                google_drive_storyboards_folder_id: driveFolders.storyboardsFolderId,
                google_drive_general_files_folder_id: driveFolders.generalFilesFolderId,
                google_drive_task_attachments_folder_id: driveFolders.taskAttachmentsFolderId,
            })
            .select()
            .single();

        if (wsError) return apiError(wsError.message, 500);

        // Create owner membership
        await adminSupabase.from('workspace_members').insert({
            workspace_id: workspaceId,
            user_id: user.id,
            role: 'owner',
        });

        return apiSuccess({ workspace }, 201);
    } catch (err) {
        console.error('Create workspace error:', err);
        return apiError('Internal server error', 500);
    }
}
