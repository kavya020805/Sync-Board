import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app with auth state.
 * Handles session management, OAuth, and profile syncing.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Ensure a profile row exists for the given user.
   * If the trigger didn't fire (e.g. user signed up before migration),
   * this creates the profile on the fly.
   */
  const ensureProfile = useCallback(async (authUser) => {
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) {
      setProfile(data)
      return data
    }

    // Profile doesn't exist — create it now
    const displayName =
      authUser.user_metadata?.display_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'User'

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        display_name: displayName,
        avatar_url: authUser.user_metadata?.avatar_url || null,
      })
      .select()
      .single()

    if (!insertError && newProfile) {
      setProfile(newProfile)
      return newProfile
    }

    // If upsert also failed, set basic profile from auth data
    console.error('Failed to create profile:', insertError)
    const fallback = {
      id: authUser.id,
      email: authUser.email,
      display_name: displayName,
    }
    setProfile(fallback)
    return fallback
  }, [])

  // Initialize auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        ensureProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // Small delay to let the trigger create the profile first
          setTimeout(() => ensureProfile(session.user), 500)
        } else {
          ensureProfile(session.user)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [ensureProfile])

  // Sign up with email and password
  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: fullName,
        },
      },
    })
    return { data, error }
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }, [])

  // Sign in with OAuth (Google, Discord)
  const signInWithOAuth = useCallback(async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }, [])

  // Send password reset email
  const resetPassword = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  }, [])

  // Update password (after reset)
  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setSession(null)
      setUser(null)
      setProfile(null)
    }
    return { error }
  }, [])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      return await ensureProfile(user)
    }
  }, [user, ensureProfile])

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth hook — access auth state and methods.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
