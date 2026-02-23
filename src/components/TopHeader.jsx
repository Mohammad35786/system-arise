import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function getInitials(profile) {
  const raw = (profile?.display_name || profile?.username || profile?.email || '').trim()
  if (!raw) return 'U'
  const parts = raw.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]
  return `${a}${b || ''}`.toUpperCase()
}

function avatarStyle(avatarId) {
  const id = Number(avatarId || 1)
  const map = {
    1: { ring: 'ring-[#C9A84C]/50', bg: 'bg-[#C9A84C]/20', text: 'text-[#C9A84C]' },
    2: { ring: 'ring-blue-500/40', bg: 'bg-blue-500/15', text: 'text-blue-400' },
    3: { ring: 'ring-green-500/40', bg: 'bg-green-500/15', text: 'text-green-400' },
    4: { ring: 'ring-purple-500/40', bg: 'bg-purple-500/15', text: 'text-purple-400' },
    5: { ring: 'ring-red-500/40', bg: 'bg-red-500/15', text: 'text-red-400' },
  }
  return map[id] || map[1]
}

export function TopHeader({ profile, onMenuOpen }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = useMemo(() => getInitials(profile), [profile])
  const av = avatarStyle(profile?.avatar_id)

  useEffect(() => {
    function onDocDown(e) {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target)) return
      setMenuOpen(false)
    }
    if (!menuOpen) return
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [menuOpen])

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="sticky top-0 z-40 bg-[#080810]/95 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: hamburger */}
        <button
          onClick={onMenuOpen}
          className="w-10 h-10 flex items-center justify-center rounded border border-gray-800 bg-[#0D1117]/40"
          aria-label="Open menu"
        >
          <div className="flex flex-col gap-1.5">
            <div className="h-0.5 w-5 bg-gray-400" />
            <div className="h-0.5 w-5 bg-gray-400" />
            <div className="h-0.5 w-3 bg-gray-400" />
          </div>
        </button>

        {/* Center: title */}
        <div className="text-center leading-tight">
          <div className="text-[#C9A84C] font-mono font-bold text-sm tracking-wider">SYSTEM</div>
          <div className="text-gray-500 font-mono text-[10px] tracking-widest">ARISE PROTOCOL</div>
        </div>

        {/* Right: actions + avatar */}
        <div className="flex items-center gap-2">


          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className={`w-10 h-10 rounded-full ring-2 ${av.ring} ${av.bg} flex items-center justify-center font-mono text-xs font-bold ${av.text}`}
              aria-label="Profile menu"
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0D1117] border border-gray-800 rounded shadow-[0_0_30px_#00000066] overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="text-[#E8E8E8] font-mono text-xs font-bold truncate">
                    {profile?.display_name || profile?.username || 'HUNTER'}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-gray-600 font-mono text-[10px]">RANK</span>
                    <span className="text-[#C9A84C] font-mono text-[10px] font-bold">{profile?.rank || 'E'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-gray-600 font-mono text-[10px]">XP</span>
                    <span className="text-gray-400 font-mono text-[10px] font-bold">{profile?.xp || 0}</span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {[
                    { label: 'VIEW PROFILE', to: '/profile' },
                    { label: 'RADAR', to: '/radar' },
                    { label: 'INBOX', to: '/inbox' },
                  ].map((item) => (
                    <button
                      key={item.to}
                      onClick={() => { setMenuOpen(false); navigate(item.to) }}
                      className="w-full text-left px-3 py-2 rounded border border-transparent hover:border-gray-700 text-gray-300 hover:text-[#E8E8E8] font-mono text-xs"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-gray-800">
                  <button
                    onClick={logout}
                    className="w-full px-3 py-2 rounded border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500 font-mono text-xs"
                  >
                    LOGOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

