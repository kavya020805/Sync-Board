import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUpdateIssue } from '@/hooks/useBoard'
import { useMilestones } from '@/hooks/useSprints'
import IssueActivityFeed from './IssueActivityFeed'
import IssueComments from './IssueComments'
import { Activity, MessageSquare, Info, GitPullRequest, Loader2 } from 'lucide-react'
import { usePullRequests } from '@/hooks/usePullRequests'

import { useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useGithubToken, useCreateBranch, useUpdateGithubIssue } from '@/hooks/useGithub'
import { toast } from 'sonner'

export default function EditIssueModal({ issue, onClose }) {
  const { workspaceSlug } = useParams()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  const { members } = useWorkspaceMembers(workspace?.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [milestoneId, setMilestoneId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  const { data: milestones } = useMilestones(issue?.project_id)
  const { data: pullRequests } = usePullRequests(issue?.id)
  const updateIssue = useUpdateIssue()

  // GitHub Hooks
  const { data: githubToken } = useGithubToken()
  const createBranch = useCreateBranch()
  const updateGithubIssue = useUpdateGithubIssue()

  const [project, setProject] = useState(null)
  useEffect(() => {
    const fetchProject = async () => {
      if (!issue?.project_id) return
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('projects').select('*').eq('id', issue.project_id).single()
      setProject(data)
    }
    fetchProject()
  }, [issue?.project_id])

  const isGithubLinked = !!(project?.github_repo_owner && project?.github_repo_name && githubToken)

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '')
      setDescription(issue.description || '')
      setPriority(issue.priority || 'medium')
      setMilestoneId(issue.milestone_id || '')
      setAssigneeId(issue.assignee_id || '')
      setStoryPoints(issue.story_points !== null ? String(issue.story_points) : '')
      setDueDate(issue.due_date ? issue.due_date.split('T')[0] : '')
    }
  }, [issue])

  if (!issue) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    updateIssue.mutate(
      {
        id: issue.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          milestone_id: milestoneId || null,
          assignee_id: assigneeId || null,
          story_points: storyPoints ? parseInt(storyPoints, 10) : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        }
      },
      {
        onSuccess: async () => {
          if (isGithubLinked && issue.github_issue_number) {
            try {
              await updateGithubIssue.mutateAsync({
                owner: project.github_repo_owner,
                repo: project.github_repo_name,
                issueNumber: issue.github_issue_number,
                title: title.trim(),
                body: description.trim() || undefined
              })
            } catch (err) {
              console.error('Failed to update GitHub Issue:', err)
              toast.error('Local changes saved, but failed to sync to GitHub.')
            }
          }
          onClose()
        },
      }
    )
  }

  const handleCreateBranch = async () => {
    if (!isGithubLinked) return
    const branchName = `sb-${issue.id}`
    try {
      await createBranch.mutateAsync({
        owner: project.github_repo_owner,
        repo: project.github_repo_name,
        branchName
      })
      toast.success('Branch created successfully on GitHub!')
    } catch (error) {
      toast.error(error.message || 'Failed to create branch')
    }
  }

  const handleCreatePR = async () => {
    if (!isGithubLinked) return
    const branchName = `sb-${issue.id}`
    try {
      await createPR.mutateAsync({
        owner: project.github_repo_owner,
        repo: project.github_repo_name,
        title: issue.title,
        body: `Resolves #${issue.github_issue_number || issue.id}\n\n${issue.description || ''}`,
        head: branchName
      })
      toast.success('Pull Request created successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to create Pull Request. Make sure you have pushed commits to the branch first.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle) shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-(--color-text-primary)">{issue.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-(--color-text-tertiary) bg-(--color-bg-secondary) px-2 py-0.5 rounded border border-(--color-border-default)">
                sb-{issue.id}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(`sb-${issue.id}`)
                  toast.success('Branch name copied to clipboard!')
                }}
                className="text-[10px] text-(--color-accent) hover:underline cursor-pointer"
              >
                Copy Branch Name
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors cursor-pointer self-start"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-(--color-border-subtle) px-4 shrink-0 mt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-(--color-accent) text-(--color-accent)' : 'border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'}`}
          >
            <Info className="w-4 h-4" /> Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comments' ? 'border-(--color-accent) text-(--color-accent)' : 'border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'}`}
          >
            <MessageSquare className="w-4 h-4" /> Comments
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-(--color-accent) text-(--color-accent)' : 'border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'}`}
          >
            <Activity className="w-4 h-4" /> Activity
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                  Issue Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Update user authentication flow"
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details here..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) resize-none focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                  Milestone (Optional)
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                >
                  <option value="">No Milestone</option>
                  {milestones?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                  Assignee (Optional)
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                >
                  <option value="">Unassigned</option>
                  {members?.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name || m.profile?.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-(--color-border-subtle)">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateIssue.isPending || !title.trim()}
                  className="h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updateIssue.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'details' && pullRequests && pullRequests.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6">
              <h3 className="text-sm font-semibold text-(--color-text-primary) flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-(--color-text-tertiary)" />
                Pull Requests
              </h3>
              <div className="flex flex-col gap-2">
                {pullRequests.map(pr => (
                  <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg border border-(--color-border-default) bg-(--color-bg-secondary)">
                    <div className="flex flex-col gap-1 min-w-0">
                      <a href={pr.pr_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-(--color-accent) hover:underline truncate">
                        {pr.title || `PR #${pr.pr_number}`}
                      </a>
                      <p className="text-xs text-(--color-text-tertiary) truncate">
                        {pr.branch_name} by {pr.author}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        pr.status === 'merged' ? 'bg-[#8250df]/10 text-[#8250df]' :
                        pr.status === 'closed' ? 'bg-red-500/10 text-red-500' :
                        'bg-green-500/10 text-green-600'
                      }`}>
                        {pr.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && isGithubLinked && issue.sprint_id && issue.column_id && (
            <div className="mt-6 flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6">
              <h3 className="text-sm font-semibold text-(--color-text-primary) flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-[#24292e]" />
                GitHub Actions
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCreateBranch}
                  disabled={createBranch.isPending}
                  className="w-full h-9 px-4 rounded-md text-sm font-medium bg-(--color-bg-secondary) border border-(--color-border-default) text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {createBranch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitPullRequest className="w-4 h-4" />}
                  Create Branch
                </button>
              </div>
            </div>
          )}

          {activeTab === 'comments' && <IssueComments issueId={issue.id} members={members} />}
          {activeTab === 'activity' && <IssueActivityFeed issueId={issue.id} members={members} />}
        </div>
      </div>
    </div>
  )
}
