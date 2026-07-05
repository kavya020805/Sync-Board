import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

/**
 * AppLayout — the main app shell.
 * Navbar on top, Sidebar on left, content in the center.
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
