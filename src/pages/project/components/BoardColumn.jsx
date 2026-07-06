import React from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Plus, MoreHorizontal } from 'lucide-react'
import IssueCard from './IssueCard'

export default function BoardColumn({ column, issues, onIssueClick, onAddIssue }) {
  return (
    <div className="flex flex-col w-72 shrink-0 bg-(--color-bg-secondary) rounded-lg border border-(--color-border-default) max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-(--color-border-subtle)">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-(--color-text-primary)">
            {column.name}
          </h3>
          <span className="text-xs font-medium text-(--color-text-secondary) bg-(--color-bg-tertiary) px-2 py-0.5 rounded-full">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAddIssue(column.id)}
            className="p-1 text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors"
          >
            <Plus size={16} />
          </button>
          <button className="p-1 text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-(--color-accent-muted) bg-opacity-20' : ''
            }`}
          >
            {issues.map((issue, index) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                index={index}
                onClick={onIssueClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
