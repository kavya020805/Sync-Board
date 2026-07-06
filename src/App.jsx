import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { Loader2 } from 'lucide-react'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import AuthCallbackPage from '@/pages/auth/AuthCallbackPage'

// Protected pages
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CreateWorkspacePage from '@/pages/workspace/CreateWorkspacePage'
import WorkspaceSettingsPage from '@/pages/workspace/WorkspaceSettingsPage'
import MembersPage from '@/pages/workspace/MembersPage'
import ProjectListPage from '@/pages/project/ProjectListPage'
import ProfilePage from '@/pages/settings/ProfilePage'

import ProjectBoardPage from '@/pages/project/ProjectBoardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * HomeRedirect — redirects authenticated users to their first workspace
 * or to the create workspace page if they have none.
 */
function HomeRedirect() {
  const { user, loading } = useAuth()
  const { workspaces, isLoading } = useWorkspaces()

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (workspaces.length > 0) {
    return <Navigate to={`/w/${workspaces[0].slug}`} replace />
  }

  return <Navigate to="/create-workspace" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Create workspace (no sidebar) */}
            <Route
              path="/create-workspace"
              element={
                <ProtectedRoute>
                  <CreateWorkspacePage />
                </ProtectedRoute>
              }
            />

            {/* App routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/w/:workspaceSlug" element={<DashboardPage />} />
              <Route path="/w/:workspaceSlug/projects" element={<ProjectListPage />} />
              <Route path="/w/:workspaceSlug/new-project" element={<ProjectListPage />} />
              <Route path="/w/:workspaceSlug/members" element={<MembersPage />} />
              <Route path="/w/:workspaceSlug/settings" element={<WorkspaceSettingsPage />} />
              <Route path="/w/:workspaceSlug/p/:projectKey" element={<ProjectBoardPage />} />
              <Route path="/settings/profile" element={<ProfilePage />} />
            </Route>

            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
