import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { getFileWebViewLink } from '@/lib/google-drive/service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const { fileId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        // Get file metadata
        const { data: file } = await supabase
            .from('file_assets')
            .select('*')
            .eq('id', fileId)
            .is('deleted_at', null)
            .single();

        if (!file) return apiError('File not found', 404);

        // Verify membership via workspace
        await requireWorkspaceMembership(user.id, file.workspace_id);

        // Return stored webViewLink or fetch from Drive
        let url = file.google_drive_web_view_link;
        if (!url) {
            try {
                url = await getFileWebViewLink(file.google_drive_file_id);
            } catch {
                return apiError('Could not retrieve file link', 500);
            }
        }

        return apiSuccess({ url });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('member') ? 403 : 500);
    }
}
