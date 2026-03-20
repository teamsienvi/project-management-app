import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { deleteFile as deleteDriveFile } from '@/lib/google-drive/service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const { fileId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { data: file } = await supabase
            .from('file_assets')
            .select('*')
            .eq('id', fileId)
            .is('deleted_at', null)
            .single();

        if (!file) return apiError('File not found', 404);

        await requireWorkspaceMembership(user.id, file.workspace_id);

        // Soft-delete in Supabase
        await supabase
            .from('file_assets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', fileId);

        // Optionally trash in Drive
        try {
            await deleteDriveFile(file.google_drive_file_id);
        } catch (err) {
            console.warn('Failed to trash file in Drive:', err);
        }

        return apiSuccess({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
