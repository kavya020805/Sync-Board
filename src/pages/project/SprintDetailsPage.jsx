import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Info } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject } from '@/hooks/useProjects'
import { useSprints } from '@/hooks/useSprints'
import { useIssues, useColumns } from '@/hooks/useBoard'

export default function SprintDetailsPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w) => w.slug === workspaceSlug)
  
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(project?.id)
  const { data: issues, isLoading: issuesLoading } = useIssues(project?.id)
  const { data: columns, isLoading: columnsLoading } = useColumns(project?.id)

  const isLoading = projectLoading || sprintsLoading || issuesLoading || columnsLoading

  // Calculate chart data
  const { burndownData, velocityData } = useMemo(() => {
    if (!sprints || !issues || !columns) return { burndownData: [], velocityData: [] }

    // Identify "Done" column (assuming it's the one with the highest position)
    const doneColumn = [...columns].sort((a, b) => b.position - a.position)[0]
    const doneColumnId = doneColumn?.id

    // Velocity Chart Calculation
    // Take the last 6 sprints that are not 'planned' (e.g. completed or active)
    const pastSprints = sprints.filter(s => s.status !== 'planned').slice(-6)
    
    let totalCompletedAll = 0
    let velocityCount = 0

    const vData = pastSprints.map((sprint) => {
      const sprintIssues = issues.filter(i => i.sprint_id === sprint.id)
      const completedCount = sprintIssues.filter(i => i.column_id === doneColumnId).length
      
      if (sprint.status === 'completed') {
        totalCompletedAll += completedCount
        velocityCount++
      }

      const average = velocityCount > 0 ? Math.round(totalCompletedAll / velocityCount) : 0

      return {
        name: sprint.name,
        completed: completedCount,
        average
      }
    })

    // Burndown Chart Calculation for Active Sprint
    const activeSprint = sprints.find(s => s.status === 'active')
    let bData = []

    if (activeSprint && activeSprint.start_date && activeSprint.end_date) {
      const activeIssues = issues.filter(i => i.sprint_id === activeSprint.id)
      const totalIssues = activeIssues.length
      
      const start = new Date(activeSprint.start_date)
      const end = new Date(activeSprint.end_date)
      const today = new Date()

      // Calculate days in sprint
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1
      
      // Calculate how many issues are currently done
      const currentlyDone = activeIssues.filter(i => i.column_id === doneColumnId).length
      const currentlyRemaining = totalIssues - currentlyDone

      // Generate data points
      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(currentDate.getDate() + i)
        
        const isFuture = currentDate > today
        
        const ideal = Math.max(0, totalIssues - (totalIssues / days) * i)
        
        bData.push({
          name: `Day ${i}`,
          ideal: Number(ideal.toFixed(1)),
          // Only show actual for past/present days. For simplicity without historical logs,
          // we just plot a straight line from total issues on day 0 to currently remaining issues today.
          actual: isFuture ? null : (i === 0 ? totalIssues : currentlyRemaining)
        })
      }
    }

    return { burndownData: bData, velocityData: vData }
  }, [sprints, issues, columns])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full pb-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Reports & Charts</h1>
        <p className="text-sm text-(--color-text-secondary) mt-1">{project.key} Project Insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <div className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">Active Sprint Burndown</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-(--color-text-tertiary)" />
              <div className="absolute right-0 w-64 p-2 mt-2 text-xs text-(--color-text-secondary) bg-(--color-bg-elevated) border border-(--color-border-default) rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                Shows the ideal vs actual remaining issues for the active sprint. Requires an active sprint with a set start and end date.
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {burndownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
                  <Line type="monotone" dataKey="ideal" name="Ideal Tasks" stroke="var(--color-text-tertiary)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Remaining Tasks" stroke="var(--color-accent)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-(--color-text-tertiary)">
                No active sprint with dates set.
              </div>
            )}
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-(--color-text-primary) mb-6">Team Velocity</h3>
          <div className="h-[300px] w-full">
            {velocityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                    cursor={{ fill: 'var(--color-bg-hover)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
                  <Bar dataKey="completed" name="Completed Tasks" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="average" name="Average Velocity" stroke="var(--color-text-secondary)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-(--color-text-tertiary)">
                Complete a sprint to see velocity data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
