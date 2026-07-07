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
