import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getAccentLabel } from '../lib/themeOptions'
import { AppShell } from '../components/AppShell'
import { getFontById } from '../lib/fontOptions'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
    const navigate = useNavigate()
    const { theme } = useTheme()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
            setLoading(false)
        }
        loadProfile()
    }, [])

    const SettingRow = ({ icon, label, sublabel, to, badge }) => (
        <button
            onClick={() => to && navigate(to)}
            className="w-full text-left bg-[#0D1117] border-b border-gray-800/50 hover:bg-[#0D1117]/80 p-4 flex items-center justify-between transition-colors group"
        >
            <div className="flex items-center gap-3">
                <span className="text-gray-400 group-hover:text-[#C9A84C]">{icon}</span>
                <div>
                    <div className="text-[#E8E8E8] font-mono text-xs font-bold uppercase tracking-wider">{label}</div>
                    {sublabel && <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">{sublabel}</div>}
                </div>
            </div>
            <div className="flex items-center">
                {badge ? (
                    <span className="text-[#C9A84C] font-mono text-[9px] font-bold border border-[#C9A84C]/50 px-1.5 py-0.5 rounded">
                        {badge}
                    </span>
                ) : (
                    <span className="text-gray-600 text-xs">→</span>
                )}
            </div>
        </button>
    )

    const SectionLabel = ({ children }) => (
        <div className="px-4 pt-6 pb-2 text-gray-600 font-mono text-[10px] font-bold uppercase tracking-widest">
            {children}
        </div>
    )

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[#080810] flex flex-col">
                {/* Header */}
                <div className="px-4 py-6 flex items-center justify-between sticky top-0 bg-[#080810]/80 backdrop-blur-sm z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← BACK
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest">SETTINGS</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-[0.2em] mt-0.5">SYSTEM CONFIGURATION</p>
                    </div>
                    <div className="w-12 text-right"></div>
                </div>

                <div className="flex-1 overflow-y-auto pb-10">
                    <SectionLabel>ACCOUNT</SectionLabel>
                    <SettingRow
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        }
                        label="ACCOUNT SETTINGS"
                        sublabel="Name, email, password"
                        to="/settings/account"
                    />

                    <SectionLabel>ARISE+</SectionLabel>
                    <SettingRow
                        icon={<span className="text-[#C9A84C]">◆</span>}
                        label="ARISE PRO"
                        sublabel="Unlock premium features"
                        to="/settings/pro"
                        badge="COMING SOON"
                    />

                    <SectionLabel>DISPLAY</SectionLabel>
                    <SettingRow
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                        }
                        label="LANGUAGE"
                        sublabel={profile?.language || 'English'}
                        to="/settings/language"
                    />
                    <SettingRow
                        icon={
                            <span className="font-mono font-bold text-xs" style={{ fontSize: '10px' }}>Aa</span>
                        }
                        label="TEXT SIZE"
                        sublabel={profile?.text_size ? (profile.text_size.charAt(0).toUpperCase() + profile.text_size.slice(1)) : 'Normal'}
                        to="/settings/textsize"
                    />
                    <SettingRow
                        icon={
                            <span
                                className="font-bold text-xs"
                                style={{
                                    fontFamily: getFontById(localStorage.getItem('arise_font')).family,
                                    fontSize: '10px'
                                }}
                            >
                                Aa
                            </span>
                        }
                        label="FONT STYLE"
                        sublabel={getFontById(localStorage.getItem('arise_font')).label}
                        to="/settings/font"
                    />
                    <SettingRow
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                        }
                        label="BACKGROUND SETTINGS"
                        sublabel={theme ? theme.toUpperCase() : 'DARK'}
                        to="/settings/background"
                    />
                    <SettingRow
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                            </svg>
                        }
                        label="THEME"
                        sublabel={getAccentLabel(profile?.accent_color)}
                        to="/settings/theme"
                    />

                    <div className="mt-12 text-center space-y-1">
                        <div className="text-gray-700 font-mono text-[10px] uppercase tracking-widest">SYSTEM: ARISE v1.0</div>
                        <div className="text-gray-800 font-mono text-[9px] uppercase tracking-[0.3em]">ARISE PROTOCOL</div>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
