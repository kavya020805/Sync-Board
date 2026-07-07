import React from 'react'
import { useActivity } from '@/hooks/useActivity'
import { formatDistanceToNow } from 'date-fns'
import { Activity, ArrowRight, UserPlus, UserMinus, Flag, Columns } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function IssueActivityFeed({ issueId, members }) {
  const { data: activities, isLoading } = useActivity(issueId)

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-(--color-text-tertiary)">Loading activity...</div>
  }

  if (!activities || activities.length === 0) {
    return <div className="p-4 text-center text-sm text-(--color-text-tertiary)">No activity recorded yet.</div>
  }

  const isUUID = (str) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  const renderActionText = (activity) => {
    const { action, new_value } = activity
    
    const formattedNewValue = isUUID(new_value) ? 'a different section' : new_value;
    
    switch(action) {
      case 'issue_created':
        return 'created this issue'
      case 'column_changed':
        return <span>moved issue to <span className="font-semibold text-(--color-text-primary)">{formattedNewValue || 'Backlog'}</span></span>
      case 'priority_changed':
        return <span>changed priority to <span className="font-semibold text-(--color-text-primary)">{formattedNewValue}</span></span>
      case 'assignee_added':
        const assignedMember = members?.find(m => m.user_id === new_value)
        const assignedName = assignedMember?.profile?.display_name || assignedMember?.profile?.email || 'someone'
        return <span>assigned this issue to <span className="font-semibold text-(--color-text-primary)">{assignedName}</span></span>
      case 'assignee_removed':
        return 'unassigned this issue'
      case 'sprint_changed':
        if (!new_value) return 'removed this issue from the sprint'
        return <span>added this issue to <span className="font-semibold text-(--color-text-primary)">{isUUID(new_value) ? 'a sprint' : new_value}</span></span>

      default:
        return 'updated the issue'
    }
  }

  const getActionIcon = (action) => {
    switch(action) {
      case 'issue_created': return <Activity className="w-3.5 h-3.5" />
      case 'column_changed': return <Columns className="w-3.5 h-3.5" />
      case 'priority_changed': return <Flag className="w-3.5 h-3.5" />
      case 'assignee_added': return <UserPlus className="w-3.5 h-3.5" />
      case 'assignee_removed': return <UserMinus className="w-3.5 h-3.5" />
      default: return <Activity className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {activities.map((activity, idx) => (
        <div key={activity.id} className="flex gap-3 relative">
          {/* Connecting line */}
          {idx !== activities.length - 1 && (
            <div className="absolute left-3.5 top-8 bottom-[-16px] w-[1px] bg-(--color-border-subtle)" />
          )}
          
          <div className="shrink-0 mt-0.5">
            {activity.user?.avatar_url ? (
              <img src={activity.user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-(--color-border-default)" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-(--color-bg-tertiary) text-(--color-text-secondary) flex items-center justify-center text-[10px] font-bold border border-(--color-border-default)">
                {activity.user?.display_name ? getInitials(activity.user.display_name) : 'U'}
              </div>
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="text-sm text-(--color-text-secondary) leading-snug">
              <span className="font-semibold text-(--color-text-primary) mr-1">
                {activity.user?.display_name || 'Someone'}
              </span>
              {' '}
              {renderActionText(activity)}
            </div>
            <div className="text-xs text-(--color-text-tertiary) mt-0.5 flex items-center gap-1">
              {getActionIcon(activity.action)}
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
