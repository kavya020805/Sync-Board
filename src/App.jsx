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
import BacklogPage from '@/pages/project/BacklogPage'
import SprintDetailsPage from '@/pages/project/SprintDetailsPage'
import ProjectMilestonesPage from '@/pages/project/ProjectMilestonesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

import GlobalDashboardPage from '@/pages/dashboard/GlobalDashboardPage'

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
              <Route path="/" element={<GlobalDashboardPage />} />
              <Route path="/w/:workspaceSlug" element={<DashboardPage />} />
              <Route path="/w/:workspaceSlug/projects" element={<ProjectListPage />} />
              <Route path="/w/:workspaceSlug/new-project" element={<ProjectListPage />} />
              <Route path="/w/:workspaceSlug/members" element={<MembersPage />} />
              <Route path="/w/:workspaceSlug/settings" element={<WorkspaceSettingsPage />} />
              <Route path="/w/:workspaceSlug/p/:projectKey" element={<ProjectBoardPage />} />
              <Route path="/w/:workspaceSlug/p/:projectKey/backlog" element={<BacklogPage />} />
              <Route path="/w/:workspaceSlug/p/:projectKey/milestones" element={<ProjectMilestonesPage />} />
              <Route path="/w/:workspaceSlug/p/:projectKey/charts" element={<SprintDetailsPage />} />
              <Route path="/settings/profile" element={<ProfilePage />} />
            </Route>

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
