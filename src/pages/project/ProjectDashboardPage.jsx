import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useIssues, useColumns } from '@/hooks/useBoard'
import { useSprints } from '@/hooks/useSprints'
import { useProjectActivity } from '@/hooks/useActivity'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Loader2, LayoutDashboard, AlertCircle, CheckCircle2, CircleDashed, Activity } from 'lucide-react'
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns'
import BlurText from '@/components/animations/BlurText'
import SpotlightCard from '@/components/animations/SpotlightCard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ProjectDashboardPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w) => w.slug === workspaceSlug)
  
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  
  const { data: issues, isLoading: issuesLoading } = useIssues(project?.id)
  const { data: columns, isLoading: columnsLoading } = useColumns(project?.id)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(project?.id)
  const { data: activities } = useProjectActivity(project?.id)

  const isLoading = projectLoading || issuesLoading || columnsLoading || sprintsLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-(--color-accent)" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 p-8 text-center text-(--color-text-secondary)">
        Project not found.
      </div>
    )
  }

  // --- Quick Stats ---
  const totalIssues = issues?.length || 0
  const doneColumn = columns?.find(c => c.name.toLowerCase().includes('done'))
  const completedIssues = issues?.filter(i => i.column_id === doneColumn?.id).length || 0
  const openIssues = totalIssues - completedIssues
  const activeSprint = sprints?.find(s => s.status === 'active')

  // --- Issues by Status (Pie Chart) ---
  const issuesByStatus = columns?.map(col => ({
    name: col.name,
    value: issues?.filter(i => i.column_id === col.id).length || 0
  })).filter(item => item.value > 0) || []

  // --- Sprint Progress ---
  let sprintProgress = 0
  let sprintTotalPoints = 0
  let sprintCompletedPoints = 0
  if (activeSprint) {
    const sprintIssues = issues?.filter(i => i.sprint_id === activeSprint.id) || []
    sprintTotalPoints = sprintIssues.reduce((sum, i) => sum + (i.story_points || 0), 0)
    sprintCompletedPoints = sprintIssues
      .filter(i => i.column_id === doneColumn?.id)
      .reduce((sum, i) => sum + (i.story_points || 0), 0)
      
    if (sprintTotalPoints > 0) {
      sprintProgress = Math.round((sprintCompletedPoints / sprintTotalPoints) * 100)
    }
  }

  // --- Overdue Issues ---
  const overdueIssues = issues?.filter(i => {
    if (!i.due_date) return false
    if (i.column_id === doneColumn?.id) return false
    return isPast(new Date(i.due_date)) && !isToday(new Date(i.due_date))
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)) || []

  return (
    <div className="flex-1 flex flex-col h-full bg-(--color-bg-primary) overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-(--color-accent)" />
            <BlurText text={`${project?.name || ''} Dashboard`} delay={100} animateBy="words" />
          </h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">
            Overview of project health and sprint progress.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpotlightCard className="p-5">
            <h3 className="text-sm font-medium text-(--color-text-secondary) flex items-center gap-2">
              <CircleDashed className="w-4 h-4" /> Total Issues
            </h3>
            <p className="text-3xl font-bold text-(--color-text-primary) mt-2">{totalIssues}</p>
          </SpotlightCard>
          <SpotlightCard className="p-5">
            <h3 className="text-sm font-medium text-(--color-text-secondary) flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-(--color-warning)" /> Open Issues
            </h3>
            <p className="text-3xl font-bold text-(--color-text-primary) mt-2">{openIssues}</p>
          </SpotlightCard>
          <SpotlightCard className="p-5">
            <h3 className="text-sm font-medium text-(--color-text-secondary) flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-(--color-success)" /> Completed
            </h3>
            <p className="text-3xl font-bold text-(--color-text-primary) mt-2">{completedIssues}</p>
          </SpotlightCard>
          <SpotlightCard className="p-5">
            <h3 className="text-sm font-medium text-(--color-text-secondary) flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-(--color-accent)" /> Active Sprint
            </h3>
            <p className="text-lg font-bold text-(--color-text-primary) mt-2 truncate">
              {activeSprint ? activeSprint.name : 'No active sprint'}
            </p>
          </SpotlightCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Sprint Progress */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-4">Sprint Progress (Story Points)</h3>
            {activeSprint ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-(--color-text-secondary)">{sprintCompletedPoints} / {sprintTotalPoints} pts</span>
                  <span className="font-medium text-(--color-text-primary)">{sprintProgress}%</span>
                </div>
                <div className="w-full bg-(--color-bg-elevated) rounded-full h-4 overflow-hidden border border-(--color-border-subtle)">
                  <div 
                    className="bg-(--color-accent) h-4 rounded-full transition-all duration-500"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-(--color-text-tertiary)">
                No active sprint.
              </div>
            )}
          </div>

          {/* Issues by Status Chart */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-4">Issues by Status</h3>
            {issuesByStatus.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issuesByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {issuesByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-(--color-text-tertiary)">
                No issues found.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overdue Issues */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-(--color-border-subtle) bg-(--color-bg-elevated)">
              <h3 className="text-base font-semibold text-(--color-error) flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Overdue Issues
              </h3>
            </div>
            <div className="divide-y divide-(--color-border-subtle) overflow-y-auto max-h-[400px]">
              {overdueIssues.length > 0 ? (
                overdueIssues.map(issue => (
                  <div key={issue.id} className="p-4 flex items-center justify-between hover:bg-(--color-bg-hover) transition-colors">
                    <div>
                      <Link to={`/w/${workspaceSlug}/p/${projectKey}/board?issueId=${issue.id}`} className="font-medium text-(--color-text-primary) hover:text-(--color-accent)">
                        {issue.title}
                      </Link>
                      <div className="text-xs text-(--color-text-secondary) mt-1">
                        Due: {format(new Date(issue.due_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-(--color-error-muted) text-(--color-error)`}>
                      Overdue
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-(--color-text-tertiary)">
                  Hooray! No overdue issues.
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-(--color-border-subtle) bg-(--color-bg-elevated)">
              <h3 className="text-base font-semibold text-(--color-text-primary) flex items-center gap-2">
                <Activity className="w-5 h-5 text-(--color-accent)" /> Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-(--color-border-subtle) overflow-y-auto max-h-[400px]">
              {activities?.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="p-4 flex items-start gap-3 hover:bg-(--color-bg-hover) transition-colors">
                    <div className="w-8 h-8 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold mt-0.5">
                      {activity.user?.avatar_url ? (
                        <img src={activity.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activity.user?.display_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-(--color-text-primary)">
                        <span className="font-medium">{activity.user?.display_name || 'Someone'}</span>{' '}
                        {activity.action === 'issue_created' && 'created issue '}
                        {activity.action === 'issue_deleted' && 'deleted issue '}
                        {activity.action === 'field_updated' && `updated ${activity.field_changed} on `}
                        {activity.action === 'comment_added' && 'commented on '}
                        <Link to={`/w/${workspaceSlug}/p/${projectKey}/board?issueId=${activity.issue_id}`} className="font-medium hover:text-(--color-accent)">
                          {activity.issue?.title || 'an issue'}
                        </Link>
                      </div>
                      <div className="text-xs text-(--color-text-tertiary) mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-(--color-text-tertiary)">
                  No recent activity.
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
