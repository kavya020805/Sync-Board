import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useComments(issueId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!issueId) return

    const channel = supabase
      .channel(`public:comments:issue_id=eq.${issueId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'comments',
          filter: `issue_id=eq.${issueId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', issueId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId, queryClient])

  return useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
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
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!issueId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (comment) => {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          ...comment,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.issue_id] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ body })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.issue_id] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, issueId }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
      return { id, issueId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] })
    },
  })
}
