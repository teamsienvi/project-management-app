
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileFetch() {
    console.log('Testing profile fetch from:', supabaseUrl);
    const { data, error, status } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Error (Status ' + status + '):', error.message);
    } else {
        console.log('Successfully fetched profile. Status:', status);
    }
}

testProfileFetch();
