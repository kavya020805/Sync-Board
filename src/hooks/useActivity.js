import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useActivity(issueId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!issueId) return

    const channel = supabase
      .channel(`public:activity_log:issue_id=eq.${issueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `issue_id=eq.${issueId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activity', issueId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId, queryClient])

  return useQuery({
    queryKey: ['activity', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          user:profiles!user_id(
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!issueId,
  })
}

export function useProjectActivity(projectId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    // Can't easily filter by project_id on the activity_log channel without a foreign key directly to projects.
    // We'll rely on the global invalidation or periodic refresh for now, or fetch it statically on dashboard load.
    
    // We can just subscribe to all activity_log inserts and invalidate if the dashboard is mounted.
    const channel = supabase
      .channel(`public:activity_log:project_id=${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projectActivity', projectId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient])

  return useQuery({
    queryKey: ['projectActivity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          user:profiles!user_id(
            id,
            email,
            display_name,
            avatar_url
          ),
          issue:issues!inner(
            id,
            title,
            project_id
          )
        `)
        .eq('issue.project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}
