import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://njsrjpkkerwwsqucoujl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc3JqcGtrZXJ3d3NxdWNvdWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTU1NDEsImV4cCI6MjA5NzMzMTU0MX0.GCNgwAal_XQTmbMlLAck4ocIefCjYPcGBPuFKJdusI8';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
