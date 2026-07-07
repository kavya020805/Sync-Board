import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function GithubCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const returnUrl = localStorage.getItem('github_auth_return_url')
    
    if (code && returnUrl) {
      // Append the code to the return URL and navigate
      const char = returnUrl.includes('?') ? '&' : '?'
      navigate(`${returnUrl}${char}code=${code}`, { replace: true })
    } else {
      // Fallback
      navigate('/', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-(--color-bg-primary)">
      <Loader2 className="w-8 h-8 animate-spin text-(--color-accent) mb-4" />
      <h2 className="text-lg font-semibold text-(--color-text-primary)">Authenticating with GitHub...</h2>
      <p className="text-sm text-(--color-text-secondary)">Please wait while we redirect you back.</p>
    </div>
  )
}
