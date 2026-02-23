import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { useTheme } from '../../context/ThemeContext'

export default function BackgroundSettings() {
    const navigate = useNavigate()
    const { theme, setTheme } = useTheme()
    const [selectedTheme, setSelectedTheme] = useState(theme)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleApply = async () => {
        setSaving(true)
        // Simulate a small delay for "System Updating" feel
        setTimeout(() => {
            setTheme(selectedTheme)
            setSaving(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }, 800)
    }

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[var(--bg-primary)] flex flex-col px-4 pb-10">
                {/* Header */}
                <div className="py-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← SETTINGS
                    </button>
                    <div className="text-center flex-1 pr-12">
                        <h1 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest">BACKGROUND</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-widest mt-0.5 uppercase">SYSTEM VISUAL PROTOCOL</p>
                    </div>
                </div>

                {/* Live Preview Card */}
                <div className="mb-8">
                    <div className="text-gray-600 font-mono text-[10px] uppercase tracking-widest mb-2 px-1">PREVIEW</div>
                    <div className="border border-[var(--border-color)] rounded-xl p-6 bg-[var(--bg-card)] transition-all duration-300 relative overflow-hidden group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] font-mono text-sm font-bold">
                                S
                            </div>
                            <div>
                                <div className="text-[var(--text-primary)] font-mono text-xs font-bold uppercase">SYSTEM PROTOCOL</div>
                                <div className="text-[var(--text-secondary)] font-mono text-[9px] uppercase">STATUS: ACTIVE</div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                            <p className="text-[var(--text-secondary)] font-mono text-[10px] leading-relaxed">
                                Visual parameters are currently set to <span className="text-[#C9A84C] font-bold uppercase">{selectedTheme}</span> mode.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Theme List */}
                <div className="flex-1 space-y-3">
                    {/* DARK */}
                    <button
                        onClick={() => setSelectedTheme('dark')}
                        className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all ${selectedTheme === 'dark'
                                ? 'border-[#C9A84C] bg-[var(--bg-secondary)]'
                                : 'border-gray-800 bg-[var(--bg-card)] hover:border-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-6 h-6 bg-[#080810] border border-[#333344] rounded" />
                            <div>
                                <div className={`font-mono text-xs font-bold tracking-wider ${selectedTheme === 'dark' ? 'text-[#C9A84C]' : 'text-[var(--text-primary)]'}`}>
                                    DARK
                                </div>
                                <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">DEFAULT PROTOCOL</div>
                            </div>
                        </div>
                        {selectedTheme === 'dark' && (
                            <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                        )}
                    </button>

                    {/* LIGHT */}
                    <button
                        onClick={() => setSelectedTheme('light')}
                        className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all ${selectedTheme === 'light'
                                ? 'border-[#C9A84C] bg-[var(--bg-secondary)]'
                                : 'border-gray-800 bg-[var(--bg-card)] hover:border-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-6 h-6 bg-[#DAE0E6] border border-[#EDEFF1] rounded" />
                            <div>
                                <div className={`font-mono text-xs font-bold tracking-wider ${selectedTheme === 'light' ? 'text-[#C9A84C]' : 'text-[var(--text-primary)]'}`}>
                                    LIGHT
                                </div>
                                <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">REDDIT STYLE</div>
                            </div>
                        </div>
                        {selectedTheme === 'light' && (
                            <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                        )}
                    </button>

                    {/* CUSTOM */}
                    <div className="w-full p-4 flex items-center justify-between rounded-xl border border-gray-800 bg-[var(--bg-card)] opacity-50 relative pointer-events-none">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-6 h-6 bg-transparent border border-gray-800 rounded flex items-center justify-center text-[10px]">
                                🔒
                            </div>
                            <div>
                                <div className="text-[var(--text-primary)] font-mono text-xs font-bold tracking-wider">
                                    CUSTOM
                                </div>
                                <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">PRO PLAN ONLY</div>
                            </div>
                        </div>
                        <div className="bg-[#C9A84C] text-black font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            🔒 LOCKED
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                <div className="mt-8 space-y-3">
                    <button
                        onClick={handleApply}
                        disabled={saving || selectedTheme === theme}
                        className="w-full bg-[#C9A84C] text-black font-mono font-bold py-4 rounded-lg text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {saving ? "APPLYING..." : "SAVE SETTINGS"}
                    </button>

                    {saved && (
                        <div className="border border-green-500 bg-green-500/10 rounded-lg p-3 text-green-400 font-mono text-xs text-center uppercase tracking-wider animate-pulse">
                            ✓ PROTOCOL UPDATED
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    )
}
