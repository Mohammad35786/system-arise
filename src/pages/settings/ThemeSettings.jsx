import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppShell } from '../../components/AppShell'
import { ACCENT_OPTIONS } from '../../lib/themeOptions'
import { applyBackground } from '../../lib/themeUtils'

const BG_OPTIONS = [
    {
        id: 'default',
        label: 'VOID BLACK',
        desc: 'Pure dark system default',
        value: '#080810',
        preview: 'bg-[#080810]',
    },
    {
        id: 'navy',
        label: 'DEEP NAVY',
        desc: 'Dark blue like the Solo Leveling system',
        value: 'navy',
        preview: 'bg-[#0a0a1a]',
    },
    {
        id: 'gradient',
        label: 'ABYSS GRADIENT',
        desc: 'Navy fading to black, adds depth',
        value: 'gradient',
        preview: 'bg-gradient-to-b from-[#0d0d2b] to-[#080810]',
    },
]

export default function ThemeSettings() {
    const navigate = useNavigate()
    const [selectedAccent, setSelectedAccent] = useState('#C9A84C')
    const [selectedBg, setSelectedBg] = useState('default')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [initialAccent, setInitialAccent] = useState('#C9A84C')
    const [initialBg, setInitialBg] = useState('default')

    useEffect(() => {
        async function loadSettings() {
            const localAccent = localStorage.getItem('arise_accent')
            if (localAccent) {
                setSelectedAccent(localAccent)
                setInitialAccent(localAccent)
            }

            const localBg = localStorage.getItem('arise_bg')
            if (localBg) {
                setSelectedBg(localBg)
                setInitialBg(localBg)
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('accent_color').eq('id', user.id).single()
                if (data?.accent_color) {
                    setSelectedAccent(data.accent_color)
                    setInitialAccent(data.accent_color)
                }
            }
        }
        loadSettings()
    }, [])

    const handleApply = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ accent_color: selectedAccent })
                    .eq('id', user.id)

                if (error) throw error
            }

            localStorage.setItem('arise_accent', selectedAccent)
            document.documentElement.style.setProperty('--accent', selectedAccent)

            applyBackground(selectedBg)

            setSaved(true)
            setTimeout(() => {
                navigate('/settings')
            }, 1500)
        } catch (err) {
            console.error('Error saving theme settings:', err)
        } finally {
            setSaving(false)
        }
    }

    const currentOption = ACCENT_OPTIONS.find(a => a.color === selectedAccent) || ACCENT_OPTIONS[0]

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[#080810] flex flex-col px-4 pb-10">
                {/* Header */}
                <div className="py-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← SETTINGS
                    </button>
                    <div className="text-center flex-1 pr-12">
                        <h1 className="font-mono text-sm font-bold tracking-widest transition-colors duration-300" style={{ color: selectedAccent }}>THEME</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-widest mt-0.5 uppercase">CHOOSE YOUR ACCENT COLOR</p>
                    </div>
                </div>

                {/* Live Preview Card */}
                <div className="mb-8">
                    <div className="text-gray-600 font-mono text-[10px] uppercase tracking-widest mb-2 px-1">PREVIEW</div>
                    <div
                        className="border-2 rounded-xl p-6 bg-[#0D1117] transition-all duration-300 relative overflow-hidden group"
                        style={{
                            borderColor: selectedAccent,
                            boxShadow: `0 0 25px ${selectedAccent}33`
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono text-lg font-bold transition-all duration-300"
                                style={{ borderColor: selectedAccent, color: selectedAccent }}
                            >
                                C
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-mono text-xs font-bold uppercase tracking-wider">C-RANK HUNTER</div>
                                <div className="font-mono text-[10px] font-bold mt-0.5 uppercase transition-colors duration-300" style={{ color: selectedAccent }}>
                                    HOT STREAK — 8 DAYS
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 delay-100 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                    style={{
                                        backgroundColor: selectedAccent,
                                        width: '65%',
                                        boxShadow: `0 0 12px ${selectedAccent}`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2 px-0.5">
                                <div className="font-mono text-xs font-bold transition-colors duration-300" style={{ color: selectedAccent }}>2490 XP</div>
                                <div className="text-gray-600 font-mono text-[10px] font-bold">LV 25</div>
                            </div>
                        </div>

                        <button
                            className="w-full mt-5 border-2 font-mono text-xs font-bold py-2 rounded-lg transition-all duration-300 active:scale-95"
                            style={{
                                borderColor: selectedAccent,
                                color: selectedAccent
                            }}
                        >
                            COMPLETE QUEST
                        </button>
                    </div>
                </div>

                {/* Accent List */}
                <div className="space-y-3 mb-10">
                    {ACCENT_OPTIONS.map((accent) => {
                        const isSelected = selectedAccent === accent.color
                        return (
                            <button
                                key={accent.id}
                                onClick={() => setSelectedAccent(accent.color)}
                                className={`w-full p-4 flex items-center justify-between rounded-xl transition-all duration-200 ${isSelected
                                    ? 'border-2 bg-[#0D1117]'
                                    : 'border border-gray-800 bg-[#0D1117] hover:border-gray-700'
                                    }`}
                                style={{
                                    borderColor: isSelected ? accent.color : undefined,
                                    backgroundColor: isSelected ? `${accent.color}0D` : undefined
                                }}
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div
                                        className="w-4 h-4 rounded-full transition-all duration-300"
                                        style={{
                                            backgroundColor: accent.color,
                                            boxShadow: isSelected ? `0 0 12px ${accent.color}` : `0 0 6px ${accent.color}88`
                                        }}
                                    />
                                    <div>
                                        <div
                                            className="font-mono text-xs font-bold tracking-wider transition-colors duration-300"
                                            style={{ color: isSelected ? accent.color : 'white' }}
                                        >
                                            {accent.label}
                                        </div>
                                        <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">{accent.desc}</div>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? '' : 'border-gray-800'
                                    }`}
                                    style={{ borderColor: isSelected ? accent.color : undefined }}>
                                    {isSelected && (
                                        <div
                                            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                                            style={{ backgroundColor: accent.color }}
                                        />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="system-divider mb-6" />

                {/* Background Style Section */}
                <div className="mb-8">
                    <div className="text-gray-600 font-mono text-[10px] uppercase tracking-widest mb-4 px-1">BACKGROUND STYLE</div>
                    <div className="space-y-3">
                        {BG_OPTIONS.map((option) => {
                            const isSelected = selectedBg === option.id
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedBg(option.id)}
                                    className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all duration-200 ${isSelected
                                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                                        : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`w-8 h-8 rounded ${option.preview} border border-white/10`} />
                                        <div>
                                            <div className={`font-mono text-xs font-bold tracking-wider ${isSelected ? 'text-[#C9A84C]' : 'text-white'}`}>
                                                {option.label}
                                            </div>
                                            <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">{option.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-[#C9A84C]' : 'border-gray-800'
                                        }`}>
                                        {isSelected && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Apply Button */}
                <div className="mt-auto space-y-3">
                    <button
                        onClick={handleApply}
                        disabled={saving || (selectedAccent === initialAccent && selectedBg === initialBg)}
                        className="w-full text-black font-mono font-bold py-4 rounded-lg text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        style={{ backgroundColor: selectedAccent }}
                    >
                        {saving ? "APPLYING..." : "APPLY THEME"}
                    </button>

                    {saved && (
                        <div className="border border-green-500 bg-green-500/10 rounded-lg p-3 text-green-400 font-mono text-xs text-center uppercase tracking-wider animate-pulse">
                            ✓ THEME APPLIED
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    )
}
