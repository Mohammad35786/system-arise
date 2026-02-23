import { useState, useEffect } from 'react'
import { RARITY_CONFIG } from '../lib/rewardEngine'

const FLOAT_STYLE = `
@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-90vh) scale(0.5); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}
@keyframes pulse-gold {
  0%, 100% { text-shadow: 0 0 10px #C9A84C; }
  50% { text-shadow: 0 0 30px #C9A84C, 0 0 50px #C9A84C; }
}
@keyframes glow-expand {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2); opacity: 0; }
}
`

export function GiftBoxCeremony({ reward, onComplete }) {
    const [phase, setPhase] = useState(0) // 0: box, 1: shaking, 2: opening, 3: reveal
    const [particles, setParticles] = useState([])
    
    const rarityConfig = RARITY_CONFIG[reward?.rarity] || RARITY_CONFIG.COMMON

    useEffect(() => {
        // Phase 1: shake (500ms)
        const t1 = setTimeout(() => setPhase(1), 500)
        
        // Phase 2: opening (1500ms)  
        const t2 = setTimeout(() => setPhase(2), 1500)
        
        // Phase 3: reveal (2500ms)
        const t3 = setTimeout(() => {
            setPhase(3)
            // Generate particles for legendary
            if (reward?.rarity === 'LEGENDARY') {
                const newParticles = Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    left: `${Math.random() * 100}%`,
                    duration: `${2 + Math.random() * 2}s`,
                    delay: `${Math.random()}s`,
                    color: i % 2 === 0 ? '#C9A84C' : (rarityConfig.color || '#C9A84C'),
                }))
                setParticles(newParticles)
            }
        }, 2500)

        // Phase 4: complete (5000ms)
        const t4 = setTimeout(() => onComplete?.(), 5000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [])

    function getRewardIcon() {
        if (!reward) return '🎁'
        if (reward.type === 'XP' || reward.type === 'XP_BONUS') return '⚡'
        if (reward.type === 'STREAK' || reward.type === 'STREAK_BOOST') return '🔥'
        if (reward.type === 'AVATAR') return '◈'
        if (reward.type === 'QUOTE') return '❝'
        return '🎁'
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: '#080810' }}
        >
            <style>{FLOAT_STYLE}</style>

            {/* Particles */}
            {phase >= 3 && particles.map(p => (
                <div
                    key={p.id}
                    className="fixed w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{
                        background: p.color,
                        left: p.left,
                        bottom: '0',
                        animation: `floatUp ${p.duration} ${p.delay} ease-out forwards`,
                        zIndex: 55,
                    }}
                />
            ))}

            <div className="flex flex-col items-center justify-center gap-6 px-6 w-full max-w-sm">
                
                {/* Title */}
                <p className="text-[#C9A84C] font-mono text-xl font-bold tracking-widest">
                    GIFT BOX UNLOCKED
                </p>
                <p className="text-gray-500 font-mono text-xs">
                    CERTIFICATE REWARD
                </p>

                {/* Gift Box */}
                <div className="relative">
                    {/* Glow effect */}
                    <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: rarityConfig.color,
                            filter: 'blur(40px)',
                            opacity: phase >= 2 ? 0.3 : 0,
                            transition: 'opacity 0.5s'
                        }}
                    />
                    
                    {/* Box */}
                    <div 
                        className="text-8xl transition-all duration-300"
                        style={{
                            transform: phase === 1 
                                ? 'translateX(-5px) rotate(-5deg)' 
                                : phase === 2 
                                    ? 'translateX(5px) rotate(5deg)' 
                                    : 'scale(1.2)',
                            animation: phase === 1 ? 'shake 0.3s infinite' : 'none',
                        }}
                    >
                        {phase >= 3 ? '✨' : '🎁'}
                    </div>
                </div>

                {/* Reward Reveal */}
                {phase >= 3 && reward && (
                    <div
                        className="w-full rounded-xl p-6 border transition-all duration-700 ease-out"
                        style={{
                            borderColor: rarityConfig.color,
                            background: rarityConfig.bg,
                            boxShadow: rarityConfig.glow,
                        }}
                    >
                        {/* Rarity pill */}
                        <div className="flex justify-center mb-3">
                            <span
                                className="font-mono text-xs px-3 py-0.5 rounded-full border animate-pulse"
                                style={{ color: rarityConfig.color, borderColor: rarityConfig.color }}
                            >
                                {rarityConfig.label}
                            </span>
                        </div>

                        {/* Icon */}
                        <div className="text-center mb-3">
                            <span
                                className="font-mono"
                                style={{ fontSize: '48px', color: reward.type === 'AVATAR' ? '#C9A84C' : 'inherit' }}
                            >
                                {getRewardIcon()}
                            </span>
                        </div>

                        {/* Label */}
                        <p
                            className="font-mono font-bold text-lg text-center mb-2"
                            style={{ color: rarityConfig.color }}
                        >
                            {reward.label}
                        </p>

                        {/* Description */}
                        {reward.description && (
                            <p className="text-gray-400 font-mono text-xs text-center">
                                {reward.description}
                            </p>
                        )}

                        {/* Value display */}
                        {(reward.type === 'XP' || reward.type === 'XP_BONUS') && reward.value && (
                            <p className="text-[#C9A84C] font-mono text-2xl font-bold text-center mt-3">
                                +{reward.value} XP
                            </p>
                        )}
                        {(reward.type === 'STREAK' || reward.type === 'STREAK_BOOST') && reward.value && (
                            <p className="text-[#F97316] font-mono text-2xl font-bold text-center mt-3">
                                +{reward.value} DAYS
                            </p>
                        )}
                    </div>
                )}

                {/* Complete message */}
                {phase >= 3 && (
                    <p className="text-gray-500 font-mono text-xs animate-pulse tracking-widest mt-4">
                        TAP TO CONTINUE →
                    </p>
                )}
            </div>
        </div>
    )
}
