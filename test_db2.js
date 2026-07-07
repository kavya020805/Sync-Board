import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  // Use a JWT or just login if we had one. Or we can just read using ANON key and bypass RLS? No.
  // Actually, wait, issues might be readable if the project is readable?
  // Let's use the service role key from the github-webhook edge function!
  // I will just read .env to see if there's a VITE_SUPABASE_SERVICE_ROLE_KEY or I will check the terminal where they set it.
  
  console.log('Skipping because I don\'t have service role key in local env.');
}

test()
