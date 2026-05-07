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
