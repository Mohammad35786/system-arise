import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('ACCESS CODE MUST BE AT LEAST 6 CHARACTERS.')
      return
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('ACCESS CODE MUST CONTAIN LETTERS AND NUMBERS.')
      return
    }
    if (password !== confirm) {
      setError('ACCESS CODES DO NOT MATCH. RE-ENTER TO CONFIRM.')
      return
    }
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      navigate('/onboarding')
    } catch (err) {
      setError(err.message || 'REGISTRATION FAILED. TRY AGAIN.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/onboarding` }
      })
      if (oauthError) throw oauthError
    } catch (err) {
      setError(err.message || 'GOOGLE SIGN IN FAILED.')
      setLoading(false)
    }
  }

  // password strength indicator
  function getPasswordStrength() {
    if (password.length === 0) return null
    if (password.length < 6) return { label: 'TOO SHORT', color: 'text-red-500', bar: 'bg-red-500', width: '25%' }
    if (password.length < 8) return { label: 'WEAK', color: 'text-orange-400', bar: 'bg-orange-400', width: '50%' }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return { label: 'ADD NUMBERS', color: 'text-yellow-400', bar: 'bg-yellow-400', width: '60%' }
    if (password.length >= 10) return { label: 'STRONG', color: 'text-green-400', bar: 'bg-green-400', width: '100%' }
    return { label: 'GOOD', color: 'text-[#C9A84C]', bar: 'bg-[#C9A84C]', width: '80%' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <p className="text-[#C9A84C] text-sm font-mono text-center mb-1">
          SYSTEM: ARISE
        </p>
        <p className="text-gray-500 text-xs font-mono text-center mb-6">
          HUNTER REGISTRATION
        </p>

        <form onSubmit={handleSubmit} className="border border-[#C9A84C] bg-[#0D1117] p-4 rounded font-mono">

          {/* Email */}
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

          {/* Password */}
          <label className="text-gray-500 text-xs font-mono mb-1 block">
            CREATE ACCESS CODE
          </label>
          <div className="relative mb-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
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

          {/* Password rules hint */}
          <p className="text-gray-600 text-xs font-mono mb-2">
            RULES: MIN 6 CHARS · MUST INCLUDE LETTERS + NUMBERS
          </p>

          {/* Password strength bar */}
          {strength && (
            <div className="mb-3">
              <div className="w-full bg-gray-800 rounded-full h-1 mb-1">
                <div
                  className={`${strength.bar} h-1 rounded-full transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-xs font-mono ${strength.color}`}>
                STRENGTH: {strength.label}
              </p>
            </div>
          )}

          {/* Confirm Password */}
          <label className="text-gray-500 text-xs font-mono mb-1 block">
            CONFIRM ACCESS CODE
          </label>
          <div className="relative mb-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter access code"
              required
              className={`w-full bg-[#0A0A0F] border rounded px-3 py-2.5 pr-10 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none transition-colors ${
                confirm.length > 0
                  ? confirm === password
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-red-500 focus:border-red-500'
                  : 'border-gray-600 focus:border-[#C9A84C]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9A84C] text-xs font-mono"
            >
              {showConfirm ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          {/* Confirm match feedback */}
          {confirm.length > 0 && (
            <p className={`text-xs font-mono mb-3 ${confirm === password ? 'text-green-400' : 'text-red-500'}`}>
              {confirm === password ? '✓ ACCESS CODES MATCH' : '✗ ACCESS CODES DO NOT MATCH'}
            </p>
          )}

          {/* Error message */}
          {error && (
            <div className="border border-red-500 bg-red-500/10 rounded px-3 py-2 mb-3">
              <p className="text-red-400 text-xs font-mono">⚠ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] text-black font-bold font-mono py-2.5 rounded text-sm disabled:opacity-70 mt-1"
          >
            {loading ? 'AWAKENING...' : 'AWAKEN'}
          </button>

          <p className="text-gray-500 text-xs font-mono text-center mt-4">
            Already awakened?{' '}
            <Link to="/" className="text-[#C9A84C] hover:underline">
              AUTHENTICATE
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

export default Signup