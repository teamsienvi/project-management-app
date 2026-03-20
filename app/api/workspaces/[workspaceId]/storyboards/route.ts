import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createStoryboardSchema } from '@/lib/validators';
import { createFolder } from '@/lib/google-drive/service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const body = await request.json();
        const parsed = createStoryboardSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const { name, description, parentFolderId } = parsed.data;

        // Get workspace Drive folder ID
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('google_drive_storyboards_folder_id')
            .eq('id', workspaceId)
            .single();

        let driveFolderId: string | null = null;

        // Create Drive folder if workspace has Drive config
        if (workspace?.google_drive_storyboards_folder_id) {
            let parentDriveId = workspace.google_drive_storyboards_folder_id;

            if (parentFolderId) {
                const { data: parent } = await supabase
                    .from('storyboard_folders')
                    .select('google_drive_folder_id')
                    .eq('id', parentFolderId)
                    .single();
                if (parent?.google_drive_folder_id) {
                    parentDriveId = parent.google_drive_folder_id;
                }
            }

            try {
                driveFolderId = await createFolder(name, parentDriveId);
            } catch (err) {
                console.warn('Failed to create Drive folder:', err);
            }
        }

        const { data: folder, error } = await supabase
            .from('storyboard_folders')
            .insert({
                workspace_id: workspaceId,
                parent_folder_id: parentFolderId || null,
                name,
                description: description || null,
                google_drive_folder_id: driveFolderId,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) return apiError(error.message, 500);
        return apiSuccess({ folder }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
