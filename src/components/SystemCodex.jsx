import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function NavIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'home') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    )
  }
  if (name === 'radar') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
        <path d="M12 6a6 6 0 0 1 6 6" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    )
  }
  if (name === 'create') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="7.5" x2="12" y2="16.5" />
        <line x1="7.5" y1="12" x2="16.5" y2="12" />
      </svg>
    )
  }
  if (name === 'profile') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5" />
      </svg>
    )
  }
  if (name === 'inbox') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  }
  if (name === 'settings') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  }
  return null
}

export function SystemCodex({ isOpen, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (!isOpen) return
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const nav = [
    { to: '/home', label: 'HOME', desc: 'Command Center · your Frog + board', icon: 'home' },
    { to: '/radar', label: 'RADAR', desc: 'Skill quests · niche discovery', icon: 'radar' },
    { to: '/create', label: 'CREATE', desc: 'Forge quests · plans · sets', icon: 'create' },
    { to: '/profile', label: 'PROFILE', desc: 'Hunter page · avatar & trophies', icon: 'profile' },
    { to: '/inbox', label: 'INBOX', desc: 'System voice · briefings', icon: 'inbox' },
    { to: '/settings', label: 'SETTINGS', desc: 'Account · display · preferences', icon: 'settings' },
  ]

  const rules = [
    { title: 'FEAR = PRIORITY', body: 'The task you fear most is usually the one that moves your life.' },
    { title: 'SLICE AND DICE', body: 'Reduce resistance: define the first micro-step (the Slice).' },
    { title: 'BEFORE NOON BONUS', body: 'Win early. The System rewards decisive mornings.' },
    { title: 'ONE FROG PER DAY', body: 'Select one main quest. Everything else is a side quest.' },
    { title: 'SYSTEM OVER MOOD', body: 'Execute the protocol even when motivation is offline.' },
  ]

  const thresholds = [
    { rank: 'E', xp: 0 },
    { rank: 'D', xp: 500 },
    { rank: 'C', xp: 1500 },
    { rank: 'B', xp: 3500 },
    { rank: 'A', xp: 7500 },
    { rank: 'S', xp: 15000 },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[90vw] bg-[#080810] border-r border-gray-800 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="System Codex"
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-gray-800 flex items-start justify-between">
            <div>
              <div className="text-[#C9A84C] font-mono font-bold text-sm tracking-wider">SYSTEM CODEX</div>
              <div className="text-gray-600 font-mono text-[10px] tracking-widest">NAV + PROTOCOLS</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 font-mono text-xs border border-gray-800 rounded px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <div className="text-gray-500 font-mono text-xs mb-2">NAVIGATION</div>
              <div className="space-y-2">
                {nav.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => { onClose?.(); navigate(item.to) }}
                    className="w-full text-left border border-gray-800 bg-[#0D1117]/50 hover:border-gray-700 rounded p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-[#C9A84C] mt-0.5">
                        <NavIcon name={item.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#E8E8E8] font-mono text-xs font-bold">{item.label}</div>
                        <div className="text-gray-600 font-mono text-[10px] leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="text-gray-500 font-mono text-xs mb-2">THE SYSTEM RULES</div>
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.title} className="border border-gray-800 bg-[#0D1117]/40 rounded p-3">
                    <div className="text-[#C9A84C] font-mono text-xs font-bold">{r.title}</div>
                    <div className="text-gray-500 font-mono text-xs mt-1 leading-relaxed">{r.body}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="text-gray-500 font-mono text-xs mb-2">RANK THRESHOLDS</div>
              <div className="border border-gray-800 bg-[#0D1117]/40 rounded overflow-hidden">
                {thresholds.map((t, idx) => (
                  <div
                    key={t.rank}
                    className={`px-3 py-2 flex items-center justify-between ${idx !== 0 ? 'border-t border-gray-800' : ''}`}
                  >
                    <div className="text-[#E8E8E8] font-mono text-xs font-bold">{t.rank}-RANK</div>
                    <div className="text-gray-500 font-mono text-xs">{t.xp} XP</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="px-4 py-3 border-t border-gray-800">
            <div className="text-gray-600 font-mono text-[10px] italic leading-relaxed">
              "Whatever the mind can conceive and believe, it can achieve." — Napoleon Hill
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

