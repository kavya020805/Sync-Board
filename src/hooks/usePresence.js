import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * Tracks who is currently viewing a specific project board.
 * Returns an array of active user profiles.
 */
export function usePresence(projectId) {
  const { user, profile } = useAuth()
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    if (!projectId || !user || !profile) return

    const channel = supabase.channel(`presence-board-${projectId}`, {
      config: {
        presence: {
          key: user.id, // Using user ID ensures a user with multiple tabs doesn't show up twice
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Flatten the presence state into a simple array of unique users
        const users = Object.values(state).map((presences) => presences[0])
        setActiveUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [projectId, user, profile])

  return activeUsers
}
