import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspace, useUpdateWorkspace, useDeleteWorkspace } from '@/hooks/useWorkspaces'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useWorkspaceInvites'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import {
  Settings, Trash2, Loader2, UserPlus, Mail,
  Shield, ShieldCheck, Crown, MoreHorizontal, X
} from 'lucide-react'
import { toast } from 'sonner'

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-(--color-warning)' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-(--color-accent)' },
  member: { label: 'Member', icon: Shield, color: 'text-(--color-text-tertiary)' },
}

export default function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace } = useWorkspace(workspaceSlug)
  const { members, isLoading: membersLoading } = useWorkspaceMembers(workspace?.id)
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()
  const inviteMember = useInviteMember()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const [name, setName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInvite, setShowInvite] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Initialize name when workspace loads
  useState(() => {
    if (workspace) setName(workspace.name)
  })

  const currentMember = members.find((m) => m.user_id === user?.id)
  const isOwner = currentMember?.role === 'owner'
  const isAdmin = currentMember?.role === 'admin' || isOwner

  const handleRename = async () => {
    if (!name.trim() || name === workspace?.name) return
    try {
      await updateWorkspace.mutateAsync({ id: workspace.id, name: name.trim() })
      toast.success('Workspace renamed')
    } catch (err) {
      toast.error(err.message || 'Failed to rename')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== workspace?.name) {
      toast.error('Please type the workspace name to confirm')
      return
    }
    try {
      await deleteWorkspace.mutateAsync(workspace.id)
      toast.success('Workspace deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace')
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      await inviteMember.mutateAsync({
        workspaceId: workspace.id,
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInvite(false)
    } catch (err) {
      toast.error(err.message || 'Failed to invite member')
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateRole.mutateAsync({
        memberId,
        role: newRole,
        workspaceId: workspace.id,
      })
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this workspace?`)) return
    try {
      await removeMember.mutateAsync({ memberId, workspaceId: workspace.id })
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-xl font-bold text-(--color-text-primary) mb-1">Workspace Settings</h1>
      <p className="text-sm text-(--color-text-secondary) mb-8">Manage your workspace and team members.</p>

      {/* General Settings */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--color-text-primary) mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" /> General
        </h2>
        <div className="p-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary)">
          <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
            Workspace name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name || workspace.name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-0 h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              disabled={!isAdmin}
            />
            {isAdmin && (
              <button
                onClick={handleRename}
                disabled={updateWorkspace.isPending || !name.trim() || name === workspace.name}
                className="h-10 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-(--color-text-primary) flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Members ({members.length})
          </h2>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              Invite
            </button>
          )}
        </div>

        {/* Invite form */}
        {showInvite && (
          <form
            onSubmit={handleInvite}
            className="mb-4 p-4 rounded-md border border-(--color-accent) bg-(--color-accent-muted) animate-slide-down"
          >
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                autoFocus
                className="flex-1 min-w-0 h-10 px-3 rounded-[var(--radius-md)] border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-accent)"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) cursor-pointer focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviteMember.isPending}
                className="h-10 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer disabled:opacity-50"
              >
                {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
              </button>
            </div>
          </form>
        )}

        {/* Members list */}
        <div className="rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) divide-y divide-(--color-border-subtle)">
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-(--color-accent) animate-spin" />
            </div>
          ) : (
            members.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role]
              const RoleIcon = roleConfig.icon
              const isCurrentUser = member.user_id === user?.id
              const memberName = member.profile?.display_name || member.invited_email || 'Unknown'

              return (
                <div key={member.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={memberName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(memberName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-(--color-text-primary) truncate">
                        {memberName}
                        {isCurrentUser && (
                          <span className="text-xs text-(--color-text-tertiary) ml-1.5">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-(--color-text-tertiary) truncate">
                        {member.profile?.email || member.invited_email}
                        {member.status === 'pending' && (
                          <span className="ml-1.5 text-(--color-warning)">• Pending</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 text-xs font-medium ${roleConfig.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      {roleConfig.label}
                    </span>

                    {isAdmin && !isCurrentUser && member.role !== 'owner' && (
                      <div className="flex items-center gap-1 ml-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="h-7 px-2 rounded text-xs border border-(--color-border-default) bg-(--color-bg-primary) text-(--color-text-secondary) cursor-pointer focus:outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id, memberName)}
                          className="w-7 h-7 rounded flex items-center justify-center text-(--color-text-tertiary) hover:text-(--color-error) hover:bg-(--color-error-muted) transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Danger Zone */}
      {isOwner && (
        <section>
          <h2 className="text-sm font-semibold text-(--color-error) mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </h2>
          <div className="p-4 rounded-md border border-(--color-error) border-opacity-30 bg-(--color-error-muted)">
            <p className="text-sm text-(--color-text-primary) mb-1 font-medium">Delete this workspace</p>
            <p className="text-xs text-(--color-text-secondary) mb-4">
              This will permanently delete the workspace, all projects, and all data. This action cannot be undone.
            </p>

            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-error) text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Delete workspace
              </button>
            ) : (
              <div className="flex flex-col gap-2 animate-slide-down">
                <p className="text-xs text-(--color-text-secondary)">
                  Type <strong className="text-(--color-text-primary)">{workspace.name}</strong> to confirm:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={workspace.name}
                    className="flex-1 min-w-0 h-9 px-3 rounded-md border border-(--color-error) bg-(--color-bg-primary) text-sm text-(--color-text-primary) focus:outline-none"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== workspace.name || deleteWorkspace.isPending}
                    className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-error) text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {deleteWorkspace.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
