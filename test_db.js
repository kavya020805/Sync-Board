import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: projects, error } = await supabase.from('projects').select('*')
  console.log('Projects:', projects)
  if (error) console.error('Error:', error)
  
  const { data: issues } = await supabase.from('issues').select('*').order('created_at', { ascending: false }).limit(5)
  console.log('Recent issues:', issues.map(i => ({ title: i.title, github_number: i.github_issue_number })))
}

test()
