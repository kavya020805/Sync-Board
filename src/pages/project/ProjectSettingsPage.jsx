import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject, useUpdateProject } from '@/hooks/useProjects'
import { useAutomations, useCreateAutomation, useDeleteAutomation } from '@/hooks/useAutomations'
import { useColumns } from '@/hooks/useBoard'
import { GitBranch, Loader2, Link as LinkIcon, Unplug, Zap, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProjectSettingsPage() {
  const { workspaceSlug, projectKey } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  
  const { project, isLoading } = useProject(workspace?.id, projectKey)
  const updateProject = useUpdateProject()

  const [isLinking, setIsLinking] = useState(false)
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState('')

  const { data: automations } = useAutomations(project?.id)
  const { data: columns } = useColumns(project?.id)
  const createAutomation = useCreateAutomation()
  const deleteAutomation = useDeleteAutomation()

  const [newTrigger, setNewTrigger] = useState('github_pr_merged')
  const [newActionColumnId, setNewActionColumnId] = useState('')

  const handleCreateAutomation = () => {
    if (!newActionColumnId) return
    createAutomation.mutate({
      projectId: project.id,
      trigger_event: newTrigger,
      action_type: 'move_issue',
      action_payload: { column_id: newActionColumnId }
    }, {
      onSuccess: () => {
        toast.success('Automation rule created!')
        setNewActionColumnId('')
      }
    })
  }

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && project && !isLinking && repos.length === 0) {
      handleOAuthCallback(code)
    }
  }, [searchParams, project])

  const handleOAuthCallback = async (code) => {
    setIsLinking(true)
    try {
      // Call edge function to exchange code for token and fetch repos
      const { data, error } = await supabase.functions.invoke('exchange-github-token', {
        body: { code }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      if (data?.repos) {
        setRepos(data.repos)
        toast.success('Successfully authenticated with GitHub')
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.message || err?.error || 'Failed to authenticate with GitHub')
    } finally {
      setIsLinking(false)
      // Clean up URL
      navigate(`/w/${workspaceSlug}/p/${projectKey}/settings`, { replace: true })
    }
  }

  const handleConnectGithub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) {
      toast.error('GitHub Client ID not found in .env')
      return
    }
    
    // Save the current URL to return to it after authentication
    localStorage.setItem('github_auth_return_url', window.location.pathname)
    
    // Redirect to GitHub OAuth using a static callback URL
    const redirectUri = window.location.origin + '/github/callback'
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`
  }

  const handleSaveRepo = () => {
    if (!selectedRepo) return
    
    const [owner, name] = selectedRepo.split('/')
    
    updateProject.mutate({
      id: project.id,
      workspaceId: workspace.id,
      github_repo_owner: owner,
      github_repo_name: name,
      github_repo_url: `https://github.com/${selectedRepo}`
    }, {
      onSuccess: () => {
        toast.success('GitHub repository linked successfully!')
        setRepos([])
        setSelectedRepo('')
      }
    })
  }

  const handleDisconnectRepo = () => {
    if (!window.confirm('Are you sure you want to disconnect this repository?')) return

    updateProject.mutate({
      id: project.id,
      workspaceId: workspace.id,
      github_repo_owner: null,
      github_repo_name: null,
      github_repo_url: null
    }, {
      onSuccess: () => {
        toast.success('Repository disconnected')
      }
    })
  }

  if (isLoading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--color-bg-primary)">
        <Loader2 className="w-6 h-6 animate-spin text-(--color-text-tertiary)" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-(--color-bg-primary) h-full overflow-y-auto">
      <header className="h-14 shrink-0 border-b border-(--color-border-subtle) flex items-center px-6">
        <h1 className="font-semibold text-(--color-text-primary)">Project Settings</h1>
      </header>

      <div className="p-6 max-w-3xl">
        <div className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#24292e] flex items-center justify-center text-white shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">GitHub Integration</h2>
              <p className="text-sm text-(--color-text-secondary)">Link this project to a GitHub repository to automatically track Pull Requests.</p>
            </div>
          </div>

          <div className="border-t border-(--color-border-subtle) pt-6">
            {project.github_repo_owner && project.github_repo_name ? (
              <div className="flex items-center justify-between bg-(--color-bg-primary) p-4 rounded-lg border border-(--color-border-default)">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-5 h-5 text-(--color-accent)" />
                  <div>
                    <p className="text-sm font-medium text-(--color-text-primary)">
                      {project.github_repo_owner}/{project.github_repo_name}
                    </p>
                    <a href={project.github_repo_url} target="_blank" rel="noreferrer" className="text-xs text-(--color-text-tertiary) hover:underline">
                      {project.github_repo_url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectRepo}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-(--color-error) bg-(--color-error-muted) hover:bg-red-500/20 rounded-md transition-colors cursor-pointer"
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : repos.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                    Select a Repository to Link
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                  >
                    <option value="">-- Choose a repository --</option>
                    {repos.map(repo => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setRepos([])}
                    className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRepo}
                    disabled={!selectedRepo || updateProject.isPending}
                    className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {updateProject.isPending ? 'Saving...' : 'Link Repository'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleConnectGithub}
                  disabled={isLinking}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292e] hover:bg-[#1b1f23] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  Connect GitHub Account
                </button>
                <p className="mt-3 text-xs text-(--color-text-tertiary)">
                  You will be redirected to GitHub to authorize Sync-Board.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Automations Rules Engine */}
        <div className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl overflow-hidden mt-8 animate-scale-in">
          <div className="p-6 border-b border-(--color-border-subtle)">
            <h2 className="text-lg font-semibold text-(--color-text-primary) flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Automations
            </h2>
            <p className="text-sm text-(--color-text-secondary) mt-1">
              Create rules to automatically move issues based on GitHub events.
            </p>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-(--color-bg-primary) p-4 rounded-lg border border-(--color-border-subtle)">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wider mb-2">When</label>
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                >
                  <option value="github_pr_merged">GitHub PR is merged</option>
                  <option value="github_issue_closed">GitHub Issue is closed</option>
                  <option value="github_issue_reopened">GitHub Issue is reopened</option>
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wider mb-2">Then move to</label>
                <select
                  value={newActionColumnId}
                  onChange={(e) => setNewActionColumnId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                >
                  <option value="">-- Select Column --</option>
                  {columns?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateAutomation}
                disabled={!newActionColumnId || createAutomation.isPending}
                className="h-10 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                {createAutomation.isPending ? 'Saving...' : 'Add Rule'}
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <h3 className="text-sm font-semibold text-(--color-text-primary)">Active Rules</h3>
              {automations?.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary) italic">No automation rules created yet.</p>
              ) : (
                automations?.map(rule => {
                  const targetCol = columns?.find(c => c.id === rule.action_payload?.column_id)
                  const triggerText = rule.trigger_event === 'github_pr_merged' ? 'PR merged' : rule.trigger_event === 'github_issue_closed' ? 'Issue closed' : 'Issue reopened'
                  return (
                    <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border border-(--color-border-default) bg-(--color-bg-primary)">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-(--color-text-primary)">When</span>
                        <span className="px-2 py-0.5 bg-(--color-bg-hover) rounded text-(--color-text-secondary)">{triggerText}</span>
                        <span className="font-medium text-(--color-text-primary)">move to</span>
                        <span className="px-2 py-0.5 bg-(--color-bg-hover) rounded text-(--color-text-secondary)">{targetCol?.name || 'Unknown'}</span>
                      </div>
                      <button
                        onClick={() => deleteAutomation.mutate({ id: rule.id, projectId: project.id })}
                        className="p-1.5 text-(--color-text-secondary) hover:text-(--color-error) hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
