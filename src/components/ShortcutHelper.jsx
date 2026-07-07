import React, { useState, useEffect } from 'react'
import { Command, X } from 'lucide-react'

export default function ShortcutHelper() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // e.key === '?' handles shift on US keyboards
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['N'], description: 'Create new issue (on board/backlog)' },
    { keys: ['?'], description: 'Toggle this shortcut helper' },
    { keys: ['Esc'], description: 'Close modals / command palette' }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-md bg-(--color-bg-primary) rounded-xl border border-(--color-border-default) shadow-xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--color-border-subtle)">
          <h2 className="text-lg font-semibold text-(--color-text-primary) flex items-center gap-2">
            <Command className="w-5 h-5 text-(--color-accent)" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-(--color-text-secondary)">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <kbd className="px-2 py-1 rounded bg-(--color-bg-secondary) border border-(--color-border-subtle) text-xs font-mono text-(--color-text-primary) shadow-sm">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && <span className="text-xs text-(--color-text-tertiary)">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
