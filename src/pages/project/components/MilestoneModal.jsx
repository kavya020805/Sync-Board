import React, { useState, useEffect } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/hooks/useSprints'
import { toast } from 'sonner'

export default function MilestoneModal({ isOpen, onClose, milestone, projectId }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [status, setStatus] = useState('open')

  const createMilestone = useCreateMilestone()
  const updateMilestone = useUpdateMilestone()
  const deleteMilestone = useDeleteMilestone()

  const isEditing = !!milestone

  useEffect(() => {
    if (isOpen) {
      if (milestone) {
        setName(milestone.name || '')
        setDescription(milestone.description || '')
        setTargetDate(milestone.target_date || '')
        setStatus(milestone.status || 'open')
      } else {
        setName('')
        setDescription('')
        setTargetDate('')
        setStatus('open')
      }
    }
  }, [isOpen, milestone])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    if (isEditing) {
      updateMilestone.mutate({
        id: milestone.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          target_date: targetDate || null,
          status
        }
      }, {
        onSuccess: () => {
          toast.success('Milestone updated successfully')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    } else {
      createMilestone.mutate({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
        status: 'open'
      }, {
        onSuccess: () => {
          toast.success('Milestone created successfully')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this milestone? Any issues inside it will simply have their milestone unassigned.')) {
      deleteMilestone.mutate({ id: milestone.id, projectId: milestone.project_id }, {
        onSuccess: () => {
          toast.success('Milestone deleted')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    }
  }

  const isPending = createMilestone.isPending || updateMilestone.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">
            {isEditing ? 'Edit Milestone' : 'Create Milestone'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. v1.0 Launch"
              autoFocus
              className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the goals of this milestone?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) resize-none focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMilestone.isPending}
                className="p-2 text-(--color-text-tertiary) hover:text-(--color-error) hover:bg-(--color-error-muted) rounded-md transition-colors"
                title="Delete Milestone"
              >
                {deleteMilestone.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Milestone'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
