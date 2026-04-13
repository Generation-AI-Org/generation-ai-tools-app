'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'

export default function AuthCallbackPage() {
  useEffect(() => {
    // Handle the auth callback
    // Supabase sends tokens in the URL fragment (after #)
    // The supabase client automatically picks these up

    const handleCallback = async () => {
      // Check for error in URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const error = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')

      if (error) {
        console.error('Auth error:', error, errorDescription)
        window.location.href = `/login?error=${error}`
        return
      }

      // Get session - supabase client reads tokens from URL fragment automatically
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        window.location.href = '/login?error=session_failed'
        return
      }

      // Success - redirect to home
      window.location.href = '/'
    }

    handleCallback()
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
