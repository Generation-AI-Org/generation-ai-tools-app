'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient()

    // Check for error in URL fragment first
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = hashParams.get('error')

    if (error) {
      console.error('Auth error:', error, hashParams.get('error_description'))
      window.location.href = `/login?error=${error}`
      return
    }

    // Listen for auth state changes - Supabase processes URL tokens automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Success - redirect to home
        window.location.href = '/'
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, also redirect
        window.location.href = '/'
      }
    })

    // Fallback: check if already signed in after a short delay
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/'
      } else {
        window.location.href = '/login?error=session_failed'
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  )
}
