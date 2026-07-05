import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * useWorkspaces — fetch all workspaces the current user belongs to.
 */
export function useWorkspaces() {
  const { user } = useAuth()

  const {
    data: workspaces,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace:workspaces (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error
      return data.map((m) => ({ ...m.workspace, role: m.role }))
    },
    enabled: !!user?.id,
  })

  return { workspaces: workspaces || [], isLoading, error }
}

/**
 * useWorkspace — fetch a single workspace by slug.
 */
export function useWorkspace(slug) {
  const { workspaces } = useWorkspaces()
  const workspace = workspaces.find((w) => w.slug === slug)
  return { workspace }
}

/**
 * useCreateWorkspace — create a new workspace and add the creator as owner.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ name, slug }) => {
      // Create workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name, slug, created_by: user.id })
        .select()
        .single()

      if (wsError) throw wsError

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
          status: 'accepted',
        })

      if (memberError) throw memberError

      return workspace
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

/**
 * useUpdateWorkspace — rename or update a workspace.
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

/**
 * useDeleteWorkspace — delete a workspace.
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
