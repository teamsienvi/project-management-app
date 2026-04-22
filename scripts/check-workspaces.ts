
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkspaces() {
    const { data: workspaces, error } = await supabase.from('workspaces').select('*');
    if (error) {
        console.error('Error fetching workspaces:', error);
        return;
    }
    console.log('Workspaces:', JSON.stringify(workspaces, null, 2));
}

checkWorkspaces();
