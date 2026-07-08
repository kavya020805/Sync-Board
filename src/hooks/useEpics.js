import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useEpics(projectId) {
  return useQuery({
    queryKey: ['epics', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epics')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateEpic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, title, description, status, start_date, due_date }) => {
      const { data, error } = await supabase
        .from('epics')
        .insert([{ 
          project_id: projectId, 
          title, 
          description, 
          status, 
          start_date, 
          due_date 
        }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['epics', variables.projectId])
    },
  })
}

export function useUpdateEpic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('epics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['epics', data.project_id])
    },
  })
}
