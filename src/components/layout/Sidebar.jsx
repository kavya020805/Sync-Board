import { NavLink, useParams } from 'react-router-dom'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Plus,
  ChevronDown,
  ChevronsUpDown,
  Hash,
  Menu,
  X,
  Activity,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Sidebar({ isOpen, onClose }) {
  const { workspaceSlug } = useParams()
  const { workspaces } = useWorkspaces()
  const currentWorkspace = workspaces?.find((w) => w.slug === workspaceSlug)
  const { projects } = useProjects(currentWorkspace?.id)
  const navigate = useNavigate()

  const [workspaceSelectorOpen, setWorkspaceSelectorOpen] = useState(false)
  const selectorRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setWorkspaceSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm no-underline transition-all duration-150 ${
      isActive
        ? 'bg-(--color-accent-muted) text-(--color-accent-text) font-medium'
        : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-(--color-bg-secondary) border-r border-(--color-border-subtle) flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-(--color-text-secondary) hover:bg-(--color-bg-hover) cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-3 pt-3 pb-2" ref={selectorRef}>
          <button
            onClick={() => setWorkspaceSelectorOpen(!workspaceSelectorOpen)}
            className="tour-workspace-switcher flex items-center justify-between w-full px-2.5 py-2 rounded-md hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-bold shrink-0">
                {currentWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <span className="text-sm font-medium text-(--color-text-primary) truncate">
                {currentWorkspace?.name || 'Select workspace'}
              </span>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-(--color-text-tertiary) shrink-0" />
          </button>

          {/* Workspace dropdown */}
          {workspaceSelectorOpen && (
            <div className="mt-1 rounded-md border border-(--color-border-default) bg-(--color-bg-elevated) shadow-lg py-1 animate-scale-in">
              {workspaces?.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    navigate(`/w/${ws.slug}`)
                    setWorkspaceSelectorOpen(false)
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors cursor-pointer ${
                    ws.slug === workspaceSlug
                      ? 'bg-(--color-accent-muted) text-(--color-accent-text)'
                      : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-bold">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}

              <div className="border-t border-(--color-border-subtle) mt-1 pt-1">
                <button
                  onClick={() => {
                    navigate('/create-workspace')
                    setWorkspaceSelectorOpen(false)
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentWorkspace && (
          <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
            <NavLink to={`/w/${workspaceSlug}`} end className={({ isActive }) => `tour-dashboard-nav ${navLinkClass({ isActive })}`}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/analytics`} className={({ isActive }) => `tour-analytics-nav ${navLinkClass({ isActive })}`}>
              <Activity className="w-4 h-4" />
              Analytics
            </NavLink>

            {/* Projects section */}
            <div className="mt-4 mb-1">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wider">
                  Projects
                </span>
                <button
                  onClick={() => navigate(`/w/${workspaceSlug}/new-project`)}
                  className="tour-create-project w-5 h-5 rounded flex items-center justify-center text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                  title="Create project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {projects?.length > 0 ? (
              projects.map((project) => {
                const projectBasePath = `/w/${workspaceSlug}/p/${project.key.toLowerCase()}`
                const isProjectActive = window.location.pathname.startsWith(projectBasePath)
                
                return (
                  <div key={project.id} className="flex flex-col gap-0.5">
                    <NavLink
                      to={projectBasePath}
                      end
                      className={navLinkClass}
                    >
                      <Hash className="w-4 h-4" />
                      <span className="truncate">{project.name}</span>
                    </NavLink>
                    
                    {isProjectActive && (
                      <div className="flex flex-col gap-0.5 ml-6 mt-1 border-l border-(--color-border-subtle) pl-2">
                        <NavLink
                          to={`${projectBasePath}/board`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Board
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/backlog`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Backlog
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/milestones`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Milestones
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/epics`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Epics
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/timeline`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Timeline
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/charts`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          Reports
                        </NavLink>
                        <NavLink
                          to={`${projectBasePath}/settings`}
                          className={({ isActive }) => `text-xs py-1.5 px-2 rounded-md transition-colors flex items-center gap-1.5 ${isActive ? 'text-(--color-text-primary) font-medium bg-(--color-bg-hover)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'}`}
                        >
                          <Settings className="w-3.5 h-3.5" /> Settings
                        </NavLink>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="px-3 py-4 text-xs text-(--color-text-tertiary) text-center">
                No projects yet
              </p>
            )}

            {/* Bottom nav */}
            <div className="mt-auto pt-4 border-t border-(--color-border-subtle)">
              <NavLink to={`/w/${workspaceSlug}/members`} className={navLinkClass}>
                <Users className="w-4 h-4" />
                Members
              </NavLink>
              <NavLink to={`/w/${workspaceSlug}/settings`} className={navLinkClass}>
                <Settings className="w-4 h-4" />
                Settings
              </NavLink>
            </div>
          </nav>
        )}

        {!currentWorkspace && (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-sm text-(--color-text-tertiary) text-center">
              Select or create a workspace to get started
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
