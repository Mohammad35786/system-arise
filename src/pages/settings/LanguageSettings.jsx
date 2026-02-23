import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppShell } from '../../components/AppShell'

export default function LanguageSettings() {
    const navigate = useNavigate()
    const [selectedLanguage, setSelectedLanguage] = useState('English')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [initialLanguage, setInitialLanguage] = useState('English')

    const languages = [
        { code: 'en', label: 'English', native: 'English' },
        { code: 'bn', label: 'Bengali', native: 'বাংলা' },
        { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
        { code: 'ar', label: 'Arabic', native: 'العربية' },
        { code: 'es', label: 'Spanish', native: 'Español' },
        { code: 'fr', label: 'French', native: 'Français' },
        { code: 'tr', label: 'Turkish', native: 'Türkçe' },
        { code: 'pt', label: 'Portuguese', native: 'Português' },
    ]

    useEffect(() => {
        async function loadLanguage() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('language').eq('id', user.id).single()
                if (data?.language) {
                    setSelectedLanguage(data.language)
                    setInitialLanguage(data.language)
                }
            }
        }
        loadLanguage()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ language: selectedLanguage })
                    .eq('id', user.id)

                if (error) throw error

                localStorage.setItem('arise_language', selectedLanguage)
                setSaved(true)
                setTimeout(() => {
                    navigate('/settings')
                }, 2000)
            }
        } catch (err) {
            console.error('Error saving language:', err)
        } finally {
            setSaving(false)
        }
    }

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
                        <h1 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest">LANGUAGE</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-widest mt-0.5">SELECT YOUR LANGUAGE</p>
                    </div>
                </div>

                {/* Info Card */}
                <div className="border border-gray-800 rounded p-4 bg-[#0D1117] mb-6">
                    <p className="font-mono text-[10px] text-gray-500 leading-relaxed uppercase">
                        Full translation coming soon. Your preference will be saved for when translations are available.
                    </p>
                </div>

                {/* Language List */}
                <div className="flex-1 space-y-2 mb-8">
                    {languages.map((lang) => {
                        const isEnglish = lang.code === 'en'
                        const isSelected = selectedLanguage === lang.label

                        return (
                            <button
                                key={lang.code}
                                onClick={() => isEnglish && setSelectedLanguage(lang.label)}
                                className={`w-full p-4 flex items-center justify-between rounded-lg transition-all duration-200 ${isSelected
                                        ? 'border border-[#C9A84C]/50 bg-[#C9A84C]/5'
                                        : 'border border-gray-800 bg-[#0D1117] hover:border-gray-700'
                                    } ${!isEnglish ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="text-left">
                                    <div className="text-[#E8E8E8] font-mono text-xs font-bold uppercase">{lang.label}</div>
                                    <div className="text-gray-600 font-mono text-[10px] mt-0.5">{lang.native}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEnglish ? (
                                        <>
                                            {isSelected && (
                                                <span className="text-green-500 font-mono text-[10px] font-bold mr-2">ACTIVE</span>
                                            )}
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected
                                                    ? 'border-[#C9A84C] bg-[#C9A84C]'
                                                    : 'border-gray-700'
                                                }`}>
                                                {isSelected && (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-[#C9A84C]/30 rounded bg-[#C9A84C]/10">
                                            <span className="text-[#C9A84C] font-mono text-[9px] font-bold">◆ PRO</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Info Card Instead of Save Button */}
                <div className="sticky bottom-4 space-y-3">
                    <div className="border border-[#C9A84C]/30 rounded-lg p-3 bg-[#C9A84C]/5">
                        <div className="text-[#C9A84C] font-mono text-xs font-bold text-center uppercase tracking-wider">
                            ◆ More languages coming with ARISE PRO
                        </div>
                        <div className="text-gray-500 font-mono text-[10px] text-center mt-1 uppercase leading-tight">
                            Upgrade to unlock Bengali, Hindi, Arabic<br />and 5 more languages
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
