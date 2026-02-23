import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const redirectAfterLogin = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()
      if (profileError || !profile) {
        navigate('/onboarding')
        return
      }
      navigate(profile.onboarding_complete ? '/home' : '/onboarding')
    } catch (err) {
      console.error('Redirect error:', err)
      navigate('/onboarding')
    }
  }, [navigate])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectAfterLogin()
    })
  }, [redirectAfterLogin])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('HUNTER ID IS REQUIRED.')
      return
    }
    if (!password) {
      setError('ACCESS CODE IS REQUIRED.')
      return
    }
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      await redirectAfterLogin()
    } catch (err) {
      if (err.message?.includes('Invalid login')) {
        setError('INVALID HUNTER ID OR ACCESS CODE. CHECK AND RETRY.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('EMAIL NOT CONFIRMED. CHECK YOUR INBOX OR DISABLE EMAIL CONFIRMATION IN SUPABASE.')
      } else {
        setError(err.message?.toUpperCase() || 'AUTHENTICATION FAILED.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (oauthError) throw oauthError
    } catch (err) {
      setError(err.message || 'GOOGLE SIGN IN FAILED.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <p className="text-[#C9A84C] text-sm font-mono text-center mb-1">
          SYSTEM: ARISE
        </p>
        <p className="text-gray-500 text-xs font-mono text-center mb-6">
          HUNTER AUTHENTICATION PORTAL
        </p>

        <form onSubmit={handleSubmit} className="border border-[#C9A84C] bg-[#0D1117] p-4 rounded font-mono">

          <label className="text-gray-500 text-xs font-mono mb-1 block">
            HUNTER ID (EMAIL)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hunter@example.com"
            required
            className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C] mb-4"
          />

          <label className="text-gray-500 text-xs font-mono mb-1 block">
            ACCESS CODE (PASSWORD)
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access code"
              required
              className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 pr-10 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A84C] text-xs font-mono"
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          {/* Error box */}
          {error && (
            <div className="border border-red-500 bg-red-500/10 rounded px-3 py-2 mb-3">
              <p className="text-red-400 text-xs font-mono">⚠ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-bold font-mono py-2.5 rounded text-sm disabled:opacity-70"
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>

          <p className="text-gray-500 text-xs font-mono text-center mt-4">
            New hunter?{' '}
            <Link to="/signup" className="text-[#C9A84C] hover:underline">
              REGISTER
            </Link>
          </p>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <span className="absolute h-px w-full bg-gray-700" />
          <span className="relative bg-[#0A0A0F] px-2 text-gray-500 text-xs font-mono">OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[#0D1117] border border-[#C9A84C] text-[#C9A84C] font-mono py-2.5 rounded text-sm disabled:opacity-70"
        >
          CONTINUE WITH GOOGLE ACCOUNT
        </button>
      </div>
    </div>
  )
}

export default Login