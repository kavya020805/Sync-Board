import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useColumns(projectId) {
  return useQuery({
    queryKey: ['columns', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_columns')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useIssues(projectId) {
  return useQuery({
    queryKey: ['issues', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*, assignee:profiles(*)')
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, name, position }) => {
      const { data, error } = await supabase
        .from('board_columns')
        .insert([{ project_id: projectId, name, position }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['columns', variables.projectId] })
    },
  })
}

export function useUpdateColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('board_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', data.project_id] })
    },
  })
}

export function useDeleteColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from('board_columns').delete().eq('id', id)
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['columns', variables.projectId] })
    },
  })
}

export function useCreateIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (issue) => {
      const { data, error } = await supabase
        .from('issues')
        .insert([issue])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues', data.project_id] })
    },
  })
}

export function useUpdateIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues', data.project_id] })
    },
  })
}

export function useDeleteIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from('issues').delete().eq('id', id)
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues', variables.projectId] })
    },
  })
}

export function useMoveIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, columnId, position }) => {
      const { data, error } = await supabase
        .from('issues')
        .update({ column_id: columnId, position })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues', data.project_id] })
    },
  })
}

export function useMoveColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, position }) => {
      const { data, error } = await supabase
        .from('board_columns')
        .update({ position })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', data.project_id] })
    },
  })
}
