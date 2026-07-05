import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Please fill in both fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to update password')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) px-6">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-(--color-success-muted) flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-(--color-success)" />
          </div>
          <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">Password updated</h1>
          <p className="text-sm text-(--color-text-secondary)">Redirecting you to the app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) px-6">
      <div className="w-full max-w-[400px] animate-fade-in">
        <h1 className="text-2xl font-bold text-(--color-text-primary) mb-1.5">
          Set new password
        </h1>
        <p className="text-sm text-(--color-text-secondary) mb-8">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
              New password
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

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) pointer-events-none" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full h-11 pl-12 pr-4 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) transition-colors duration-200 focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
