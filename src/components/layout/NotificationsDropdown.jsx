import React, { useState, useRef, useEffect } from 'react'
import { Bell, Check, Info, MessageSquare, Tag, UserPlus } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function NotificationsDropdown() {
  const { user } = useAuth()
  const { data: notifications } = useNotifications(user?.id)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unreadCount = notifications?.filter(n => !n.is_read)?.length || 0

  const getIcon = (type) => {
    switch(type) {
      case 'mention': return <Tag className="w-4 h-4 text-(--color-accent)" />
      case 'assigned': return <UserPlus className="w-4 h-4 text-(--color-success)" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-(--color-warning)" />
      default: return <Info className="w-4 h-4 text-(--color-text-secondary)" />
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markRead.mutate({ id: notification.id, userId: user?.id })
    }
    
    // If we have an issue_id, we navigate to the backlog page which has all issues.
    if (notification.issue_id && notification.issue?.project) {
      const projectKey = notification.issue.project.key
      const workspaceSlug = notification.issue.project.workspace?.slug
      if (projectKey && workspaceSlug) {
        navigate(`/w/${workspaceSlug}/p/${projectKey}/backlog?issueId=${notification.issue_id}`)
      }
    }
    
    setIsOpen(false)
  }

  const handleMarkAllRead = (e) => {
    e.stopPropagation()
    markAllRead.mutate(user?.id)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-md flex items-center justify-center text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-all duration-200 cursor-pointer relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-(--color-error) border-2 border-(--color-bg-secondary)"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 rounded-lg border border-(--color-border-default) bg-(--color-bg-elevated) shadow-xl z-50 flex flex-col animate-scale-in max-h-[85vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border-subtle) shrink-0">
            <h3 className="font-semibold text-sm text-(--color-text-primary)">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-(--color-bg-secondary) flex items-center justify-center text-(--color-text-tertiary)">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm text-(--color-text-secondary)">No notifications yet</p>
                <p className="text-xs text-(--color-text-tertiary)">When you are assigned an issue or @mentioned, it will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`text-left p-4 hover:bg-(--color-bg-hover) transition-colors flex gap-3 ${!notification.is_read ? 'bg-(--color-bg-secondary)' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-sm font-medium text-(--color-text-primary) leading-snug">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-(--color-text-secondary) line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[10px] text-(--color-text-tertiary) mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="shrink-0 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-(--color-accent)"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
