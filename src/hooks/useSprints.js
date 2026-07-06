import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateSprint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sprint) => {
      const { data, error } = await supabase
        .from('sprints')
        .insert([sprint])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.project_id] })
    },
  })
}

export function useUpdateSprint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('sprints')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.project_id] })
    },
  })
}

export function useDeleteSprint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from('sprints').delete().eq('id', id)
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['issues', variables.projectId] })
    },
  })
}

export function useMilestones(projectId) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (milestone) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert([milestone])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', data.project_id] })
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', data.project_id] })
    },
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from('milestones').delete().eq('id', id)
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['issues', variables.projectId] })
    },
  })
}

export function useCompleteSprint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sprintId, projectId, incompleteIssueIds }) => {
      // 1. Move incomplete issues back to backlog
      if (incompleteIssueIds && incompleteIssueIds.length > 0) {
        const { error: issuesError } = await supabase
          .from('issues')
          .update({ sprint_id: null })
          .in('id', incompleteIssueIds)
          
        if (issuesError) throw issuesError
      }

      // 2. Mark sprint as completed
      const { data, error: sprintError } = await supabase
        .from('sprints')
        .update({ status: 'completed' })
        .eq('id', sprintId)
        .select()
        .single()
        
      if (sprintError) throw sprintError
      
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['issues', variables.projectId] })
    }
  })
}
