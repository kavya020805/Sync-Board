import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

/**
 * AppLayout — the main app shell.
 * Navbar on top, Sidebar on left, content in the center.
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const isBoardRoute = pathname.includes('/p/')

  return (
    <div className="h-screen flex flex-col bg-(--color-bg-primary)">
      {/* Top navbar */}
      <div className="flex items-center">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-14 h-14 flex items-center justify-center text-(--color-text-secondary) hover:text-(--color-text-primary) lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <Navbar />
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className={`w-full mx-auto p-6 lg:p-8 flex-1 flex flex-col ${isBoardRoute ? 'max-w-none' : 'max-w-6xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
