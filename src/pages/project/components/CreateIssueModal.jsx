import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateIssue, useIssues } from '@/hooks/useBoard'
import { useMilestones } from '@/hooks/useSprints'
import { useEpics } from '@/hooks/useEpics'
import { useGithubToken, useCreateGithubIssue } from '@/hooks/useGithub'
import { GitPullRequest, Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'

export default function CreateIssueModal({ projectId, columnId, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [milestoneId, setMilestoneId] = useState('')
  const [epicId, setEpicId] = useState('')
  const [parentId, setParentId] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')

  const { workspaceSlug, projectKey } = useParams()
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find(w => w.slug === workspaceSlug)
  
  // Use useProject from hooks/useProjects.js, but since it's missing here, we'll fetch project directly or pass it down
  // Wait, I can just use the supabase client to fetch it quickly or I can use the useProject hook
  const { data: milestones } = useMilestones(projectId)
  const { data: epics } = useEpics(projectId)
  const { data: allIssues } = useIssues(projectId)
  const createIssue = useCreateIssue()
  
  // Need to import useProject from correct path
  const [syncToGithub, setSyncToGithub] = useState(true)
  const { data: githubToken } = useGithubToken()
  const createGithubIssue = useCreateGithubIssue()
  
  // Fetch project details to check for linked repo
  const [project, setProject] = useState(null)
  React.useEffect(() => {
    const fetchProject = async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
      setProject(data)
    }
    fetchProject()
  }, [projectId])

  const isGithubLinked = !!(project?.github_repo_owner && project?.github_repo_name && githubToken)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    let githubIssueNumber = null
    let githubIssueUrl = null
    
    // Create in GitHub first if requested
    if (isGithubLinked && syncToGithub) {
      try {
        const ghIssue = await createGithubIssue.mutateAsync({
          owner: project.github_repo_owner,
          repo: project.github_repo_name,
          title: title.trim(),
          body: description.trim() || undefined
        })
        githubIssueNumber = ghIssue.number
        githubIssueUrl = ghIssue.html_url
      } catch (error) {
        console.error('Failed to create GitHub issue:', error)
        // We'll continue and just create the Supabase issue
      }
    }

    createIssue.mutate(
      {
        project_id: projectId,
        column_id: columnId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        milestone_id: milestoneId || null,
        epic_id: epicId || null,
        parent_id: parentId || null,
        story_points: storyPoints ? parseInt(storyPoints, 10) : null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        github_issue_number: githubIssueNumber,
        github_issue_url: githubIssueUrl
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Add New Issue</h2>
          <button
            onClick={onClose}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
              Issue Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Update user authentication flow"
              autoFocus
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
              rows={3}
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

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Epic (Optional)
              </label>
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              >
                <option value="">No Epic</option>
                {epics?.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Parent Issue (Optional)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              >
                <option value="">No Parent</option>
                {allIssues?.filter(i => !i.parent_id).map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
                Story Pts
              </label>
              <input
                type="number"
                min="0"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="E.g. 5"
                className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              />
            </div>
          </div>

          {isGithubLinked && (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-md bg-[#24292e]/5 border border-[#24292e]/10">
              <input
                type="checkbox"
                id="sync-github"
                checked={syncToGithub}
                onChange={(e) => setSyncToGithub(e.target.checked)}
                className="w-4 h-4 rounded border-(--color-border-default) text-[#24292e] focus:ring-[#24292e]"
              />
              <label htmlFor="sync-github" className="flex items-center gap-2 text-sm text-(--color-text-primary) cursor-pointer select-none">
                <GitPullRequest className="w-4 h-4 text-[#24292e]" />
                Also create this issue in <strong>{project.github_repo_owner}/{project.github_repo_name}</strong>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIssue.isPending || createGithubIssue.isPending || !title.trim()}
              className="flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 cursor-pointer"
            >
              {(createIssue.isPending || createGithubIssue.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {(createIssue.isPending || createGithubIssue.isPending) ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
