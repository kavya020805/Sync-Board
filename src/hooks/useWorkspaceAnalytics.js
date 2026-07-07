import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useWorkspaceAnalytics(workspaceId) {
  return useQuery({
    queryKey: ['workspaceAnalytics', workspaceId],
    queryFn: async () => {
      // 1. Fetch all projects in this workspace
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('workspace_id', workspaceId)
      if (projectsError) throw projectsError
      
      const projectIds = projects.map(p => p.id)
      if (projectIds.length === 0) return { issues: [], activity: [], members: [], sprints: [] }

      // 2. Fetch all issues in these projects
      const { data: issues, error: issuesError } = await supabase
        .from('issues')
        .select('*, column:board_columns(name)')
        .in('project_id', projectIds)
      if (issuesError) throw issuesError

      // 3. Fetch all activity logs in these projects
      const { data: activity, error: activityError } = await supabase
        .from('activity_log')
        .select(`
          *,
          user:profiles!user_id(id, display_name, avatar_url),
          issue:issues!inner(id, project_id, title)
        `)
        .in('issue.project_id', projectIds)
      if (activityError) throw activityError

      // 4. Fetch workspace members
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          profile:profiles!user_id(id, display_name, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'accepted')
      if (membersError) throw membersError

      // 5. Fetch all sprints in these projects
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .in('project_id', projectIds)
      if (sprintsError) throw sprintsError

      return {
        issues,
        activity,
        members,
        sprints
      }
    },
    enabled: !!workspaceId
  })
}
