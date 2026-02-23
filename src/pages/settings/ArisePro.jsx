import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'

export default function ArisePro() {
    const navigate = useNavigate()
    const [notified, setNotified] = useState(false)

    const features = [
        "Custom avatar frames",
        "Exclusive hunter titles",
        "1.5x XP multiplier",
        "Legendary rank ceremonies",
        "Priority System access"
    ]

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[#080810] flex flex-col px-4 text-center">
                {/* Header */}
                <div className="py-6 flex items-start">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← SETTINGS
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    <div className="text-[#C9A84C] text-6xl drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">◆</div>
                    <h1 className="text-[#C9A84C] font-mono text-2xl font-bold mt-4 tracking-tighter italic">ARISE PRO</h1>
                    <div className="text-gray-600 font-mono text-[10px] mt-2 tracking-[0.4em] uppercase">COMING SOON</div>

                    <div className="w-full border border-[#C9A84C]/20 bg-[#0D1117]/30 rounded-2xl p-6 mt-10 text-left">
                        <div className="text-[#C9A84C] font-mono text-[10px] font-bold mb-4 uppercase tracking-widest border-b border-[#C9A84C]/10 pb-2">PREMIUM UPGRADES</div>
                        <ul className="space-y-3">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="text-[#C9A84C] text-[8px]">◆</span>
                                    <span className="font-mono text-[11px] text-gray-400 uppercase tracking-tight">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="w-full mt-10">
                        {notified ? (
                            <div className="border border-green-900/30 bg-green-950/10 rounded py-3 text-green-500 font-mono text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                YOU WILL BE NOTIFIED
                            </div>
                        ) : (
                            <button
                                onClick={() => setNotified(true)}
                                className="w-full border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/5 font-mono text-[10px] font-bold py-4 rounded-lg transition-all active:scale-[0.98] tracking-widest uppercase"
                            >
                                NOTIFY ME
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
