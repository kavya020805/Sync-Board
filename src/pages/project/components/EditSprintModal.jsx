import React, { useState, useEffect } from 'react'
import { Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateSprint, useDeleteSprint } from '@/hooks/useSprints'

export default function EditSprintModal({ isOpen, onClose, sprint, onSave }) {
  const updateSprint = useUpdateSprint()
  const deleteSprint = useDeleteSprint()

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (sprint) {
      setName(sprint.name || '')
      setGoal(sprint.goal || '')
      setStartDate(sprint.start_date || '')
      setEndDate(sprint.end_date || '')
    }
  }, [sprint])

  if (!isOpen || !sprint) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date')
      return
    }

    updateSprint.mutate(
      {
        id: sprint.id,
        updates: {
          name: name.trim(),
          goal: goal.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
        }
      },
      {
        onSuccess: (data) => {
          toast.success('Sprint updated successfully')
          if (onSave) onSave(data)
          onClose()
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to update sprint')
        }
      }
    )
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this sprint? All tasks inside will be moved back to your Backlog.')) {
      deleteSprint.mutate(
        { id: sprint.id, projectId: sprint.project_id },
        {
          onSuccess: () => {
            toast.success('Sprint deleted successfully')
            onClose()
          },
          onError: (err) => {
            toast.error(err.message || 'Failed to delete sprint')
          }
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div 
        className="bg-(--color-bg-primary) border border-(--color-border-default) rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Edit Sprint</h2>
          <button
            onClick={onClose}
            className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors p-1 rounded-md hover:bg-(--color-bg-hover)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
              Sprint Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
              Sprint Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="What do we want to achieve?"
              className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) transition-all"
              />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-(--color-border-subtle) flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteSprint.isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-(--color-error) hover:bg-(--color-error-muted) rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleteSprint.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Sprint
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSprint.isPending || !name.trim()}
                className="px-4 py-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white text-sm font-medium rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {updateSprint.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Sprint
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
