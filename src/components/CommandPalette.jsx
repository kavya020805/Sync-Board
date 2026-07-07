import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import { Hash, Settings, Search, LayoutDashboard, Plus, PanelLeft } from 'lucide-react'

// Simple CSS for cmdk embedded in the component since it requires specific class names
const cmdkStyles = `
  [cmdk-dialog] {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    animation: fadeIn 0.15s ease-out;
  }
  
  [cmdk-root] {
    width: 100%;
    max-width: 600px;
    background: var(--color-bg-primary);
    border-radius: 0.75rem;
    overflow: hidden;
    padding: 0;
    border: 1px solid var(--color-border-default);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: scaleIn 0.15s ease-out;
  }
  
  [cmdk-input] {
    width: 100%;
    font-size: 1rem;
    padding: 1rem;
    border: none;
    border-bottom: 1px solid var(--color-border-subtle);
    background: transparent;
    color: var(--color-text-primary);
    outline: none;
  }
  
  [cmdk-input]::placeholder {
    color: var(--color-text-tertiary);
  }
  
  [cmdk-list] {
    max-height: 400px;
    overflow: auto;
    padding: 0.5rem;
  }
  
  [cmdk-group-heading] {
    padding: 0.5rem 0.5rem 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    color: var(--color-text-tertiary);
  }
  
  [cmdk-item] {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    cursor: pointer;
  }
  
  [cmdk-item][data-selected="true"] {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
  
  [cmdk-empty] {
    padding: 2rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }
`

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  
  const { workspaceSlug, projectKey } = useParams()
  const { workspaces } = useWorkspaces()
  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug)
  const { projects } = useProjects(currentWorkspace?.id)

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <style>{cmdkStyles}</style>
      <Command.Dialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5 text-(--color-text-tertiary) pointer-events-none" />
          <Command.Input placeholder="Type a command or search..." style={{ paddingLeft: '2.75rem' }} />
        </div>

        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          {currentWorkspace && (
            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}`))}>
                <LayoutDashboard className="w-4 h-4" />
                Workspace Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}/analytics`))}>
                <LayoutDashboard className="w-4 h-4" />
                Workspace Analytics
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}/settings`))}>
                <Settings className="w-4 h-4" />
                Workspace Settings
              </Command.Item>
            </Command.Group>
          )}

          {projects && projects.length > 0 && (
            <Command.Group heading="Projects">
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}/p/${project.key.toLowerCase()}`))}
                >
                  <Hash className="w-4 h-4" />
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {projectKey && (
            <Command.Group heading="Current Project Actions">
              <Command.Item onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}/p/${projectKey}/board`))}>
                <PanelLeft className="w-4 h-4" />
                Go to Board
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate(`/w/${workspaceSlug}/p/${projectKey}/backlog`))}>
                <PanelLeft className="w-4 h-4" />
                Go to Backlog
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => {
                // To trigger "new issue", we can just dispatch a custom event or rely on the 'n' shortcut locally.
                // For now, we'll navigate to backlog which has the "Create Issue" visible.
                navigate(`/w/${workspaceSlug}/p/${projectKey}/backlog`)
              })}>
                <Plus className="w-4 h-4" />
                Create Issue
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  )
}
