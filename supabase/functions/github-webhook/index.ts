import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic Webhook Verification
    // (In production, you should verify the x-hub-signature-256 header using a Webhook Secret)
    const payload = await req.json()
    const event = req.headers.get('x-github-event')

    if (event === 'pull_request') {
      const pr = payload.pull_request
      const repo = payload.repository
      const action = payload.action // opened, closed, reopened, synchronize
      
      const prNumber = pr.number
      const branchName = pr.head.ref
      const title = pr.title
      const prUrl = pr.html_url
      const author = pr.user.login
      
      let prStatus = 'open'
      if (pr.merged) prStatus = 'merged'
      else if (pr.state === 'closed') prStatus = 'closed'

      // Attempt to parse issue UUID from branch name (e.g. sb-<uuid>)
      // Because we use UUIDs instead of incremental IDs, developers must use the issue UUID in branch names.
      const uuidRegex = /sb-([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i
      const match = branchName.match(uuidRegex)
      
      if (match) {
        const issueId = match[1]
        
        // Initialize Supabase admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          
          // Upsert Pull Request record
          const { error } = await supabase.from('pull_requests').upsert({
            issue_id: issueId,
            pr_number: prNumber,
            title: title,
            branch_name: branchName,
            status: prStatus,
            pr_url: prUrl,
            author: author,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'issue_id,pr_number' 
          })
          
          if (error) console.error('Failed to upsert PR:', error)
          else console.log(`Linked PR #${prNumber} to Issue ${issueId}`)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
