import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// 1. Fetch pending invites for the current logged-in user
export function usePendingInvites() {
  const { user, profile } = useAuth()
  
  return useQuery({
    queryKey: ['pending-invites', user?.id],
    queryFn: async () => {
      // The RLS policies allow the user to see invites where user_id = auth.uid() OR invited_email = profiles.email
      // We will explicitly filter by status = 'pending'
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          workspace:workspaces (
            id,
            name,
            slug
          )
        `)
        .eq('status', 'pending')
      
      if (error) throw error
      return data || []
    },
    enabled: !!user && !!profile,
  })
}

// 2. Respond to an invite (accept or decline)
export function useRespondToInvite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async ({ inviteId, action }) => {
      if (action === 'accept') {
        const { data, error } = await supabase
          .from('workspace_members')
          .update({ 
            status: 'accepted',
            user_id: user.id // Ensure user_id is set when accepting
          })
          .eq('id', inviteId)
          .select()
          .single()
          
        if (error) throw error
        return data
      } else if (action === 'decline') {
        const { error } = await supabase
          .from('workspace_members')
          .delete()
          .eq('id', inviteId)
          
        if (error) throw error
        return { id: inviteId }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    }
  })
}

// 3. Invite a new member by email (used by Workspace Admins/Owners)
export function useInviteMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ workspaceId, email, role }) => {
      // First, try to find if the user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
        
      const payload = {
        workspace_id: workspaceId,
        invited_email: email,
        role: role,
        status: 'pending',
        user_id: existingProfile ? existingProfile.id : null
      }
      
      const { data, error } = await supabase
        .from('workspace_members')
        .insert([payload])
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', data.workspace_id] })
    }
  })
}

// 4. Update an existing member's role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ memberId, role }) => {
      const { data, error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', data.workspace_id] })
    }
  })
}

// 5. Remove a member from the workspace
export function useRemoveMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ memberId, workspaceId }) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
        
      if (error) throw error
      return { memberId, workspaceId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] })
    }
  })
}
