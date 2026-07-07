import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useInviteMember } from '@/hooks/useWorkspaceInvites'

export default function InviteMemberModal({ isOpen, onClose, workspaceId }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const inviteMember = useInviteMember()

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return

    inviteMember.mutate(
      { workspaceId, email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success('Invitation sent successfully')
          setEmail('')
          setRole('member')
          onClose()
        },
        onError: (error) => {
          if (error.code === '23505') {
            toast.error('User is already invited or a member of this workspace')
          } else {
            toast.error(error.message || 'Failed to send invite')
          }
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div 
        className="bg-(--color-bg-primary) border border-(--color-border-default) rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Invite Member</h2>
          <button
            onClick={onClose}
            className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors p-1 rounded-md hover:bg-(--color-bg-hover)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text-primary) mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent transition-all"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-(--color-text-secondary) mt-1.5">
              {role === 'admin' 
                ? 'Admins can manage projects, settings, and invite other members.' 
                : 'Members can access projects and manage issues.'}
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMember.isPending || !email.trim()}
              className="px-4 py-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white text-sm font-medium rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {inviteMember.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
