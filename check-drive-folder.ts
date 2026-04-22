
import { createDriveClient } from './lib/google-drive/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkFolder() {
    const folderId = '1EoJ_v5_Av6HzRNNGpNf0gnHpafc0_IOC';
    console.log('Checking folder:', folderId);
    try {
        const drive = createDriveClient();
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });
        console.log('Files found:', res.data.files?.length || 0);
        res.data.files?.forEach(f => console.log(`- ${f.name} (${f.id})` ));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

checkFolder();
