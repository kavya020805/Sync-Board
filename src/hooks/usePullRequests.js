import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePullRequests(issueId) {
  return useQuery({
    queryKey: ['pull_requests', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pull_requests')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!issueId,
  })
}
