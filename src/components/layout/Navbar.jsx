import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/stores/themeStore'
import { getInitials } from '@/lib/utils'
import { Sun, Moon, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import NotificationsDropdown from './NotificationsDropdown'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error('Failed to sign out')
    } else {
      navigate('/login')
    }
  }

  return (
    <header className="h-14 border-b border-(--color-border-subtle) bg-(--color-bg-secondary) flex items-center justify-between px-4 shrink-0">
      {/* Left: App name / breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            S
          </div>
          <span className="text-sm font-semibold text-(--color-text-primary) hidden sm:block">
            Sync Board
          </span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-md flex items-center justify-center text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-all duration-200 cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* User menu */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-(--color-bg-hover) transition-all duration-200 cursor-pointer"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'Avatar'}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-xs font-semibold">
                {getInitials(profile?.display_name || profile?.email)}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-(--color-text-tertiary)" />
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-md border border-(--color-border-default) bg-(--color-bg-elevated) shadow-lg py-1.5 z-50 animate-scale-in">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-(--color-border-subtle)">
                <p className="text-sm font-medium text-(--color-text-primary) truncate">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-(--color-text-tertiary) truncate mt-0.5">
                  {profile?.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover) transition-colors no-underline"
                >
                  <User className="w-4 h-4" />
                  Profile settings
                </Link>
              </div>

              <div className="border-t border-(--color-border-subtle) pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-(--color-error) hover:bg-(--color-error-muted) transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
