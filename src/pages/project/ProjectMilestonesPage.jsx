import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject } from '@/hooks/useProjects'
import { useMilestones } from '@/hooks/useSprints'
import { useIssues, useColumns } from '@/hooks/useBoard'
import { Loader2, Plus, Target, Calendar, CheckCircle2, ChevronRight, Edit2 } from 'lucide-react'
import MilestoneModal from './components/MilestoneModal'

export default function ProjectMilestonesPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w) => w.slug === workspaceSlug)
  
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(project?.id)
  const { data: issues, isLoading: issuesLoading } = useIssues(project?.id)
  const { data: columns, isLoading: columnsLoading } = useColumns(project?.id)
  
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const isLoading = projectLoading || milestonesLoading || issuesLoading || columnsLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  if (!project) return null

  const doneColumn = columns?.length > 0 ? [...columns].sort((a, b) => b.position - a.position)[0] : null

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Milestones</h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">Track long-term goals and major releases for {project.key}</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="h-10 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Milestone
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((milestone) => {
            const milestoneIssues = issues?.filter(i => i.milestone_id === milestone.id) || []
            const completedIssues = milestoneIssues.filter(i => doneColumn && i.column_id === doneColumn.id)
            
            const total = milestoneIssues.length
            const completed = completedIssues.length
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
            
            const isPastDue = milestone.target_date && new Date(milestone.target_date) < new Date() && milestone.status === 'open'
            
            return (
              <div 
                key={milestone.id} 
                className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-5 hover:border-(--color-border-strong) transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-(--color-text-primary) truncate">{milestone.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      milestone.status === 'open' ? 'bg-(--color-success-muted) text-(--color-success)' : 'bg-(--color-bg-tertiary) text-(--color-text-secondary)'
                    }`}>
                      {milestone.status}
                    </span>
                    {isPastDue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-(--color-error-muted) text-(--color-error)">
                        Past Due
                      </span>
                    )}
                  </div>
                  
                  {milestone.description && (
                    <p className="text-sm text-(--color-text-secondary) mb-4 line-clamp-2">
                      {milestone.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-(--color-text-tertiary)">
                    {milestone.target_date && (
                      <div className={`flex items-center gap-1.5 ${isPastDue ? 'text-(--color-error)' : ''}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(milestone.target_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      {total} issues
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-(--color-text-secondary)">Progress</span>
                    <span className={progress === 100 ? 'text-(--color-success)' : 'text-(--color-text-primary)'}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-(--color-bg-tertiary) rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-(--color-success)' : 'bg-(--color-accent)'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-(--color-text-tertiary) text-right">
                    {completed} of {total} completed
                  </div>
                </div>
                
                <div className="flex items-center shrink-0">
                  <button 
                    onClick={() => setEditingMilestone(milestone)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-(--color-bg-secondary) border border-dashed border-(--color-border-default) rounded-xl text-center">
            <div className="w-16 h-16 bg-(--color-bg-tertiary) rounded-full flex items-center justify-center mb-4 text-(--color-text-tertiary)">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">No Milestones Yet</h3>
            <p className="text-sm text-(--color-text-secondary) max-w-md mb-6">
              Milestones help you track progress on larger goals, epics, or releases. Create your first milestone to start grouping issues together.
            </p>
            <button 
              onClick={() => setIsCreating(true)}
              className="h-9 px-4 flex items-center gap-2 bg-(--color-bg-primary) border border-(--color-border-default) hover:bg-(--color-bg-hover) text-(--color-text-primary) rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Milestone
            </button>
          </div>
        )}
      </div>

      <MilestoneModal 
        isOpen={isCreating} 
        onClose={() => setIsCreating(false)} 
        projectId={project.id} 
      />
      
      <MilestoneModal 
        isOpen={!!editingMilestone} 
        onClose={() => setEditingMilestone(null)} 
        milestone={editingMilestone}
        projectId={project.id}
      />
    </div>
  )
}
