import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar as CalendarIcon, Target } from 'lucide-react'
import { useProject } from '@/hooks/useProjects'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useIssues } from '@/hooks/useBoard'
import { format, differenceInDays, addDays, isBefore, isAfter, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export default function ProjectTimelinePage() {
  const { workspaceSlug, projectKey } = useParams()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)

  const { data: issues, isLoading: issuesLoading } = useIssues(project?.id)

  const timelineData = useMemo(() => {
    if (!issues) return []
    // Filter only issues that have both start and due dates
    return issues.filter(i => i.start_date && i.due_date).sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  }, [issues])

  const dateRange = useMemo(() => {
    if (timelineData.length === 0) return { start: new Date(), end: new Date() }
    const dates = timelineData.flatMap(i => [new Date(i.start_date), new Date(i.due_date)])
    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    }
  }, [timelineData])

  // Pad the range for better UX
  const viewStart = startOfMonth(dateRange.start)
  const viewEnd = endOfMonth(dateRange.end)
  const days = eachDayOfInterval({ start: viewStart, end: viewEnd })
  const totalDays = days.length

  if (projectLoading || issuesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-(--color-accent) border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-(--color-bg-primary) animate-fade-in">
      <div className="px-6 py-6 border-b border-(--color-border-subtle)">
        <h1 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-(--color-accent)" />
          Timeline
        </h1>
        <p className="text-sm text-(--color-text-secondary) mt-1">
          Visual Gantt chart of your scheduled issues.
        </p>
      </div>

      {timelineData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-(--color-bg-secondary) rounded-full flex items-center justify-center mb-4 border border-(--color-border-default)">
            <CalendarIcon className="w-8 h-8 text-(--color-text-tertiary)" />
          </div>
          <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">No Scheduled Issues</h3>
          <p className="text-sm text-(--color-text-secondary) mb-6 max-w-md text-center">
            You don't have any issues with both a Start Date and a Due Date. Edit an issue to schedule it on the timeline!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="min-w-max border border-(--color-border-default) rounded-xl bg-(--color-bg-secondary) overflow-hidden shadow-sm">
            
            {/* Header: Months / Days */}
            <div className="flex border-b border-(--color-border-default) bg-(--color-bg-elevated)">
              <div className="w-64 shrink-0 border-r border-(--color-border-default) p-4 font-semibold text-sm text-(--color-text-secondary) bg-(--color-bg-secondary) z-10 sticky left-0 shadow-[4px_0_12px_rgba(0,0,0,0.05)]">
                Issue
              </div>
              <div className="flex flex-col">
                <div className="flex border-b border-(--color-border-subtle)">
                  {/* Group days by month */}
                  {Array.from(new Set(days.map(d => format(d, 'MMM yyyy')))).map(monthStr => {
                    const monthDays = days.filter(d => format(d, 'MMM yyyy') === monthStr)
                    return (
                      <div key={monthStr} className="text-xs font-bold text-(--color-text-primary) px-2 py-1 border-r border-(--color-border-subtle)" style={{ width: `${monthDays.length * 32}px` }}>
                        {monthStr}
                      </div>
                    )
                  })}
                </div>
                <div className="flex">
                  {days.map(day => (
                    <div key={day.toISOString()} className="w-8 shrink-0 text-center text-[10px] text-(--color-text-tertiary) py-1 border-r border-(--color-border-subtle) font-medium">
                      {format(day, 'd')}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Body: Issues */}
            <div className="relative">
              {timelineData.map(issue => {
                const issueStart = new Date(issue.start_date)
                const issueEnd = new Date(issue.due_date)
                
                // Calculate position and width
                const offsetDays = differenceInDays(issueStart, viewStart)
                const durationDays = differenceInDays(issueEnd, issueStart) + 1
                
                const leftPos = offsetDays * 32
                const width = durationDays * 32

                return (
                  <div key={issue.id} className="flex border-b border-(--color-border-subtle) hover:bg-(--color-bg-hover) transition-colors group">
                    <div className="w-64 shrink-0 border-r border-(--color-border-default) px-4 py-3 bg-(--color-bg-secondary) z-10 sticky left-0 flex flex-col justify-center">
                      <span className="text-sm font-medium text-(--color-text-primary) truncate" title={issue.title}>
                        {issue.title}
                      </span>
                      <span className="text-xs text-(--color-text-tertiary) font-mono mt-0.5">sb-{issue.id.slice(0,8)}</span>
                    </div>
                    
                    <div className="relative flex-1" style={{ width: `${totalDays * 32}px` }}>
                      {/* Vertical grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none opacity-20">
                        {days.map((d, i) => (
                          <div key={i} className="w-8 h-full border-r border-(--color-border-subtle)" />
                        ))}
                      </div>
                      
                      {/* Gantt Bar */}
                      <div className="absolute h-full flex items-center py-2 px-1" style={{ left: `${leftPos}px`, width: `${width}px` }}>
                        <div className="w-full h-8 bg-(--color-accent) hover:bg-(--color-accent-hover) rounded-md shadow-sm border border-[rgba(255,255,255,0.1)] flex items-center cursor-pointer transition-colors relative overflow-hidden group-hover:ring-2 ring-(--color-accent) ring-offset-1 ring-offset-(--color-bg-secondary)">
                           {/* Micro-animation gradient overlay */}
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                           {durationDays >= 3 && (
                             <span className="text-[10px] font-bold text-white truncate drop-shadow-md z-10 relative px-2 pointer-events-none">
                               {format(issueStart, 'MMM d')} - {format(issueEnd, 'MMM d')}
                             </span>
                           )}
                        </div>
                        {durationDays < 3 && (
                          <span className="absolute left-full ml-2 text-[10px] font-bold text-(--color-text-secondary) whitespace-nowrap z-10 pointer-events-none group-hover:text-(--color-text-primary) transition-colors">
                            {format(issueStart, 'MMM d')} {durationDays > 1 ? `- ${format(issueEnd, 'MMM d')}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
