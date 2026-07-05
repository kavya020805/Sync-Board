import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateWorkspace } from '@/hooks/useWorkspaces'
import { slugify } from '@/lib/utils'
import { Loader2, ArrowRight, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateWorkspacePage() {
  const navigate = useNavigate()
  const createWorkspace = useCreateWorkspace()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)
    if (!slugEdited) {
      setSlug(slugify(newName))
    }
  }

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value))
    setSlugEdited(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a workspace name')
      return
    }

    if (!slug.trim()) {
      toast.error('Please enter a valid URL slug')
      return
    }

    try {
      const workspace = await createWorkspace.mutateAsync({ name: name.trim(), slug })
      toast.success('Workspace created!')
      navigate(`/w/${workspace.slug}`)
    } catch (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('A workspace with this URL already exists. Try a different name.')
      } else {
        toast.error(error.message || 'Failed to create workspace')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="w-14 h-14 rounded-md bg-(--color-accent-muted) flex items-center justify-center mb-6">
          <Building2 className="w-7 h-7 text-(--color-accent)" />
        </div>

        <h1 className="text-2xl font-bold text-(--color-text-primary) mb-1.5">
          Create a workspace
        </h1>
        <p className="text-sm text-(--color-text-secondary) mb-8">
          Workspaces are shared environments where teams manage projects together.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
              Workspace name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Acme Engineering"
              autoFocus
              className="w-full h-11 px-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) transition-colors duration-200 focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
              Workspace URL
            </label>
            <div className="flex items-center h-11 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) overflow-hidden transition-colors focus-within:border-(--color-accent) focus-within:ring-1 focus-within:ring-(--color-accent)">
              <span className="px-3 text-sm text-(--color-text-tertiary) bg-(--color-bg-tertiary) h-full flex items-center border-r border-(--color-border-default) shrink-0">
                syncboard.app/w/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme-engineering"
                className="flex-1 h-full px-3 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createWorkspace.isPending}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg mt-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {createWorkspace.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
