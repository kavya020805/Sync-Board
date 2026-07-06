import React from 'react'

export default function AvatarStack({ users, max = 4 }) {
  if (!users || users.length === 0) return null

  const displayUsers = users.slice(0, max)
  const extraCount = users.length - max

  return (
    <div className="flex items-center">
      {displayUsers.map((user, i) => (
        <div
          key={user.id}
          className="relative w-8 h-8 rounded-full border-2 border-(--color-bg-primary) bg-(--color-bg-secondary) flex items-center justify-center text-xs font-medium text-(--color-text-primary) shadow-sm hover:z-10 transition-transform hover:scale-110 -ml-2 first:ml-0"
          style={{ zIndex: displayUsers.length - i }}
          title={user.display_name}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{user.display_name?.charAt(0).toUpperCase() || '?'}</span>
          )}
          {/* Online dot indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-(--color-bg-primary) bg-(--color-success)"></span>
        </div>
      ))}
      
      {extraCount > 0 && (
        <div 
          className="relative w-8 h-8 rounded-full border-2 border-(--color-bg-primary) bg-(--color-bg-tertiary) flex items-center justify-center text-[10px] font-medium text-(--color-text-secondary) shadow-sm -ml-2 z-0"
        >
          +{extraCount}
        </div>
      )}
    </div>
  )
}
