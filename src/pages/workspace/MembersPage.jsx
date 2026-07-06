import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useUpdateMemberRole, useRemoveMember } from '@/hooks/useWorkspaceInvites'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { Crown, ShieldCheck, Shield, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import InviteMemberModal from './components/InviteMemberModal'

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-(--color-warning)' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-(--color-accent)' },
  member: { label: 'Member', icon: Shield, color: 'text-(--color-text-tertiary)' },
}

export default function MembersPage() {
  const { workspaceSlug } = useParams()
  const { workspace } = useWorkspace(workspaceSlug)
  const { members } = useWorkspaceMembers(workspace?.id)
  const userRole = workspace?.role

  const { user } = useAuth()
  
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  
  const canManageMembers = userRole === 'owner' || userRole === 'admin'

  const handleRoleChange = (memberId, newRole) => {
    updateRole.mutate({ memberId, role: newRole }, {
      onSuccess: () => toast.success('Role updated successfully'),
      onError: (err) => toast.error(err.message)
    })
  }

  const handleRemove = (memberId, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the workspace?`)) {
      removeMember.mutate({ memberId, workspaceId: workspace?.id }, {
        onSuccess: () => toast.success('Member removed'),
        onError: (err) => toast.error(err.message)
      })
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-(--color-text-primary) mb-1">Members</h1>
          <p className="text-sm text-(--color-text-secondary)">
            {members.length} member{members.length !== 1 ? 's' : ''} in {workspace?.name}
          </p>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="h-9 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-(--color-accent-text) text-sm font-medium rounded-md shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) divide-y divide-(--color-border-subtle)">
        {members.map((member) => {
          const roleConfig = ROLE_CONFIG[member.role]
          const RoleIcon = roleConfig.icon
          const memberName = member.profile?.display_name || member.invited_email || 'Unknown'
          
          const isSelf = member.user_id === user?.id
          const isPending = member.status === 'pending'
          const isOwner = member.role === 'owner'
          const canEditThisMember = canManageMembers && !isSelf && !isOwner

          return (
            <div key={member.id} className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt={memberName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-sm font-bold">
                      {getInitials(memberName)}
                    </div>
                  )}
                  {isPending && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-(--color-bg-secondary) bg-(--color-bg-tertiary) text-[8px] font-bold text-(--color-text-secondary) shadow-sm">
                      ?
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-(--color-text-primary) flex items-center gap-2">
                    {memberName}
                    {isSelf && <span className="text-xs text-(--color-text-tertiary) bg-(--color-bg-tertiary) px-1.5 py-0.5 rounded-sm">You</span>}
                    {isPending && <span className="text-xs text-(--color-warning) bg-(--color-warning-muted) px-1.5 py-0.5 rounded-sm font-semibold">Pending Invite</span>}
                  </p>
                  <p className="text-xs text-(--color-text-secondary) mt-0.5">{member.profile?.email || member.invited_email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {canEditThisMember ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={updateRole.isPending}
                    className="text-xs font-medium bg-(--color-bg-primary) border border-(--color-border-default) text-(--color-text-primary) rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-(--color-accent)"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-(--color-bg-primary) border border-(--color-border-default) ${roleConfig.color}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {roleConfig.label}
                  </span>
                )}

                {canEditThisMember && (
                  <button
                    onClick={() => handleRemove(member.id, memberName)}
                    className="text-(--color-text-tertiary) hover:text-(--color-error) p-1.5 rounded-md hover:bg-(--color-error-muted) transition-colors"
                    title={isPending ? "Revoke Invite" : "Remove Member"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        workspaceId={workspace?.id} 
      />
    </div>
  )
}
