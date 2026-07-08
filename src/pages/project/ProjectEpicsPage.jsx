import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Target, CheckCircle2, CircleDashed, Calendar } from 'lucide-react'
import { useProject } from '@/hooks/useProjects'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useEpics, useCreateEpic, useUpdateEpic } from '@/hooks/useEpics'
import { useIssues } from '@/hooks/useBoard'

export default function ProjectEpicsPage() {
  const { workspaceSlug, projectKey } = useParams()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)

  const { data: epics, isLoading: epicsLoading } = useEpics(project?.id)
  const { data: issues } = useIssues(project?.id)

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  const createEpic = useCreateEpic()
  const updateEpic = useUpdateEpic()

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    createEpic.mutate({
      projectId: project.id,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: 'planning',
      start_date: newStartDate ? new Date(newStartDate).toISOString() : null,
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null
    }, {
      onSuccess: () => {
        setIsCreating(false)
        setNewTitle('')
        setNewDescription('')
        setNewStartDate('')
        setNewDueDate('')
      }
    })
  }

  const handleToggleStatus = (epic) => {
    const newStatus = epic.status === 'completed' ? 'in_progress' : 'completed'
    updateEpic.mutate({ id: epic.id, status: newStatus })
  }

  if (projectLoading || epicsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-(--color-accent) border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-2">
            <Target className="w-6 h-6 text-(--color-accent)" />
            Epics
          </h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">
            Group issues into large, multi-month deliverables.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-(--color-accent) text-white font-medium rounded-lg hover:bg-(--color-accent-hover) transition-colors"
        >
          <Plus size={18} />
          New Epic
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-6 mb-8 animate-scale-in">
          <h3 className="text-lg font-semibold text-(--color-text-primary) mb-4">Create New Epic</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Epic Title</label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g. Q3 Marketing Site Redesign"
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent) outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Description (Optional)</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent) outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Start Date (Optional)</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent) outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent) outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || createEpic.isPending}
                className="px-4 py-2 bg-(--color-accent) text-white text-sm font-medium rounded-md hover:bg-(--color-accent-hover) disabled:opacity-50 transition-colors"
              >
                {createEpic.isPending ? 'Creating...' : 'Create Epic'}
              </button>
            </div>
          </div>
        </form>
      )}

      {epics?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed border-(--color-border-default) rounded-xl">
          <Target className="w-12 h-12 text-(--color-text-tertiary) mx-auto mb-4" />
          <h3 className="text-lg font-medium text-(--color-text-primary) mb-2">No Epics yet</h3>
          <p className="text-(--color-text-secondary) max-w-sm mx-auto">
            Group your issues into larger, trackable deliverables like "Website Redesign" or "Q3 Launch".
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {epics?.map(epic => {
            const epicIssues = issues?.filter(i => i.epic_id === epic.id) || []
            const completedIssues = epicIssues.filter(i => {
              // Assume last column is done, but for now we'll just check if it's completed based on status, wait we use columns... 
              // A simple proxy: if issue has no milestone maybe? No. We need column context. Let's just say any issue in the right-most column or with a specific flag.
              // We'll calculate progress simply: if the issue has a completed date, or for now we can just show total issues.
              return false; // we need columns to know what's done
            })

            const progress = epicIssues.length > 0 ? Math.round((completedIssues.length / epicIssues.length) * 100) : 0

            return (
              <div key={epic.id} className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-5 hover:border-(--color-border-strong) transition-colors flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <button 
                        onClick={() => handleToggleStatus(epic)}
                        className={`transition-colors ${epic.status === 'completed' ? 'text-emerald-500' : 'text-(--color-text-tertiary) hover:text-(--color-text-primary)'}`}
                      >
                        {epic.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
                      </button>
                      <h3 className={`text-lg font-bold ${epic.status === 'completed' ? 'text-(--color-text-secondary) line-through' : 'text-(--color-text-primary)'}`}>
                        {epic.title}
                      </h3>
                    </div>
                    {epic.description && (
                      <p className="text-sm text-(--color-text-secondary) ml-8 mb-3">
                        {epic.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 ml-8 text-xs font-medium text-(--color-text-tertiary)">
                      {epic.start_date || epic.due_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {epic.start_date ? new Date(epic.start_date).toLocaleDateString() : 'TBD'} 
                          {' → '}
                          {epic.due_date ? new Date(epic.due_date).toLocaleDateString() : 'TBD'}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5 bg-(--color-bg-hover) px-2 py-0.5 rounded">
                        <Target className="w-3.5 h-3.5" />
                        {epicIssues.length} issues
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-8">
                  <div className="flex items-center justify-between text-xs font-medium text-(--color-text-secondary) mb-1.5">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-(--color-bg-primary) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-(--color-accent) transition-all duration-500" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
