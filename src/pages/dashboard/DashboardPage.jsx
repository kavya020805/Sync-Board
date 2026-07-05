import { useParams } from 'react-router-dom'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import { FolderKanban, Users, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * DashboardPage — workspace home screen.
 * Shows quick stats and project overview.
 * Will be expanded in Sprint 5 with full analytics.
 */
export default function DashboardPage() {
  const { workspaceSlug } = useParams()
  const { workspace } = useWorkspace(workspaceSlug)
  const { projects } = useProjects(workspace?.id)

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-(--color-text-primary) mb-1">
        {workspace?.name || 'Dashboard'}
      </h1>
      <p className="text-sm text-(--color-text-secondary) mb-8">
        Welcome to your workspace overview
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-accent-muted) flex items-center justify-center">
              <FolderKanban className="w-4.5 h-4.5 text-(--color-accent)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">{projects.length}</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Projects</p>
        </div>

        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-info-muted) flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-(--color-info)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">0</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Open issues</p>
        </div>

        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-success-muted) flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-(--color-success)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">1</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Team members</p>
        </div>
      </div>

      {/* Projects */}
      <h2 className="text-sm font-semibold text-(--color-text-primary) mb-3">Recent Projects</h2>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              to={`/w/${workspaceSlug}/p/${project.key.toLowerCase()}`}
              className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) hover:border-(--color-border-strong) hover:bg-(--color-bg-hover) transition-all duration-200 no-underline"
            >
              <h3 className="text-sm font-medium text-(--color-text-primary)">{project.name}</h3>
              <p className="text-xs text-(--color-text-tertiary) font-mono mt-0.5">{project.key}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-tertiary) py-8 text-center">
          No projects yet. Create one from the sidebar.
        </p>
      )}
    </div>
  )
}
