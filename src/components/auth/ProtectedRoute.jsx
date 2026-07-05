import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Shows a loading spinner while auth state is being determined.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
          <p className="text-sm text-(--color-text-secondary)">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
