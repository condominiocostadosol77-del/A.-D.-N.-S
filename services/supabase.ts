import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const SUPABASE_URL = 'https://cvpvftnkgiwvikwicttq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1A8kSOhVAPlcO3z6e0Y7sA_AdqJRC-y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);