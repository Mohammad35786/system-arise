import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Status from './pages/Status'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Radar from './pages/Radar'
import Create from './pages/Create'
import Inbox from './pages/Inbox'
import Profile from './pages/Profile'
import SyllabusDetail from './pages/SyllabusDetail'
import HistoryDetails from './pages/HistoryDetails'
import Settings from './pages/Settings'
import AccountSettings from './pages/settings/AccountSettings'
import ArisePro from './pages/settings/ArisePro'
import LanguageSettings from './pages/settings/LanguageSettings'
import TextSize from './pages/settings/TextSize'
import ThemeSettings from './pages/settings/ThemeSettings'
import FontStyle from './pages/settings/FontStyle'
import BackgroundSettings from './pages/settings/BackgroundSettings'
import { TimerProvider } from './context/TimerContext'
import { applyFont } from './lib/fontOptions'
import { applyBackground } from './lib/themeUtils'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session) }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const savedSize = localStorage.getItem('arise_text_size')
    if (savedSize) {
      document.documentElement.setAttribute('data-text-size', savedSize)
    }

    const savedAccent = localStorage.getItem('arise_accent')
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent', savedAccent)
    }

    const savedFont = localStorage.getItem('arise_font')
    if (savedFont) {
      applyFont(savedFont)
    }

    const savedBg = localStorage.getItem('arise_bg')
    if (savedBg) {
      applyBackground(savedBg)
    }
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">
          SYSTEM INITIALIZING...
        </p>
      </div>
    )
  }

  return (
    <TimerProvider>
      <Router>
        <Routes>
          <Route path="/" element={!session ? <Login /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/home" />} />
          <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/" />} />
          <Route path="/home" element={session ? <Home /> : <Navigate to="/" />} />
          <Route path="/status" element={session ? <Status /> : <Navigate to="/" />} />
          <Route path="/radar" element={session ? <Radar /> : <Navigate to="/" />} />
          <Route path="/create" element={session ? <Create /> : <Navigate to="/" />} />
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
          <Route path="/syllabus/:id" element={session ? <SyllabusDetail /> : <Navigate to="/" />} />
          <Route path="/history/:sectionType" element={session ? <HistoryDetails /> : <Navigate to="/" />} />
          <Route path="/rank" element={session ? <Status /> : <Navigate to="/" />} />
          <Route path="/inbox" element={session ? <Inbox /> : <Navigate to="/" />} />
          <Route path="/settings" element={session ? <Settings /> : <Navigate to="/" />} />
          <Route path="/settings/account" element={session ? <AccountSettings /> : <Navigate to="/" />} />
          <Route path="/settings/pro" element={session ? <ArisePro /> : <Navigate to="/" />} />
          <Route path="/settings/language" element={session ? <LanguageSettings /> : <Navigate to="/" />} />
          <Route path="/settings/textsize" element={session ? <TextSize /> : <Navigate to="/" />} />
          <Route path="/settings/theme" element={session ? <ThemeSettings /> : <Navigate to="/" />} />
          <Route path="/settings/font" element={session ? <FontStyle /> : <Navigate to="/" />} />
          <Route path="/settings/background" element={session ? <BackgroundSettings /> : <Navigate to="/" />} />
        </Routes>
      </Router>
    </TimerProvider>
  )
}

export default App
