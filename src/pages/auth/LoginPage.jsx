import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { signIn, signInWithOAuth } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to sign in')
    } else {
      toast.success('Welcome back!')
      navigate('/')
    }
  }

  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    const { error } = await signInWithOAuth(provider)
    if (error) {
      toast.error(error.message || `Failed to sign in with ${provider}`)
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex bg-(--color-bg-primary)">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
        />
        <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
        />

        <div className="relative z-10 max-w-md px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-md flex items-center justify-center font-bold text-xl text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              S
            </div>
            <span className="text-2xl font-bold text-white">Sync Board</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Manage projects with your team in real time
          </h2>
          <p className="text-base text-white/60 leading-relaxed">
            Kanban boards, sprint planning, and team collaboration — all synced live. No bloat, no complexity.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Real-time sync', 'Kanban boards', 'Sprint planning', 'GitHub integration'].map((feature) => (
              <span key={feature} className="px-3 py-1.5 text-xs font-medium rounded-full text-(--color-text-secondary) border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-md flex items-center justify-center font-bold text-base text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              S
            </div>
            <span className="text-lg font-bold text-(--color-text-primary)">Sync Board</span>
          </div>

          <h1 className="text-2xl font-bold text-(--color-text-primary) mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-(--color-text-secondary) mb-8">
            Sign in to your account to continue
          </p>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-2.5 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 w-full h-11 px-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm font-medium text-(--color-text-primary) transition-all duration-200 hover:bg-(--color-bg-hover) hover:border-(--color-border-strong) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 w-full h-11 px-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm font-medium text-(--color-text-primary) transition-all duration-200 hover:bg-(--color-bg-hover) hover:border-(--color-border-strong) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-(--color-border-default)" />
            <span className="text-xs text-(--color-text-tertiary) uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-(--color-border-default)" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 pl-12 pr-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) transition-colors duration-200 focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-(--color-text-secondary)">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-(--color-accent-text) hover:text-(--color-accent) transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-11 pl-12 pr-11 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) transition-colors duration-200 focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-secondary) transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-(--color-text-secondary) mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-(--color-accent-text) hover:text-(--color-accent) transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
