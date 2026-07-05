import { useParams } from 'react-router-dom'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { Crown, ShieldCheck, Shield } from 'lucide-react'

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-(--color-warning)' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-(--color-accent)' },
  member: { label: 'Member', icon: Shield, color: 'text-(--color-text-tertiary)' },
}

export default function MembersPage() {
  const { workspaceSlug } = useParams()
  const { workspace } = useWorkspace(workspaceSlug)
  const { members } = useWorkspaceMembers(workspace?.id)
  const { user } = useAuth()

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-(--color-text-primary) mb-1">Members</h1>
      <p className="text-sm text-(--color-text-secondary) mb-6">
        {members.length} member{members.length !== 1 ? 's' : ''} in {workspace?.name}
      </p>

      <div className="rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) divide-y divide-(--color-border-subtle)">
        {members.map((member) => {
          const roleConfig = ROLE_CONFIG[member.role]
          const RoleIcon = roleConfig.icon
          const memberName = member.profile?.display_name || member.invited_email || 'Unknown'

          return (
            <div key={member.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {member.profile?.avatar_url ? (
                  <img src={member.profile.avatar_url} alt={memberName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-semibold">
                    {getInitials(memberName)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-(--color-text-primary)">
                    {memberName}
                    {member.user_id === user?.id && <span className="text-xs text-(--color-text-tertiary) ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-(--color-text-tertiary)">{member.profile?.email || member.invited_email}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${roleConfig.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {roleConfig.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
