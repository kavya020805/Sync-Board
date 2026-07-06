import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { MoreHorizontal } from 'lucide-react'

const priorityColors = {
  low: 'bg-(--color-success-muted) text-(--color-success)',
  medium: 'bg-(--color-info-muted) text-(--color-info)',
  high: 'bg-(--color-error-muted) text-(--color-error)',
}

export default function IssueCard({ issue, index, onClick }) {
  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(issue)}
          className={`
            p-3 mb-2 rounded-md border bg-(--color-bg-primary) shadow-sm cursor-pointer
            transition-all duration-200 
            ${snapshot.isDragging ? 'border-(--color-accent) shadow-lg scale-105 rotate-1 z-50' : 'border-(--color-border-default) hover:border-(--color-border-strong) hover:shadow-md'}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-(--color-text-primary) line-clamp-2">
              {issue.title}
            </h4>
            <button className="text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors p-0.5 rounded-sm hover:bg-(--color-bg-hover)">
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityColors[issue.priority]}`}
            >
              {issue.priority}
            </span>

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
          </div>
        </div>
      )}
    </Draggable>
  )
}
