import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Subscribes to Postgres changes on 'issues' and 'board_columns' for a specific project.
 * Automatically invalidates React Query cache so the board reflects remote changes.
 */
export function useBoardRealtime(projectId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    const channel = supabase.channel(`board-${projectId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // You could optimally patch the cache here, but for simplicity
          // and data integrity, we simply invalidate to refetch the true state.
          queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_columns',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['columns', projectId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient])
}
