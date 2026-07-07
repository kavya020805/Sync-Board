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
    } else if (event === 'issues') {
      const issue = payload.issue
      const repo = payload.repository
      const action = payload.action
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Find the project that owns this repo
        const { data: project } = await supabase
          .from('projects')
          .select('id, workspace_id')
          .eq('github_repo_owner', repo.owner.login)
          .eq('github_repo_name', repo.name)
          .single()
          
        if (project) {
          if (action === 'opened') {
            // Find an arbitrary user in the workspace to act as the reporter
            // In a real system, you'd match GitHub user to Supabase user via email or connected account
            const { data: member } = await supabase
              .from('workspace_members')
              .select('user_id')
              .eq('workspace_id', project.workspace_id)
              .limit(1)
              .single()
              
            // Check if issue already exists
            const { data: existingIssue } = await supabase
              .from('issues')
              .select('id')
              .eq('project_id', project.id)
              .eq('github_issue_number', issue.number)
              .maybeSingle()

            if (existingIssue) {
              console.log('Issue already exists, ignoring opened event')
              return new Response(JSON.stringify({ success: true, message: 'Issue already synced' }), { headers: corsHeaders })
            }

            // DEPLOYED VERSION 4 - DEDUPLICATION
            const { error } = await supabase.from('issues').insert({
              project_id: project.id,
              title: issue.title,
              description: issue.body,
              priority: 'medium',
              github_issue_number: issue.number,
              github_issue_url: issue.html_url
            })
            if (error) {
              console.error('Failed to sync new issue:', error)
              return new Response(JSON.stringify({ success: false, message: 'Failed to insert issue: ' + error.message }), { headers: corsHeaders })
            }
            return new Response(JSON.stringify({ success: true, message: 'Synced new GitHub Issue' }), { headers: corsHeaders })
          } else if (action === 'deleted') {
            const { error } = await supabase.from('issues')
              .delete()
              .eq('project_id', project.id)
              .eq('github_issue_number', issue.number)
              
            if (error) {
              console.error('Failed to delete synced issue:', error)
              return new Response(JSON.stringify({ success: false, message: 'Failed to delete issue: ' + error.message }), { headers: corsHeaders })
            }
            return new Response(JSON.stringify({ success: true, message: 'Deleted GitHub Issue' }), { headers: corsHeaders })
          } else if (action === 'edited' || action === 'closed' || action === 'reopened') {
            const updates: any = {}
            if (action === 'edited') {
              updates.title = issue.title
              updates.description = issue.body
            }
            
            if (action === 'closed' || action === 'reopened') {
               const { data: existing } = await supabase.from('issues').select('sprint_id').eq('project_id', project.id).eq('github_issue_number', issue.number).maybeSingle()
               
               if (existing && existing.sprint_id) {
                 if (action === 'closed') {
                   const { data: doneCol } = await supabase.from('board_columns').select('id').eq('project_id', project.id).ilike('name', '%done%').maybeSingle()
                   if (doneCol) updates.column_id = doneCol.id
                 } else if (action === 'reopened') {
                   const { data: todoCol } = await supabase.from('board_columns').select('id').eq('project_id', project.id).ilike('name', '%to do%').maybeSingle()
                   if (todoCol) updates.column_id = todoCol.id
                 }
               }
            }
            
            if (Object.keys(updates).length > 0) {
              const { error } = await supabase.from('issues')
                .update(updates)
                .eq('project_id', project.id)
                .eq('github_issue_number', issue.number)
                
              if (error) {
                console.error('Failed to update synced issue:', error)
                return new Response(JSON.stringify({ success: false, message: 'Failed to update issue: ' + error.message }), { headers: corsHeaders })
              }
            }
            return new Response(JSON.stringify({ success: true, message: 'Updated GitHub Issue' }), { headers: corsHeaders })
          }
        } else {
          return new Response(JSON.stringify({ success: false, message: `Project not found for repo: ${repo?.owner?.login}/${repo?.name}` }), { headers: corsHeaders })
        }
      } else {
        return new Response(JSON.stringify({ success: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { headers: corsHeaders })
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
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
