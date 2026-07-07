import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useWorkspaceAnalytics } from '@/hooks/useWorkspaceAnalytics'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, Users, Target, Activity } from 'lucide-react'
import { format, subDays, isAfter, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isSameWeek } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6']
const PRIORITY_COLORS = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444' }

export default function WorkspaceAnalyticsPage() {
  const { workspaceSlug } = useParams()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  
  const { data, isLoading } = useWorkspaceAnalytics(workspace?.id)
  const [timeRange, setTimeRange] = useState('30days') // '7days', '30days', 'month'

  const chartData = useMemo(() => {
    if (!data) return null
    const { issues, activity, members, sprints } = data
    
    // 1. Issues Created vs Closed
    const now = new Date()
    let startDate
    if (timeRange === '7days') startDate = subDays(now, 7)
    else if (timeRange === '30days') startDate = subDays(now, 30)
    else startDate = startOfMonth(now)
    
    // Group activity by week for Created vs Closed
    const weeks = eachWeekOfInterval({ start: startDate, end: now })
    const createdVsClosed = weeks.map(weekStart => {
      const weekLabel = format(weekStart, 'MMM d')
      const weekCreated = activity.filter(a => a.action === 'issue_created' && isSameWeek(new Date(a.created_at), weekStart)).length
      const weekClosed = activity.filter(a => a.action === 'field_updated' && a.field_changed === 'column_id' && a.new_value?.toLowerCase().includes('done') && isSameWeek(new Date(a.created_at), weekStart)).length
      return { name: weekLabel, Created: weekCreated, Closed: weekClosed }
    })

    // 2. Team Velocity (Story points per sprint)
    const completedSprints = sprints.filter(s => s.status === 'completed').sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).slice(-10) // last 10 sprints
    const velocityData = completedSprints.map(sprint => {
      const sprintIssues = issues.filter(i => i.sprint_id === sprint.id && i.column?.name?.toLowerCase().includes('done'))
      const points = sprintIssues.reduce((sum, i) => sum + (i.story_points || 0), 0)
      return { name: sprint.name, Points: points }
    })

    // 3. Priority Distribution
    const priorityCount = { low: 0, medium: 0, high: 0 }
    issues.forEach(i => {
      if (priorityCount[i.priority] !== undefined) priorityCount[i.priority]++
    })
    const priorityData = [
      { name: 'High', value: priorityCount.high, color: PRIORITY_COLORS.high },
      { name: 'Medium', value: priorityCount.medium, color: PRIORITY_COLORS.medium },
      { name: 'Low', value: priorityCount.low, color: PRIORITY_COLORS.low },
    ].filter(i => i.value > 0)

    // 4. Member Activity Table
    const memberStats = members.map(m => {
      const assignedIssues = issues.filter(i => i.assignee_id === m.user_id)
      const completedIssues = assignedIssues.filter(i => i.column?.name?.toLowerCase().includes('done'))
      const pointsCompleted = completedIssues.reduce((sum, i) => sum + (i.story_points || 0), 0)
      
      return {
        id: m.user_id,
        name: m.profile?.display_name || 'Unknown',
        avatar: m.profile?.avatar_url,
        assigned: assignedIssues.length,
        completed: completedIssues.length,
        points: pointsCompleted
      }
    }).sort((a, b) => b.points - a.points)

    return { createdVsClosed, velocityData, priorityData, memberStats }
  }, [data, timeRange])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-(--color-bg-primary)">
        <Loader2 className="w-8 h-8 animate-spin text-(--color-accent)" />
      </div>
    )
  }

  if (!workspace) {
    return <div className="flex-1 p-8 text-center text-(--color-text-secondary) bg-(--color-bg-primary)">Workspace not found.</div>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-(--color-bg-primary) overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-2">
              <Activity className="w-6 h-6 text-(--color-accent)" />
              Workspace Analytics
            </h1>
            <p className="text-sm text-(--color-text-secondary) mt-1">
              Analyze team velocity, issue trends, and member performance across all projects.
            </p>
          </div>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent)"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Created vs Closed */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-(--color-accent)" /> Issues Created vs Closed
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.createdVsClosed} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Created" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Closed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Velocity */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-(--color-accent)" /> Team Velocity (Story Points)
            </h3>
            {chartData.velocityData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.velocityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                    />
                    <Line type="monotone" dataKey="Points" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-(--color-text-tertiary)">
                Not enough completed sprints yet.
              </div>
            )}
          </div>
          
          {/* Priority Distribution */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-6">Priority Distribution</h3>
            {chartData.priorityData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-(--color-text-tertiary)">
                No issues found.
              </div>
            )}
          </div>

          {/* Member Activity Table */}
          <div className="bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold text-(--color-text-primary) mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-(--color-accent)" /> Member Performance
            </h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border-subtle)">
                    <th className="pb-3 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wider">Member</th>
                    <th className="pb-3 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wider text-right">Assigned</th>
                    <th className="pb-3 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wider text-right">Completed</th>
                    <th className="pb-3 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wider text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle)">
                  {chartData.memberStats.map(member => (
                    <tr key={member.id} className="hover:bg-(--color-bg-hover) transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-medium text-(--color-text-primary)">{member.name}</span>
                      </td>
                      <td className="py-3 text-sm text-(--color-text-secondary) text-right">{member.assigned}</td>
                      <td className="py-3 text-sm text-(--color-text-secondary) text-right">{member.completed}</td>
                      <td className="py-3 text-sm font-medium text-(--color-accent) text-right">{member.points}</td>
                    </tr>
                  ))}
                  {chartData.memberStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-(--color-text-tertiary)">
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
