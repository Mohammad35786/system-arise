import React, { useState, useEffect, useRef } from 'react'

export function TaskCompleteScreen({
    taskName,
    taskType,
    xpEarned,
    reward,
    onContinue,
    progressionTarget,
    progressionUnit,
    progressionTomorrow,
    progressionIsLastDay,
    progressionCurrentDay,
    progressionTotalDays,
    progressionStart,
}) {
    const [phase, setPhase] = useState(0)
    const [counter, setCounter] = useState(0)
    const [showLightning, setShowLightning] = useState(false)
    const hasCalledContinue = useRef(false)

    // Optional: generate a reward object in useEffect if one isn't passed?
    // For now we assume Home passes it. If not, we just show XP.

    const motivations = [
        "KEEP GOING. THE SYSTEM IS WATCHING.",
        "ONE FROG DOWN. MORE AWAIT.",
        "DISCIPLINE COMPOUNDS DAILY.",
        "ANOTHER BRICK LAID.",
        "CONSISTENT ACTION WINS.",
        "SMALL WINS BUILD EMPIRES.",
        "YOU SHOWED UP. THAT IS EVERYTHING.",
        "FORWARD. ALWAYS FORWARD.",
        "THE WEAK REST. YOU CONQUER.",
        "TODAY'S EFFORT IS TOMORROW'S RESULT.",
    ]
    const [motivation] = useState(() => motivations[Math.floor(Math.random() * motivations.length)])

    useEffect(() => {
        // Phase 0: Start (Black)
        // Phase 1: Edge Lightning (replaces white flash)
        const t1 = setTimeout(() => {
            setPhase(1)
            setShowLightning(true)
        }, 150)
        // Phase 2: Symbol Drop — turn off lightning
        const t2 = setTimeout(() => {
            setPhase(2)
            setShowLightning(false)
        }, 500)
        // Phase 3: Name Fade In
        const t3 = setTimeout(() => setPhase(3), 1100)
        // Phase 4: XP Count
        const t4 = setTimeout(() => setPhase(4), 1700)
        // Phase 5: Reward Card
        const t5 = setTimeout(() => setPhase(5), 2500)
        // Phase 6: Motivation
        const t6 = setTimeout(() => setPhase(6), 3800)
        // Phase 7: Continue prompt
        const t7 = setTimeout(() => setPhase(7), 4800)

        // Auto close
        const tAuto = setTimeout(() => {
            if (!hasCalledContinue.current) {
                hasCalledContinue.current = true
                onContinue()
            }
        }, 8000)

        return () => {
            [t1, t2, t3, t4, t5, t6, t7, tAuto].forEach(clearTimeout)
        }
    }, [onContinue])

    useEffect(() => {
        if (phase >= 4) {
            let start = 0
            const duration = 1000
            const step = (timestamp) => {
                if (!start) start = timestamp
                const progress = Math.min((timestamp - start) / duration, 1)
                // Ease out
                const ease = 1 - Math.pow(1 - progress, 3)
                setCounter(Math.floor(ease * xpEarned))
                if (progress < 1) window.requestAnimationFrame(step)
            }
            window.requestAnimationFrame(step)
        }
    }, [phase, xpEarned])

    const typeColor = taskType === 'habit' ? '#4ADE80' :
        taskType === 'frog' ? '#C9A84C' :
            taskType === 'slice' ? '#A78BFA' : '#C9A84C'

    const symbol = taskType === 'habit' ? '◈' :
        taskType === 'frog' ? '⚔' :
            taskType === 'slice' ? '◆' : '⚔'

    const isLegendary = reward?.rarity === 'LEGENDARY'
    const hasProgressionData = progressionTarget != null
    const unitLabel = (progressionUnit || 'reps').toUpperCase()

    return (
        <div
            onClick={() => {
                if (phase >= 5) {
                    if (!hasCalledContinue.current) {
                        hasCalledContinue.current = true
                        onContinue()
                    }
                }
            }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#000000' }}
        >
            {/* Edge Lightning Effect */}
            {/* Top edge */}
            <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(90deg, transparent, #F97316, #C9A84C, #F97316, transparent)',
                    boxShadow: '0 0 20px #F97316, 0 0 40px #F97316',
                    opacity: showLightning ? 1 : 0,
                    animation: showLightning ? 'lightningFlicker 350ms ease-in-out' : 'none',
                }}
            />
            {/* Bottom edge */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(90deg, transparent, #F97316, #C9A84C, #F97316, transparent)',
                    boxShadow: '0 0 20px #F97316, 0 0 40px #F97316',
                    opacity: showLightning ? 1 : 0,
                    animation: showLightning ? 'lightningFlicker 350ms ease-in-out' : 'none',
                }}
            />
            {/* Left edge */}
            <div
                className="absolute top-0 bottom-0 left-0 w-1 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(180deg, transparent, #F97316, #C9A84C, #F97316, transparent)',
                    boxShadow: '0 0 20px #F97316, 0 0 40px #F97316',
                    opacity: showLightning ? 1 : 0,
                    animation: showLightning ? 'lightningFlicker 350ms ease-in-out' : 'none',
                }}
            />
            {/* Right edge */}
            <div
                className="absolute top-0 bottom-0 right-0 w-1 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(180deg, transparent, #F97316, #C9A84C, #F97316, transparent)',
                    boxShadow: '0 0 20px #F97316, 0 0 40px #F97316',
                    opacity: showLightning ? 1 : 0,
                    animation: showLightning ? 'lightningFlicker 350ms ease-in-out' : 'none',
                }}
            />

            {/* Phase 2: Symbol */}
            {phase >= 2 && (
                <div className={`text-9xl font-bold mb-8 animate-[symbolDrop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]`}
                    style={{ color: typeColor, textShadow: `0 0 30px ${typeColor}44` }}>
                    {symbol}
                </div>
            )}

            {/* Phase 3: Name */}
            <div className="h-16 flex items-center justify-center px-8 text-center max-w-2xl">
                {phase >= 3 && (
                    <p className="text-white font-mono text-xl animate-[fadeIn_0.5s_ease-out] line-clamp-2">
                        {taskName.toUpperCase()}
                    </p>
                )}
            </div>

            {/* Phase 4: XP */}
            <div className="h-16 flex items-center justify-center">
                {phase >= 4 && (
                    <p className="text-[#C9A84C] font-mono text-5xl font-bold animate-[scaleUp_0.3s_ease-out] drop-shadow-[0_0_10px_rgba(201,168,76,0.5)]">
                        +{counter} XP
                    </p>
                )}
            </div>

            {/* Phase 5: Reward Card */}
            <div className="h-48 w-full flex items-center justify-center mt-8">
                {phase >= 5 && reward && (
                    <div className={`relative px-8 py-6 rounded-xl border-2 bg-[#0D1117] transform transition-all animate-[slideUp_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]`}
                        style={{
                            borderColor: reward.rarity === 'COMMON' ? '#6B7280' :
                                reward.rarity === 'RARE' ? '#3B82F6' :
                                    reward.rarity === 'EPIC' ? '#A855F7' :
                                        '#EAB308',
                            boxShadow: `0 0 20px ${reward.rarity === 'LEGENDARY' ? '#EAB30844' : 'transparent'}`
                        }}>

                        {/* Legendary Particles */}
                        {isLegendary && (
                            <>
                                {[...Array(10)].map((_, i) => (
                                    <div key={i}
                                        className="absolute bg-[#C9A84C] rounded-full animate-particle opacity-0"
                                        style={{
                                            width: Math.random() * 4 + 2 + 'px',
                                            height: Math.random() * 4 + 2 + 'px',
                                            left: Math.random() * 100 + '%',
                                            top: Math.random() * 100 + '%',
                                            animationDelay: Math.random() * 2 + 's',
                                            animationDuration: Math.random() * 2 + 1 + 's'
                                        }}
                                    />
                                ))}
                            </>
                        )}

                        <div className="flex flex-col items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5"
                                style={{ color: reward.rarity === 'LEGENDARY' ? '#EAB308' : 'white' }}>
                                {reward.rarity} LOOT
                            </span>
                            <div className="text-3xl mt-2">{reward.icon}</div>
                            <p className="text-[#E8E8E8] font-mono text-sm font-bold">{reward.label}</p>
                            {reward.type === 'QUOTE' && (
                                <p className="text-gray-400 font-mono text-xs italic max-w-xs text-center mt-2">"{reward.value}"</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Phase 6: Motivation */}
            <div className="h-8 mt-8">
                {phase >= 6 && (
                    <p className="text-gray-500 font-mono text-xs tracking-[0.2em] animate-[fadeIn_1s_ease-out]">
                        {motivation}
                    </p>
                )}
            </div>

            {phase >= 6 && hasProgressionData && (
                <div className="w-full max-w-md mt-4">
                    {!progressionIsLastDay ? (
                        <div className="border border-[#C9A84C]/30 rounded-lg p-3 mx-4 bg-[#0D1117]">
                            <p className="text-[#C9A84C] font-mono text-xs font-bold mb-1">
                                DAY {progressionCurrentDay || 1} OF {progressionTotalDays || 1} COMPLETE
                            </p>
                            <p className="text-[#C9A84C] font-mono text-sm mb-3">
                                {progressionTarget} {unitLabel} CONQUERED
                            </p>
                            <p className="text-gray-500 font-mono text-xs mb-1">TOMORROW THE SYSTEM DEMANDS:</p>
                            <p className="text-[#C9A84C] font-mono text-2xl font-bold">
                                {progressionTomorrow ?? progressionTarget} {unitLabel}
                            </p>
                        </div>
                    ) : (
                        <div className="border-2 border-[#C9A84C] rounded-lg p-4 mx-4 bg-[#0D1117]">
                            <p className="text-[#C9A84C] font-mono text-sm font-bold text-center animate-pulse mb-3">
                                PROGRESSION COMPLETE
                            </p>
                            <p className="text-[#C9A84C] font-mono text-xs text-center">YOU HAVE REACHED YOUR TARGET</p>
                            <p className="text-[#C9A84C] font-mono text-sm text-center my-2">
                                {(progressionStart ?? progressionTarget)} to {progressionTarget} {unitLabel}
                            </p>
                            <p className="text-[#C9A84C] font-mono text-xs text-center">IRON WILL UNLOCKED</p>
                        </div>
                    )}
                </div>
            )}

            {/* Phase 7: Continue */}
            <div className="absolute bottom-12">
                {phase >= 7 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!hasCalledContinue.current) {
                                hasCalledContinue.current = true
                                onContinue()
                            }
                        }}
                        className="animate-[pulse_2s_infinite] text-[#C9A84C] font-mono text-sm border border-[#C9A84C] px-6 py-2 rounded hover:bg-[#C9A84C] hover:text-black transition-colors"
                    >
                        → BACK TO COMMAND
                    </button>
                )}
            </div>

            <style>{`
                @keyframes symbolDrop {
                    0% { transform: translateY(-100px) scale(0.5); opacity: 0; }
                    60% { transform: translateY(20px) scale(1.1); opacity: 1; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes slideUp {
                    0% { transform: translateY(100px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes particle {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(-100px) translateX(var(--drift)); opacity: 0; }
                }
                @keyframes lightningFlicker {
                    0% { opacity: 1; }
                    40% { opacity: 0.3; }
                    70% { opacity: 1; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
