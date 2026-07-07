import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SignUpPage() {
  const { signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to create account')
    } else {
      toast.success('Account created! Check your email to verify.')
      navigate('/login')
    }
  }

  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    const { error } = await signInWithOAuth(provider)
    if (error) {
      toast.error(error.message || `Failed to sign up with ${provider}`)
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
            Start building with your team today
          </h2>
          <p className="text-base text-white/60 leading-relaxed">
            Create your free account and set up your first workspace in under a minute. No credit card required.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Free forever', 'Unlimited projects', 'Real-time collaboration', 'GitHub sync'].map((feature) => (
              <span key={feature} className="px-3 py-1.5 text-xs font-medium rounded-full text-(--color-text-secondary) border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Sign Up Form */}
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
            Create your account
          </h1>
          <p className="text-sm text-(--color-text-secondary) mb-8">
            Get started for free — no credit card needed
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
              onClick={() => handleOAuth('discord')}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 w-full h-11 px-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm font-medium text-(--color-text-primary) transition-all duration-200 hover:bg-(--color-bg-hover) hover:border-(--color-border-strong) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'discord' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5865F2">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
              )}
              Continue with Discord
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
              <label htmlFor="fullName" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full h-11 pl-12 pr-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) transition-colors duration-200 focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-(--color-text-secondary) mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-(--color-accent-text) hover:text-(--color-accent) transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
