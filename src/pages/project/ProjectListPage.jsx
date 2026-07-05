import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { FolderKanban, Plus, Loader2, Hash, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ProjectListPage() {
  const { workspaceSlug } = useParams()
  const { workspace } = useWorkspace(workspaceSlug)
  const { projects, isLoading } = useProjects(workspace?.id)
  const createProject = useCreateProject()
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [key, setKey] = useState('')
  const [keyEdited, setKeyEdited] = useState(false)

  const handleNameChange = (value) => {
    setName(value)
    if (!keyEdited) {
      // Auto-generate key from name: "My Project" → "MP"
      const generated = value
        .split(/\s+/)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 4)
      setKey(generated)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) {
      toast.error('Name and key are required')
      return
    }

    try {
      const project = await createProject.mutateAsync({
        workspaceId: workspace.id,
        name: name.trim(),
        description: description.trim(),
        key: key.trim(),
      })
      toast.success('Project created!')
      setShowCreate(false)
      setName('')
      setDescription('')
      setKey('')
      setKeyEdited(false)
      navigate(`/w/${workspaceSlug}/p/${project.key.toLowerCase()}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create project')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-(--color-text-primary)">Projects</h1>
          <p className="text-sm text-(--color-text-secondary) mt-0.5">
            Manage projects in {workspace?.name || 'this workspace'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New project
        </button>
      </div>

      {/* Create project form */}
      {showCreate && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-5 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) animate-slide-down"
        >
          <h3 className="text-sm font-semibold text-(--color-text-primary) mb-4">Create a new project</h3>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                  Project name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Frontend App"
                  autoFocus
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                  Key
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    setKeyEdited(true)
                  }}
                  placeholder="FA"
                  maxLength={5}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) font-mono placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                Description <span className="text-(--color-text-tertiary)">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={2}
                className="w-full px-3 py-2.5 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) resize-none focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProject.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer disabled:opacity-50"
              >
                {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-(--color-accent) animate-spin" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/w/${workspaceSlug}/p/${project.key.toLowerCase()}`}
              className="group p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) hover:border-(--color-border-strong) hover:bg-(--color-bg-hover) transition-all duration-200 no-underline"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-md bg-(--color-accent-muted) flex items-center justify-center">
                  <Hash className="w-5 h-5 text-(--color-accent)" />
                </div>
                <ArrowRight className="w-4 h-4 text-(--color-text-tertiary) opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <h3 className="text-sm font-semibold text-(--color-text-primary) mb-0.5">{project.name}</h3>
              <p className="text-xs text-(--color-text-tertiary) font-mono">{project.key}</p>
              {project.description && (
                <p className="text-xs text-(--color-text-secondary) mt-2 line-clamp-2">{project.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-(--color-text-tertiary)" />
          </div>
          <h3 className="text-sm font-medium text-(--color-text-primary) mb-1">No projects yet</h3>
          <p className="text-xs text-(--color-text-secondary) mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create project
          </button>
        </div>
      )}
    </div>
  )
}
