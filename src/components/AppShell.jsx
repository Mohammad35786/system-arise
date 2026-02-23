import { useState } from 'react'
import { BottomNav } from './BottomNav'
import { SystemCodex } from './SystemCodex'
import { TopHeader } from './TopHeader'
import { GlobalTimerBar } from './GlobalTimerBar'
import { useTimer } from '../context/TimerContext'

export function AppShell({ profile, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { timerState } = useTimer()
  const hasActiveTimer = timerState.status === 'running' || timerState.status === 'paused'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-mono text-[var(--text-primary)]">
      <GlobalTimerBar />
      <div className="sticky top-0 z-40 bg-[rgba(8,8,16,0.95)] backdrop-blur-[20px] border-b border-[rgba(201,168,76,0.1)]">
        <TopHeader profile={profile} onMenuOpen={() => setDrawerOpen(true)} />
      </div>
      <SystemCodex isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className={`pb-24 ${hasActiveTimer ? 'pt-2' : ''}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
