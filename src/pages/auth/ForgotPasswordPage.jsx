import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to send reset link')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) px-6">
      <div className="w-full max-w-[400px] animate-fade-in">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-(--color-success-muted) flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-(--color-success)" />
            </div>
            <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">Check your email</h1>
            <p className="text-sm text-(--color-text-secondary) mb-6 leading-relaxed">
              We sent a password reset link to<br />
              <span className="font-medium text-(--color-text-primary)">{email}</span>
            </p>
            <p className="text-xs text-(--color-text-tertiary)">
              Didn&apos;t receive the email?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-(--color-accent-text) hover:text-(--color-accent) transition-colors cursor-pointer"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-(--color-text-primary) mb-1.5">
              Reset your password
            </h1>
            <p className="text-sm text-(--color-text-secondary) mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

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
                    autoFocus
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
