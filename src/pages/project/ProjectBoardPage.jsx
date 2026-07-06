import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import { Loader2 } from 'lucide-react'

import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProject } from '@/hooks/useProjects'
import { useColumns, useIssues, useMoveIssue } from '@/hooks/useBoard'

import BoardColumn from './components/BoardColumn'
import CreateIssueModal from './components/CreateIssueModal'

export default function ProjectBoardPage() {
  const { workspaceSlug, projectKey } = useParams()
  
  // Modal state
  const [addingIssueToColumn, setAddingIssueToColumn] = useState(null)
  
  // 1. Get workspace ID
  const { workspaces } = useWorkspaces()
  const workspace = workspaces.find((w) => w.slug === workspaceSlug)
  
  // 2. Get project ID
  const { project, isLoading: projectLoading } = useProject(workspace?.id, projectKey)
  
  // 3. Get board data
  const { data: serverColumns, isLoading: columnsLoading } = useColumns(project?.id)
  const { data: serverIssues, isLoading: issuesLoading } = useIssues(project?.id)
  
  const moveIssue = useMoveIssue()

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

  const isLoading = projectLoading || columnsLoading || issuesLoading

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
      <div className="shrink-0 mb-6">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          {project.name}
        </h1>
        <p className="text-sm text-(--color-text-secondary) mt-1">
          {project.key} Board
        </p>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start px-1">
            {columns.map(column => {
              // Get issues for this column and sort them by position
              const columnIssues = issues
                .filter(issue => issue.column_id === column.id)
                .sort((a, b) => a.position - b.position)
                
              return (
                <BoardColumn
                  key={column.id}
                  column={column}
                  issues={columnIssues}
                  onIssueClick={(issue) => console.log('clicked', issue)}
                  onAddIssue={(colId) => setAddingIssueToColumn(colId)}
                />
              )
            })}
            
            {/* Add Column Button */}
            <button className="shrink-0 w-72 h-12 flex items-center gap-2 px-4 rounded-lg border border-dashed border-(--color-border-default) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:border-(--color-border-strong) hover:bg-(--color-bg-secondary) transition-all">
              <span className="text-sm font-medium">+ Add Section</span>
            </button>
          </div>
        </DragDropContext>
      </div>

      {addingIssueToColumn && (
        <CreateIssueModal
          projectId={project.id}
          columnId={addingIssueToColumn}
          onClose={() => setAddingIssueToColumn(null)}
        />
      )}
    </div>
  )
}
