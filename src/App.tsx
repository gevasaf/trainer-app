import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { initStorage } from './lib/storage'
import FitnessApp from './fitness_app'

const CLR = {
  bg: '#0f0f17', card: '#17172a', card2: '#1e1e35', border: '#2a2a45',
  purple: '#a78bfa', purpleDark: '#7c3aed', text: '#e5e5f0', muted: '#888',
  green: '#34d399', red: '#f87171',
}
const inp: React.CSSProperties = {
  width: '100%', background: CLR.card2, border: '1px solid ' + CLR.border,
  borderRadius: 9, padding: '9px 12px', color: CLR.text, fontSize: 14,
  boxSizing: 'border-box',
}

function AuthScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')
  const [msg, setMsg]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMsg('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: CLR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💪</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: CLR.purple, margin: 0 }}>AI Trainer</h1>
          <p style={{ fontSize: 13, color: CLR.muted, marginTop: 6 }}>Your personal fitness companion</p>
        </div>
        <div style={{ background: CLR.card, borderRadius: 14, padding: 24, border: '1px solid ' + CLR.border }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: CLR.text, margin: '0 0 20px' }}>
            {isLogin ? 'Sign in' : 'Create account'}
          </h2>
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{ width: '100%', padding: 11, borderRadius: 10, background: '#fff', color: '#1f1f1f', border: '1px solid #dadce0', fontSize: 14, fontWeight: 500, cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: CLR.border }} />
            <span style={{ fontSize: 12, color: CLR.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: CLR.border }} />
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: CLR.muted, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: CLR.muted, display: 'block', marginBottom: 5 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} required minLength={6} />
            </div>
            {error && <div style={{ color: CLR.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
            {msg   && <div style={{ color: CLR.green, fontSize: 13, marginBottom: 12 }}>{msg}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 10, background: CLR.purpleDark, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '…' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </form>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setMsg('') }} style={{ width: '100%', marginTop: 12, padding: 8, background: 'none', border: 'none', color: CLR.muted, fontSize: 13, cursor: 'pointer' }}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) initStorage(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) initStorage(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f17', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14, fontFamily: 'system-ui,sans-serif' }}>
        Loading…
      </div>
    )
  }

  if (!session) return <AuthScreen />
  return <FitnessApp />
}
