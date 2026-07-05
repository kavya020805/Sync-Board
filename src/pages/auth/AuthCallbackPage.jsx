import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

/**
 * AuthCallbackPage — handles OAuth redirects and email confirmation.
 * Supabase appends tokens to the URL hash; this page processes them
 * and redirects the user to the app.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        navigate('/login')
        return
      }

      // Check if this is a password reset flow
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')

      if (type === 'recovery') {
        navigate('/auth/reset-password')
      } else {
        navigate('/')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary)">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
        <p className="text-sm text-(--color-text-secondary)">Signing you in...</p>
      </div>
    </div>
  )
}
