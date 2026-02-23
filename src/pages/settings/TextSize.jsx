import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppShell } from '../../components/AppShell'

export default function TextSize() {
    const navigate = useNavigate()
    const [selectedSize, setSelectedSize] = useState('normal')
    const [saving, setSaving] = useState(false)
    const [initialSize, setInitialSize] = useState('normal')

    const sizeOptions = [
        {
            id: 'small',
            label: 'SMALL',
            desc: 'Compact, more content visible',
            previewSize: 'text-xs',
            scaleClass: 'text-xs'
        },
        {
            id: 'normal',
            label: 'NORMAL',
            desc: 'Default system size',
            previewSize: 'text-sm',
            scaleClass: 'text-sm'
        },
        {
            id: 'large',
            label: 'LARGE',
            desc: 'Easier to read',
            previewSize: 'text-base',
            scaleClass: 'text-base'
        },
        {
            id: 'xlarge',
            label: 'EXTRA LARGE',
            desc: 'Maximum readability',
            previewSize: 'text-lg',
            scaleClass: 'text-lg'
        },
    ]

    useEffect(() => {
        async function loadTextSize() {
            const localSize = localStorage.getItem('arise_text_size')
            if (localSize) {
                setSelectedSize(localSize)
                setInitialSize(localSize)
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('text_size').eq('id', user.id).single()
                if (data?.text_size) {
                    setSelectedSize(data.text_size)
                    setInitialSize(data.text_size)
                }
            }
        }
        loadTextSize()
    }, [])

    const handleApply = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ text_size: selectedSize })
                    .eq('id', user.id)

                if (error) throw error
            }

            localStorage.setItem('arise_text_size', selectedSize)
            document.documentElement.setAttribute('data-text-size', selectedSize)

            setTimeout(() => {
                navigate('/settings')
            }, 1000)
        } catch (err) {
            console.error('Error saving text size:', err)
        } finally {
            setSaving(false)
        }
    }

    const currentSizeOption = sizeOptions.find(o => o.id === selectedSize) || sizeOptions[1]

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
                        <h1 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest">TEXT SIZE</h1>
                        <p className="text-gray-600 font-mono text-[9px] tracking-widest mt-0.5">CHOOSE DISPLAY SIZE</p>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="border border-[#C9A84C]/30 bg-[#0D1117] rounded-xl p-6 mb-8">
                    <div className="text-gray-600 font-mono text-[10px] uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">LIVE PREVIEW</div>

                    <div className="space-y-1">
                        <div className={`${currentSizeOption.previewSize} text-[#C9A84C] font-mono font-bold italic transition-all duration-200`}>
                            C-RANK HUNTER
                        </div>
                        <div className={`${currentSizeOption.previewSize} text-gray-400 font-mono transition-all duration-200`}>
                            Complete your daily quest to earn XP
                        </div>
                    </div>

                    <div className="mt-6 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#C9A84C] w-3/5 h-full rounded-full shadow-[0_0_10px_#C9A84C44]"></div>
                    </div>
                </div>

                {/* Scale Options */}
                <div className="flex-1 space-y-3">
                    {sizeOptions.map((option) => {
                        const isSelected = selectedSize === option.id
                        return (
                            <button
                                key={option.id}
                                onClick={() => setSelectedSize(option.id)}
                                className={`w-full p-4 flex items-center justify-between rounded-lg transition-all duration-200 ${isSelected
                                        ? 'border border-[#C9A84C]/50 bg-[#C9A84C]/5'
                                        : 'border border-gray-800 bg-[#0D1117] hover:border-gray-700'
                                    }`}
                            >
                                <div className="text-left">
                                    <div className={`${option.previewSize} font-mono font-bold ${isSelected ? 'text-[#C9A84C]' : 'text-[#E8E8E8]'} uppercase`}>
                                        {option.label}
                                    </div>
                                    <div className="text-gray-600 font-mono text-[10px] mt-0.5 uppercase">{option.desc}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                        ? 'border-[#C9A84C]'
                                        : 'border-gray-800'
                                    }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]"></div>}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Apply Button */}
                <div className="mt-8">
                    <button
                        onClick={handleApply}
                        disabled={saving || selectedSize === initialSize}
                        className="w-full bg-[#C9A84C] disabled:bg-[#C9A84C]/50 text-black font-mono font-bold py-4 rounded text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
                    >
                        {saving ? "APPLYING..." : "APPLY TEXT SIZE"}
                    </button>
                </div>
            </div>
        </AppShell>
    )
}
