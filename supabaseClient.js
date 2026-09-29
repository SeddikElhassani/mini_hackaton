import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://supabase.com/dashboard/project/xjgvjvhfrtrcpobztbvf"; // e.g., https://xyz.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3ZqdmhmcnRyY3BvYnp0YnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTM1NDMsImV4cCI6MjEwNTY2OTU0M30.XHjpY9qZekV22l-JpBF5TnAAO2_jm11oBRuNrVBZtM4";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const  BUCKET_NAME = "BaasLabstorage";