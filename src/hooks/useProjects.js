import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * useProjects — fetch all projects in a workspace.
 */
export function useProjects(workspaceId) {
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!workspaceId,
  })

  return { projects: projects || [], isLoading, error }
}

/**
 * useProject — fetch a single project by key within a workspace.
 */
export function useProject(workspaceId, projectKey) {
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', workspaceId, projectKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .ilike('key', projectKey)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!workspaceId && !!projectKey,
  })

  return { project, isLoading, error }
}

/**
 * useCreateProject — create a new project in a workspace.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ workspaceId, name, description, key }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name,
          description: description || null,
          key: key.toUpperCase(),
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('A project with this key already exists in this workspace')
        }
        throw error
      }

      // Create default columns for the project
      const defaultColumns = [
        { project_id: data.id, name: 'Backlog', position: 1000 },
        { project_id: data.id, name: 'To Do', position: 2000 },
        { project_id: data.id, name: 'In Progress', position: 3000 },
        { project_id: data.id, name: 'Done', position: 4000 },
      ]

      await supabase.from('board_columns').insert(defaultColumns)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.workspaceId],
      })
    },
  })
}

/**
 * useUpdateProject — update project details.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...updates }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
    },
  })
}

/**
 * useDeleteProject — delete a project.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, workspaceId }) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] })
    },
  })
}
