import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppShell } from '../../components/AppShell'
import { FONT_OPTIONS, getFontById, applyFont } from '../../lib/fontOptions'

export default function FontStyle() {
    const navigate = useNavigate()
    const [selectedFont, setSelectedFont] = useState('default')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        async function loadFont() {
            // Load from localStorage first
            const localFont = localStorage.getItem('arise_font')
            if (localFont && FONT_OPTIONS.some(f => f.id === localFont)) {
                setSelectedFont(localFont)
            } else {
                // Backup: Load from profile
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('font_style')
                        .eq('id', user.id)
                        .single()

                    if (data?.font_style) {
                        setSelectedFont(data.font_style)
                    }
                }
            }
        }
        loadFont()
    }, [])

    const handleSelect = (id) => {
        setSelectedFont(id)
    }

    const handleApply = async () => {
        setSaving(true)

        // Apply locally
        applyFont(selectedFont)

        // Save to Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('profiles').update({
                    font_style: selectedFont
                }).eq('id', user.id)
            }

            setSaved(true)
            setSaving(false)
            setTimeout(() => navigate('/settings'), 1500)
        } catch (error) {
            console.error('Error saving font:', error)
            setSaving(false)
        }
    }

    const selectedFontOption = getFontById(selectedFont)

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[#080810] flex flex-col p-4">
                {/* Header */}
                <div className="py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← SETTINGS
                    </button>
                    <div className="text-right">
                        <h1 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest uppercase">FONT STYLE</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-[0.2em] mt-0.5">CHOOSE YOUR HUNTER FONT</p>
                    </div>
                </div>

                {/* Live Preview Card */}
                <div
                    className="border rounded-xl p-4 mb-4 bg-[#0D1117]"
                    style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
                >
                    <div className="text-gray-500 font-mono text-[10px] mb-3 uppercase tracking-widest">PREVIEW</div>
                    <div style={{ fontFamily: selectedFontOption.family }}>
                        <div className="text-[#C9A84C] text-xl font-bold mb-1">
                            {selectedFontOption.preview}
                        </div>
                        <div className="text-gray-400 text-sm mb-2">
                            COMPLETE YOUR DAILY QUEST
                        </div>

                        {/* Fake XP Bar */}
                        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
                            <div
                                className="bg-[#C9A84C] h-full rounded transition-all duration-500"
                                style={{ width: '66.6%' }}
                            ></div>
                        </div>
                        <div className="text-[#C9A84C] text-xs mt-1">
                            2490 XP · LV 25
                        </div>
                    </div>
                </div>

                {/* Font List */}
                <div className="flex-1 space-y-2 mb-6">
                    {FONT_OPTIONS.map((font) => (
                        <button
                            key={font.id}
                            onClick={() => handleSelect(font.id)}
                            className={`w-full text-left border rounded-xl p-4 flex items-center justify-between transition-all ${selectedFont === font.id
                                    ? 'border-[#C9A84C]/50 bg-[#C9A84C]/5'
                                    : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'
                                }`}
                        >
                            <div>
                                <div
                                    className="text-[#E8E8E8] text-sm font-bold"
                                    style={{ fontFamily: font.family }}
                                >
                                    {font.label}
                                </div>
                                <div className="text-gray-500 font-mono text-[10px] uppercase mt-0.5">
                                    {font.desc}
                                </div>
                            </div>
                            <div>
                                {selectedFont === font.id ? (
                                    <div className="w-3 h-3 rounded-full bg-[#C9A84C] border border-[#C9A84C]" />
                                ) : (
                                    <div className="w-3 h-3 rounded-full border border-gray-600" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Apply Button */}
                <div className="mt-auto">
                    {saved && (
                        <div className="border border-green-500 bg-green-500/10 rounded p-2 text-green-400 font-mono text-xs text-center mb-2">
                            ✓ FONT APPLIED SYSTEM-WIDE
                        </div>
                    )}

                    <button
                        onClick={handleApply}
                        disabled={saving || saved}
                        className="w-full font-bold py-3 rounded text-sm bg-[#C9A84C] text-black transition-opacity disabled:opacity-50"
                        style={{ fontFamily: selectedFontOption.family }}
                    >
                        {saving ? "APPLYING..." : "APPLY FONT"}
                    </button>
                </div>
            </div>
        </AppShell>
    )
}
