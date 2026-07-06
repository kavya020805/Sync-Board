import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { FolderKanban, Users, BarChart3, Loader2, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { workspaceSlug } = useParams()
  const navigate = useNavigate()
  
  const { workspace, isLoading: workspaceLoading } = useWorkspace(workspaceSlug)
  const { projects, isLoading: projectsLoading } = useProjects(workspace?.id)
  const { members, isLoading: membersLoading } = useWorkspaceMembers(workspace?.id)

  const { data: issuesCount, isLoading: issuesLoading } = useQuery({
    queryKey: ['workspace-issues-count', workspace?.id],
    queryFn: async () => {
      if (!projects || projects.length === 0) return 0
      
      const { count, error } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projects.map(p => p.id))
        
      if (error) throw error
      return count || 0
    },
    enabled: !!projects && projects.length > 0
  })

  const isLoading = workspaceLoading || projectsLoading || membersLoading || issuesLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            {workspace?.name || 'Dashboard'}
          </h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">
            Welcome to your workspace overview
          </p>
        </div>
        <button 
          onClick={() => navigate(`/w/${workspaceSlug}/new-project`)}
          className="h-10 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-(--color-accent-text) text-sm font-medium rounded-md shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-accent-muted) flex items-center justify-center">
              <FolderKanban className="w-4.5 h-4.5 text-(--color-accent)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">{projects?.length || 0}</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Projects</p>
        </div>

        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-info-muted) flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-(--color-info)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">{issuesCount || 0}</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Total issues</p>
        </div>

        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-(--color-success-muted) flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-(--color-success)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-(--color-text-primary)">{members?.length || 0}</p>
          <p className="text-xs text-(--color-text-secondary) mt-0.5">Team members</p>
        </div>
      </div>

      {/* Projects */}
      <h2 className="text-sm font-semibold text-(--color-text-primary) mb-3">Recent Projects</h2>
      {projects && projects.length > 0 ? (
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
          No projects yet. Create one to get started.
        </p>
      )}
    </div>
  )
}
