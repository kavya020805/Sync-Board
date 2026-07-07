import React, { useState } from 'react'
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments'
import { formatDistanceToNow } from 'date-fns'
import { getInitials } from '@/lib/utils'
import { Send, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function IssueComments({ issueId, members }) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useComments(issueId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  
  const [newComment, setNewComment] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  
  const textareaRef = React.useRef(null)

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-(--color-text-tertiary)">Loading comments...</div>
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setNewComment(val)
    
    // Check if we are typing a mention
    const cursor = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursor)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)
    
    if (match) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
    }
  }

  const handleSelectMention = (member) => {
    const name = member.profile?.display_name?.replace(/\s+/g, '') || member.profile?.email?.split('@')[0]
    const cursor = textareaRef.current?.selectionStart || newComment.length
    const textBeforeCursor = newComment.slice(0, cursor)
    const textAfterCursor = newComment.slice(cursor)
    
    const newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_]*)$/, `@${name} `)
    setNewComment(newTextBefore + textAfterCursor)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }

  const filteredMembers = members?.filter(m => {
    if (m.user_id === user?.id) return false // Don't show self
    const name = m.profile?.display_name || m.profile?.email || ''
    return name.toLowerCase().includes(mentionQuery?.toLowerCase() || '')
  }) || []
  
  // Add an "@all" option if it matches the query
  if ('all'.includes(mentionQuery?.toLowerCase() || '')) {
    filteredMembers.unshift({
      user_id: 'all',
      profile: { display_name: 'all', email: 'Notify everyone in workspace' }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    // Find mentioned users
    const mentionedNames = newComment.match(/@([a-zA-Z0-9_]+)/g)?.map(m => m.slice(1).toLowerCase()) || []
    
    let mentionedUsers = []
    if (mentionedNames.includes('all')) {
      // Mention everyone except self
      mentionedUsers = members?.filter(m => m.user_id !== user?.id) || []
    } else {
      mentionedUsers = members?.filter(m => {
        const name = (m.profile?.display_name?.replace(/\s+/g, '') || m.profile?.email?.split('@')[0]).toLowerCase()
        return mentionedNames.includes(name) && m.user_id !== user?.id
      }) || []
    }

    createComment.mutate({
      issue_id: issueId,
      body: newComment.trim()
    }, {
      onSuccess: async () => {
        setNewComment('')
        setMentionQuery(null)
        
        // Insert notifications for mentioned users
        if (mentionedUsers.length > 0) {
          const notifications = mentionedUsers.filter(m => m.user_id !== user?.id).map(m => ({
            user_id: m.user_id,
            type: 'mention',
            title: 'You were mentioned',
            message: `${user?.user_metadata?.display_name || 'Someone'} mentioned you in a comment.`,
            issue_id: issueId
          }))
          
          if (notifications.length > 0) {
            const { error } = await supabase.from('notifications').insert(notifications)
            if (error) {
              console.error("RLS Error inserting notification:", error)
              toast.error("Notification failed: Please run the SQL script to update database permissions.")
            }
          }
        }
      }
    })
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this comment?')) {
      deleteComment.mutate({ id, issueId })
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-4">
        {comments?.length === 0 ? (
          <div className="text-center text-sm text-(--color-text-tertiary) py-4 flex flex-col items-center gap-2">
            <MessageSquare className="w-6 h-6 text-(--color-text-tertiary) opacity-50" />
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments?.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="shrink-0">
                {comment.user?.avatar_url ? (
                  <img src={comment.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-(--color-border-default)" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-(--color-bg-tertiary) text-(--color-text-secondary) flex items-center justify-center text-xs font-bold border border-(--color-border-default)">
                    {comment.user?.display_name ? getInitials(comment.user.display_name) : 'U'}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-(--color-text-primary)">
                      {comment.user?.display_name || 'Someone'}
                    </span>
                    <span className="text-xs text-(--color-text-tertiary)">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {comment.user_id === user?.id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-(--color-text-tertiary) hover:text-(--color-error) p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-(--color-text-secondary) bg-(--color-bg-secondary) p-3 rounded-md border border-(--color-border-default) whitespace-pre-wrap">
                  {comment.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 flex gap-3 border-t border-(--color-border-subtle) pt-4">
        <div className="shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-(--color-border-default)" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-bold border border-(--color-accent-muted)">
              {user?.user_metadata?.display_name ? getInitials(user.user_metadata.display_name) : 'U'}
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2 relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            placeholder="Add a comment... (Type @ to mention)"
            rows={3}
            className="w-full text-sm p-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-(--color-text-primary) placeholder:text-(--color-text-tertiary) resize-none focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
          />
          
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-(--color-bg-elevated) border border-(--color-border-default) rounded-md shadow-lg overflow-hidden z-10 animate-fade-in">
              <div className="max-h-48 overflow-y-auto py-1">
                {filteredMembers.map(m => (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => handleSelectMention(m)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-(--color-bg-hover) flex items-center gap-2"
                  >
                    {m.profile?.avatar_url ? (
                      <img src={m.profile.avatar_url} className="w-5 h-5 rounded-full" alt="" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center text-[10px] font-bold">
                        {getInitials(m.profile?.display_name || 'U')}
                      </div>
                    )}
                    <span className="text-(--color-text-primary) font-medium">{m.profile?.display_name}</span>
                    <span className="text-(--color-text-tertiary) text-xs truncate">({m.profile?.email})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createComment.isPending || !newComment.trim()}
              className="h-8 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
            >
              {createComment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
