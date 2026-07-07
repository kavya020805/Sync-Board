import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { Loader2, Plus, Edit2, Play, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject } from '@/hooks/useProjects'
import { useIssues, useAssignIssueToSprint, useColumns } from '@/hooks/useBoard'
import { useSprints, useCreateSprint, useUpdateSprint, useCompleteSprint } from '@/hooks/useSprints'

import BacklogIssueRow from './components/BacklogIssueRow'
import EditSprintModal from './components/EditSprintModal'
import CreateIssueModal from './components/CreateIssueModal'

export default function BacklogPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  const { workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w) => w.slug === workspaceSlug)
  
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  
  const { data: serverIssues, isLoading: issuesLoading } = useIssues(project?.id)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(project?.id)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setIsCreateModalOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  const { data: columns, isLoading: columnsLoading } = useColumns(project?.id)
  
  const assignToSprint = useAssignIssueToSprint()
  const createSprint = useCreateSprint()
  const updateSprint = useUpdateSprint()
  const completeSprint = useCompleteSprint()

  const [issues, setIssues] = useState([])
  const [editingSprint, setEditingSprint] = useState(null)
  const [addingIssue, setAddingIssue] = useState(false)

  useEffect(() => {
    if (serverIssues) setIssues(serverIssues)
  }, [serverIssues])

  const isLoading = projectLoading || issuesLoading || sprintsLoading || columnsLoading

  const hasActiveSprint = sprints?.some(s => s.status === 'active')

  // Helper to calculate new position
  const calculateNewPosition = (listIssues, targetIndex) => {
    const prev = listIssues[targetIndex - 1]?.position
    const next = listIssues[targetIndex]?.position

    if (prev !== undefined && next !== undefined) {
      return (prev + next) / 2
    } else if (prev !== undefined) {
      return prev + 1000
    } else if (next !== undefined) {
      return next / 2
    } else {
      return 1000
    }
  }

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result
    
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const sourceSprintId = source.droppableId === 'backlog' ? null : source.droppableId
    const destSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId

    // Prevent dragging into completed sprint
    if (destSprintId) {
      const destSprint = sprints?.find(s => s.id === destSprintId)
      if (destSprint?.status === 'completed') {
        toast.error('Cannot add issues to a completed sprint.')
        return
      }
    }

    // Prevent dragging out of completed sprint
    if (sourceSprintId) {
      const sourceSprint = sprints?.find(s => s.id === sourceSprintId)
      if (sourceSprint?.status === 'completed') {
        toast.error('Cannot move issues out of a completed sprint. It is locked as history.')
        return
      }
    }

    const draggedIssue = issues.find(i => i.id === draggableId)
    if (!draggedIssue) return
    
    const newIssues = [...issues]
    
    const destSprintIssues = newIssues
      .filter(i => i.sprint_id === destSprintId && i.id !== draggableId)
      .sort((a, b) => a.position - b.position)

    const newPosition = calculateNewPosition(destSprintIssues, destination.index)

    const issueIndex = newIssues.findIndex(i => i.id === draggableId)
    newIssues[issueIndex] = {
      ...draggedIssue,
      sprint_id: destSprintId,
      position: newPosition
    }

    setIssues(newIssues)

    assignToSprint.mutate({
      id: draggableId,
      sprintId: destSprintId,
      position: newPosition
    })
  }

  const handleCreateSprint = () => {
    if (!project) return
    const sprintCount = (sprints?.length || 0) + 1
    createSprint.mutate({
      project_id: project.id,
      name: `Sprint ${sprintCount}`,
      status: 'planned'
    })
  }

  const handleUpdateSprintStatus = (sprint, newStatus) => {
    if (newStatus === 'active') {
      if (hasActiveSprint) {
        toast.error('Another sprint is already active. Please complete it first.')
        return
      }

      const sprintIssues = issues.filter(i => i.sprint_id === sprint.id)
      if (sprintIssues.length === 0) {
        toast.error('Cannot start an empty sprint. Please drag some issues into it first.')
        return
      }
      
      if (!sprint.start_date || !sprint.end_date) {
        // Must set dates first
        setEditingSprint({ ...sprint, intent: 'start' })
        return
      }
      
      updateSprint.mutate({
        id: sprint.id,
        updates: { status: newStatus }
      })
      return
    }

    if (newStatus === 'completed') {
      // Find the Done column (assuming it's the one with highest position)
      const doneColumn = columns ? [...columns].sort((a, b) => b.position - a.position)[0] : null
      
      // Identify incomplete issues in this sprint
      const sprintIssues = issues.filter(i => i.sprint_id === sprint.id)
      const incompleteIssueIds = sprintIssues
        .filter(i => !doneColumn || i.column_id !== doneColumn.id)
        .map(i => i.id)

      completeSprint.mutate({
        sprintId: sprint.id,
        projectId: project.id,
        incompleteIssueIds
      }, {
        onSuccess: () => toast.success('Sprint completed. Incomplete issues were rolled back to the backlog.')
      })
      return
    }

    // Fallback for other statuses
    updateSprint.mutate({
      id: sprint.id,
      updates: { status: newStatus }
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  if (!project) return null

  const doneColumn = columns?.length > 0 ? [...columns].sort((a, b) => b.position - a.position)[0] : null

  const backlogIssues = issues
    .filter(i => i.sprint_id === null && (!doneColumn || i.column_id !== doneColumn.id))
    .sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Backlog</h1>
          <p className="text-sm text-(--color-text-secondary) mt-1">{project.key} Project</p>
        </div>
        <div className="flex items-center gap-3">
          {columns && columns.length > 0 && (
            <button
              onClick={() => setAddingIssue(true)}
              className="h-10 px-4 flex items-center gap-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Issue
            </button>
          )}
          <button 
            onClick={handleCreateSprint}
            disabled={createSprint.isPending}
            className="h-10 px-4 flex items-center gap-2 bg-(--color-bg-secondary) border border-(--color-border-default) rounded-md text-sm font-medium text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
          >
            {createSprint.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Sprint
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Sprints List */}
        <div className="flex flex-col gap-6 mb-8">
          {sprints?.map(sprint => {
            const sprintIssues = issues
              .filter(i => i.sprint_id === sprint.id)
              .sort((a, b) => a.position - b.position)

            return (
              <div key={sprint.id} className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl shadow-sm">
                <div className="p-4 border-b border-(--color-border-subtle) bg-(--color-bg-elevated) rounded-t-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-(--color-text-primary)">{sprint.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      sprint.status === 'active' ? 'bg-(--color-success-muted) text-(--color-success)' : 
                      sprint.status === 'completed' ? 'bg-(--color-info-muted) text-(--color-info)' :
                      'bg-(--color-bg-tertiary) text-(--color-text-secondary)'
                    }`}>
                      {sprint.status}
                    </span>
                    {(sprint.start_date || sprint.end_date) && (
                      <span className="text-xs text-(--color-text-tertiary) ml-2 hidden sm:inline-block">
                        {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : '?'} - {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-(--color-text-secondary) mr-2">{sprintIssues.length} issues</span>
                    
                    {sprint.status === 'planned' && (
                      <button 
                        onClick={() => handleUpdateSprintStatus(sprint, 'active')}
                        className="flex items-center gap-1 text-xs font-medium text-(--color-bg-primary) bg-(--color-accent) hover:bg-(--color-accent-hover) px-2 py-1.5 rounded transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setEditingSprint(sprint)}
                      className="p-1.5 text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-primary) rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <Droppable droppableId={sprint.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[80px] rounded-b-xl transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-(--color-accent-muted)/10' : ''
                      }`}
                    >
                      {sprintIssues.length > 0 ? (
                        sprintIssues.map((issue, index) => (
                          <BacklogIssueRow key={issue.id} issue={issue} index={index} project={project} />
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-20 text-sm text-(--color-text-tertiary) border-2 border-dashed border-(--color-border-subtle) m-2 rounded-lg">
                          Plan your sprint by dragging issues here
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>

        {/* Backlog Section */}
        <div className="bg-(--color-bg-secondary) border border-(--color-border-default) rounded-xl shadow-sm mt-4">
          <div className="p-4 border-b border-(--color-border-subtle) bg-(--color-bg-elevated) rounded-t-xl flex justify-between items-center">
            <h3 className="text-base font-semibold text-(--color-text-primary)">Backlog</h3>
            <span className="text-sm font-medium text-(--color-text-secondary)">{backlogIssues.length} issues</span>
          </div>
          
          <Droppable droppableId="backlog">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[150px] rounded-b-xl transition-colors duration-200 ${
                  snapshot.isDraggingOver ? 'bg-(--color-accent-muted)/10' : ''
                }`}
              >
                {backlogIssues.length > 0 ? (
                  backlogIssues.map((issue, index) => (
                    <BacklogIssueRow key={issue.id} issue={issue} index={index} project={project} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-sm text-(--color-text-tertiary) border-2 border-dashed border-(--color-border-subtle) m-2 rounded-lg">
                    Your backlog is empty. Create some issues to get started!
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <EditSprintModal 
        isOpen={!!editingSprint}
        onClose={() => setEditingSprint(null)}
        sprint={editingSprint}
        onSave={(updatedSprint) => {
          // If they were trying to start a sprint but dates were missing, start it now
          if (editingSprint?.intent === 'start') {
            updateSprint.mutate({
              id: updatedSprint.id,
              updates: { status: 'active' }
            })
          }
        }}
      />
      
      {addingIssue && columns && columns.length > 0 && (
        <CreateIssueModal
          projectId={project.id}
          columnId={[...columns].sort((a, b) => a.position - b.position)[0].id}
          onClose={() => setAddingIssue(false)}
        />
      )}
    </div>
  )
}
