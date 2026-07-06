import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateIssue } from '@/hooks/useBoard'

export default function CreateIssueModal({ projectId, columnId, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const createIssue = useCreateIssue()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    createIssue.mutate(
      {
        project_id: projectId,
        column_id: columnId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Add New Issue</h2>
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

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIssue.isPending || !title.trim()}
              className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50"
            >
              {createIssue.isPending ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
