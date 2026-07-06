import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { usePendingInvites, useRespondToInvite } from '@/hooks/useWorkspaceInvites'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Check, X, Plus, FolderKanban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'

export default function GlobalDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces()
  const { data: pendingInvites, isLoading: invitesLoading } = usePendingInvites()
  
  const respondToInvite = useRespondToInvite()

  const handleInviteResponse = (inviteId, action, workspaceName) => {
    respondToInvite.mutate({ inviteId, action }, {
      onSuccess: () => {
        toast.success(`You have ${action}ed the invitation to ${workspaceName}`)
      },
      onError: (err) => {
        toast.error(err.message)
      }
    })
  }

  const isLoading = workspacesLoading || invitesLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-12 animate-fade-in">
      
      {/* Pending Invites Banner */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="mb-8 space-y-3">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="bg-(--color-accent-muted) border border-(--color-accent) rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-(--color-accent) flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--color-text-primary)">
                    You've been invited to join <span className="text-(--color-accent)">{invite.workspace?.name}</span>
                  </h3>
                  <p className="text-xs text-(--color-text-secondary) mt-0.5">
                    You were invited as a <strong>{invite.role}</strong>. Accept to collaborate with the team.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleInviteResponse(invite.id, 'decline', invite.workspace?.name)}
                  disabled={respondToInvite.isPending}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-(--color-error) bg-(--color-error-muted) hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
                <button
                  onClick={() => handleInviteResponse(invite.id, 'accept', invite.workspace?.name)}
                  disabled={respondToInvite.isPending}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-(--color-accent-text) bg-(--color-accent) hover:bg-(--color-accent-hover) rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            Welcome back
          </h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">
            Select a workspace to view your projects and issues
          </p>
        </div>
        <button 
          onClick={() => navigate(`/create-workspace`)}
          className="h-10 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-(--color-accent-text) text-sm font-medium rounded-md shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      {workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/w/${ws.slug}`}
              className="p-5 rounded-xl border border-(--color-border-default) bg-(--color-bg-secondary) hover:border-(--color-border-strong) hover:bg-(--color-bg-hover) transition-all duration-200 no-underline flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-2xl font-bold shadow-sm">
                {getInitials(ws.name)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-(--color-text-primary)">{ws.name}</h3>
                <p className="text-xs text-(--color-text-tertiary) font-medium mt-1 uppercase tracking-wider">{ws.role}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-(--color-border-strong) rounded-xl bg-(--color-bg-secondary)">
          <FolderKanban className="w-12 h-12 text-(--color-text-tertiary) mb-4" />
          <h3 className="text-lg font-medium text-(--color-text-primary)">No workspaces yet</h3>
          <p className="text-sm text-(--color-text-secondary) mt-1 max-w-sm text-center mb-6">
            You aren't a member of any workspaces. Accept a pending invite above, or create a new workspace to get started.
          </p>
          <button 
            onClick={() => navigate(`/create-workspace`)}
            className="h-10 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-(--color-accent-text) text-sm font-medium rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      )}
    </div>
  )
}
