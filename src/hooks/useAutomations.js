import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAutomations(projectId) {
  return useQuery({
    queryKey: ['automations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateAutomation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, trigger_event, action_type, action_payload }) => {
      const { data, error } = await supabase
        .from('automations')
        .insert([{ project_id: projectId, trigger_event, action_type, action_payload }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['automations', variables.projectId])
    },
  })
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from('automations').delete().eq('id', id)
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['automations', variables.projectId])
    },
  })
}
