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
 * useInviteMember — invite a member by email.
 */
export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, email, role = 'member' }) => {
      // Check if user exists in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        // User exists — add directly
        const { data, error } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: profile.id,
            role,
            invited_email: email,
            status: 'accepted',
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            throw new Error('This user is already a member of this workspace')
          }
          throw error
        }
        return data
      } else {
        // User doesn't exist — create pending invitation
        const { data, error } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            invited_email: email,
            role,
            status: 'pending',
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', variables.workspaceId],
      })
    },
  })
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
