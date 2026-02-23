import { useNavigate, useLocation } from 'react-router-dom'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const active = location.pathname

  const tabs = [
    {
      path: '/home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      ),
      label: 'HOME',
    },
    {
      path: '/create',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      label: 'CREATE',
      isCreate: true,
    },
    {
      path: '/inbox',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      label: 'INBOX',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Glass blur bar */}
      <div className="bg-[rgba(8,8,16,0.95)] backdrop-blur-[20px] border-t border-[rgba(201,168,76,0.15)]">
        <div className="max-w-lg mx-auto flex items-end px-2">
          {tabs.map((tab) => {
            const isActive = active === tab.path

            if (tab.isCreate) {
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex-1 flex flex-col items-center justify-center pb-4 pt-2 relative"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${isActive
                    ? 'bg-[#C9A84C] text-black shadow-[0_0_28px_#C9A84Caa]'
                    : 'bg-[#C9A84C] text-black shadow-[0_0_22px_#C9A84C88]'
                    }`}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="6.5" x2="12" y2="17.5" />
                      <line x1="6.5" y1="12" x2="17.5" y2="12" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs mt-1 text-[#C9A84C]" style={{ fontSize: '9px' }}>
                    CREATE
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-[#C9A84C] shadow-[0_0_6px_#C9A84C] mt-0.5 mx-auto" />
                  )}
                </button>
              )
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 ${isActive ? 'text-[#C9A84C]' : 'text-gray-600'
                  }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {tab.icon}
                </div>
                <span className={`font-mono text-xs transition-all ${isActive ? 'opacity-100' : 'opacity-60'
                  }`} style={{ fontSize: '9px' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-[#C9A84C] shadow-[0_0_6px_#C9A84C] mt-0.5 mx-auto" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}