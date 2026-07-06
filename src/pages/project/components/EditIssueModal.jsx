import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUpdateIssue } from '@/hooks/useBoard'
import { useMilestones } from '@/hooks/useSprints'

export default function EditIssueModal({ issue, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [milestoneId, setMilestoneId] = useState('')

  const { data: milestones } = useMilestones(issue?.project_id)
  const updateIssue = useUpdateIssue()

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '')
      setDescription(issue.description || '')
      setPriority(issue.priority || 'medium')
      setMilestoneId(issue.milestone_id || '')
    }
  }, [issue])

  if (!issue) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    updateIssue.mutate(
      {
        id: issue.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          milestone_id: milestoneId || null,
        }
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Edit Issue</h2>
          <button
            onClick={onClose}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Issue Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Update user authentication flow"
              autoFocus
              className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details here..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) resize-none focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Milestone (Optional)
            </label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            >
              <option value="">No Milestone</option>
              {milestones?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateIssue.isPending || !title.trim()}
              className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 cursor-pointer"
            >
              {updateIssue.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
