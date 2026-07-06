import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * useWorkspaceMembers — fetch members of a workspace.
 */
export function useWorkspaceMembers(workspaceId) {
  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profile:profiles (id, email, display_name, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!workspaceId,
  })

  return { members: members || [], isLoading, error }
}


/**
 * useUpdateMemberRole — change a member's role.
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, role, workspaceId }) => {
      const { data, error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', variables.workspaceId],
      })
    },
  })
}

/**
 * useRemoveMember — remove a member from a workspace.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, workspaceId }) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', variables.workspaceId],
      })
    },
  })
}
