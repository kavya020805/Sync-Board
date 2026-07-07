import React, { useState, useRef, useEffect } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { MoreHorizontal, Edit2, Trash2, GitPullRequest } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteIssue } from '@/hooks/useBoard'
import { useCloseGithubIssue, useGithubToken } from '@/hooks/useGithub'
import EditIssueModal from './EditIssueModal'
import { useSearchParams } from 'react-router-dom'

const priorityColors = {
  low: 'bg-(--color-success-muted) text-(--color-success)',
  medium: 'bg-(--color-info-muted) text-(--color-info)',
  high: 'bg-(--color-error-muted) text-(--color-error)',
}

export default function BacklogIssueRow({ issue, index, project }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  
  const menuRef = useRef(null)
  const deleteIssue = useDeleteIssue()
  
  const { data: githubToken } = useGithubToken()
  const closeGithubIssue = useCloseGithubIssue()
  const isGithubLinked = !!(project?.github_repo_owner && project?.github_repo_name && githubToken)

  useEffect(() => {
    if (searchParams.get('issueId') === issue.id && !isEditModalOpen) {
      setIsEditModalOpen(true)
      searchParams.delete('issueId')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, issue.id, isEditModalOpen, setSearchParams])

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleDelete = async () => {
    setIsMenuOpen(false)
    if (window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) {
      if (isGithubLinked && issue.github_issue_number) {
        try {
          await closeGithubIssue.mutateAsync({
            owner: project.github_repo_owner,
            repo: project.github_repo_name,
            issueNumber: issue.github_issue_number
          })
          toast.success('Closed issue on GitHub')
        } catch (err) {
          console.error('Failed to close issue on GitHub:', err)
          toast.error('Failed to close issue on GitHub')
        }
      }

      deleteIssue.mutate(
        { id: issue.id, projectId: issue.project_id },
        {
          onSuccess: () => toast.success('Issue deleted successfully'),
          onError: (err) => toast.error(err.message || 'Failed to delete issue')
        }
      )
    }
  }

  return (
    <>
      <Draggable draggableId={issue.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setIsEditModalOpen(true)}
            className={`
              flex items-center justify-between p-3 border-b border-(--color-border-subtle) bg-(--color-bg-primary)
              transition-all duration-200 cursor-pointer relative group
              ${snapshot.isDragging ? 'shadow-lg border-(--color-accent) scale-[1.02] z-40 rounded-md' : 'hover:bg-(--color-bg-hover)'}
              last:border-b-0
            `}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityColors[issue.priority]}`}
              >
                {issue.priority}
              </span>
              <span className="text-sm font-medium text-(--color-text-primary) truncate">
                {issue.title}
              </span>
              {issue.github_issue_number && (
                <a 
                  href={issue.github_issue_url} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#24292e]/10 border border-[#24292e]/20 text-[10px] font-medium text-[#24292e] hover:bg-[#24292e]/20 transition-colors"
                  title="View on GitHub"
                >
                  <GitPullRequest className="w-3 h-3" />
                  #{issue.github_issue_number}
                </a>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0 pl-4 relative">
              {issue.assignee && (
                <div
                  className="w-6 h-6 rounded-full bg-(--color-accent-muted) flex items-center justify-center text-[10px] font-bold text-(--color-accent) overflow-hidden border border-(--color-border-default)"
                  title={issue.assignee.display_name}
                >
                  {issue.assignee.avatar_url ? (
                    <img src={issue.assignee.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    issue.assignee.display_name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
              )}
              
              <div ref={menuRef} className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(!isMenuOpen)
                  }}
                  className={`text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors p-1 rounded-md hover:bg-(--color-bg-secondary) ${isMenuOpen ? 'bg-(--color-bg-secondary) text-(--color-text-primary)' : ''}`}
                >
                  <MoreHorizontal size={16} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-8 w-40 bg-(--color-bg-elevated) border border-(--color-border-default) rounded-md shadow-lg py-1 z-50 animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        setIsEditModalOpen(true)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-(--color-text-primary) hover:bg-(--color-bg-hover) flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Edit2 size={14} className="text-(--color-text-secondary)" />
                      Edit Issue
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-(--color-error-muted) flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete Issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {isEditModalOpen && (
        <EditIssueModal 
          issue={issue} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </>
  )
}
