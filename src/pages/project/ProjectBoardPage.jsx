import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import { Loader2, Filter, CheckCircle2, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'

import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject } from '@/hooks/useProjects'
import { useColumns, useIssues, useMoveIssue } from '@/hooks/useBoard'
import { useSprints, useCompleteSprint } from '@/hooks/useSprints'
import { useBoardRealtime } from '@/hooks/useBoardRealtime'
import { usePresence } from '@/hooks/usePresence'

import BoardColumn from './components/BoardColumn'
import CreateIssueModal from './components/CreateIssueModal'
import EditIssueModal from './components/EditIssueModal'
import AvatarStack from '@/components/ui/AvatarStack'

export default function ProjectBoardPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  // Modal state
  const [addingIssueToColumn, setAddingIssueToColumn] = useState(null)
  const [editingIssue, setEditingIssue] = useState(null)
  
  // 1. Get workspace ID
  const { workspaces } = useWorkspaces()
  const workspace = workspaces.find((w) => w.slug === workspaceSlug)
  
  // 2. Get project ID
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  
  // 3. Get board data
  const { data: serverColumns, isLoading: columnsLoading } = useColumns(project?.id)
  const { data: serverIssues, isLoading: issuesLoading } = useIssues(project?.id)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(project?.id)
  
  const moveIssue = useMoveIssue()
  const completeSprint = useCompleteSprint()

  // 4. Activate Realtime Sync & Live Presence
  useBoardRealtime(project?.id)
  const activeUsers = usePresence(project?.id)

  // We keep optimistic local state for snappy drag and drop
  const [columns, setColumns] = useState([])
  const [issues, setIssues] = useState([])

  // Sync server data to local state
  useEffect(() => {
    if (serverColumns) setColumns(serverColumns)
  }, [serverColumns])

  useEffect(() => {
    if (serverIssues) setIssues(serverIssues)
  }, [serverIssues])

  const isLoading = projectLoading || columnsLoading || issuesLoading || sprintsLoading

  const activeSprint = useMemo(() => {
    return sprints?.find(s => {
      if (s.status !== 'active') return false;
      if (!s.start_date) return true;
      
      const now = new Date();
      const start = new Date(s.start_date);
      // Reset times to compare just the dates
      now.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      return now >= start;
    })
  }, [sprints])

  const filteredIssues = useMemo(() => {
    if (!activeSprint) return []
    return issues.filter(i => i.sprint_id === activeSprint.id)
  }, [issues, activeSprint])

  const allTasksDone = useMemo(() => {
    if (!activeSprint || filteredIssues.length === 0 || columns.length === 0) return false
    
    // Assuming the last column by position is the "Done" column
    const doneColumn = [...columns].sort((a, b) => b.position - a.position)[0]
    
    // Check if every issue in the active sprint is in the done column
    return filteredIssues.every(issue => issue.column_id === doneColumn.id)
  }, [activeSprint, filteredIssues, columns])

  const handleCompleteSprint = () => {
    if (!activeSprint || !project) return
    
    const doneColumn = columns ? [...columns].sort((a, b) => b.position - a.position)[0] : null
    const sprintIssues = issues.filter(i => i.sprint_id === activeSprint.id)
    const incompleteIssueIds = sprintIssues
      .filter(i => !doneColumn || i.column_id !== doneColumn.id)
      .map(i => i.id)

    completeSprint.mutate({
      sprintId: activeSprint.id,
      projectId: project.id,
      incompleteIssueIds
    }, {
      onSuccess: () => toast.success('Sprint completed successfully!')
    })
  }

  // Helper to calculate new position (fractional indexing)
  const calculateNewPosition = (columnIssues, targetIndex) => {
    const prev = columnIssues[targetIndex - 1]?.position
    const next = columnIssues[targetIndex]?.position

    if (prev !== undefined && next !== undefined) {
      return (prev + next) / 2
    } else if (prev !== undefined) {
      return prev + 1000 // Appended to end
    } else if (next !== undefined) {
      return next / 2 // Prepended to start
    } else {
      return 1000 // First item in column
    }
  }

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result
    
    // Dropped outside a valid droppable
    if (!destination) return
    
    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const sourceColumnId = source.droppableId
    const destColumnId = destination.droppableId

    // Find the issue being dragged
    const draggedIssue = issues.find(i => i.id === draggableId)
    if (!draggedIssue) return

    // Optimistic UI Update
    // ----------------------
    // 1. Remove from source list
    // 2. Add to destination list at index
    
    const newIssues = [...issues]
    
    // Create column-specific arrays to compute the new position
    // Note: When computing position, we must compute it relative to ALL issues in the column,
    // not just the filtered ones, to avoid position collisions.
    const destColumnIssues = newIssues
      .filter(i => i.column_id === destColumnId && i.id !== draggableId)
      .sort((a, b) => a.position - b.position)

    const newPosition = calculateNewPosition(destColumnIssues, destination.index)

    // Update the issue in our optimistic array
    const issueIndex = newIssues.findIndex(i => i.id === draggableId)
    newIssues[issueIndex] = {
      ...draggedIssue,
      column_id: destColumnId,
      position: newPosition
    }

    setIssues(newIssues)

    // Fire mutation
    moveIssue.mutate({
      id: draggableId,
      columnId: destColumnId,
      position: newPosition
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-(--color-text-secondary)">
        Project not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Board Header */}
      <div className="shrink-0 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            {project.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-(--color-text-secondary)">
              {project.key} Board
            </p>
            {activeSprint && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCompleteSprint}
                  disabled={completeSprint.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-(--color-success) text-white hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  Complete Sprint
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Real-time Presence Indicators */}
        <div className="flex flex-col items-end gap-1">
          <AvatarStack users={activeUsers} />
          <span className="text-[10px] text-(--color-text-tertiary) font-medium uppercase tracking-wider">
            Viewing now
          </span>
        </div>
      </div>

      {/* Celebration Banner */}
      {allTasksDone && (
        <div className="mx-1 mb-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">All tasks completed!</h3>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Amazing job! You've finished everything in this sprint.</p>
            </div>
          </div>
          <button
            onClick={handleCompleteSprint}
            disabled={completeSprint.isPending}
            className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {completeSprint.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Complete Sprint Now
          </button>
        </div>
      )}

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {!activeSprint ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 bg-(--color-bg-secondary) rounded-full flex items-center justify-center mb-4 border border-(--color-border-default)">
              <Filter className="w-8 h-8 text-(--color-text-tertiary)" />
            </div>
            <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">No Active Sprint</h3>
            <p className="text-sm text-(--color-text-secondary) mb-6">
              You don't have an active sprint running. 
              Go to your Backlog to plan and start a sprint!
            </p>
            <div className="flex items-center gap-3">
              {columns.length > 0 && (
                <button
                  onClick={() => {
                    const firstColumn = [...columns].sort((a, b) => a.position - b.position)[0]
                    setAddingIssueToColumn(firstColumn.id)
                  }}
                  className="px-4 py-2 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white text-sm font-medium rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  Create Issue
                </button>
              )}
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full items-start px-1">
              {columns.map(column => {
                // Get issues for this column and sort them by position
                const columnIssues = filteredIssues
                  .filter(issue => issue.column_id === column.id)
                  .sort((a, b) => a.position - b.position)
                  
                return (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    issues={columnIssues}
                    onIssueClick={(issue) => setEditingIssue(issue)}
                    onAddIssue={(colId) => setAddingIssueToColumn(colId)}
                  />
                )
              })}
              
              {/* Add Column Button */}
              <button className="shrink-0 w-72 h-12 flex items-center gap-2 px-4 rounded-lg border border-dashed border-(--color-border-default) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:border-(--color-border-strong) hover:bg-(--color-bg-secondary) transition-all cursor-pointer">
                <span className="text-sm font-medium">+ Add Section</span>
              </button>
            </div>
          </DragDropContext>
        )}
      </div>

      {addingIssueToColumn && (
        <CreateIssueModal
          projectId={project.id}
          columnId={addingIssueToColumn}
          onClose={() => setAddingIssueToColumn(null)}
        />
      )}

      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
        />
      )}
    </div>
  )
}
