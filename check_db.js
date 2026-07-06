import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ufwahqfyrdxytccymedm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd2FocWZ5cmR4eXRjY3ltZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzYyODAsImV4cCI6MjA5ODc1MjI4MH0.hmv4r8RjOUjNB1amrM_bSuH6QAUryqZCvk8eXWZXQgA'
)

async function run() {
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*')
    .order('joined_at', { ascending: false })
    .limit(10)
    
  console.log('Members:', JSON.stringify(members, null, 2))
  
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    
  console.log('Profiles:', JSON.stringify(profiles, null, 2))
}

run()
