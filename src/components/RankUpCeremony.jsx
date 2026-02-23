import { useState, useEffect } from 'react'

const RANK_CONFIG = {
    D: { color: '#60A5FA', title: 'DORMANT HUNTER', message: 'Your power stirs. The dungeon notices.' },
    C: { color: '#4ADE80', title: 'RISING HUNTER', message: 'Clarity confirmed. New gates are opening.' },
    B: { color: '#C084FC', title: 'CONFIRMED HUNTER', message: 'The System has verified your strength.' },
    A: { color: '#C9A84C', title: 'ELITE HUNTER', message: 'Few reach this rank. The System bows.' },
    S: { color: '#ffffff', title: 'SHADOW MONARCH', message: 'You stand alone. None above you remain.' },
}

export function RankUpCeremony({ newRank, oldRank, onContinue }) {
    const [phase, setPhase] = useState(0)
    const [flash, setFlash] = useState(false)
    const [particles, setParticles] = useState([])

    const config = RANK_CONFIG[newRank] || RANK_CONFIG['D']

    useEffect(() => {
        // Phase 1 (300ms): white flash
        const t1 = setTimeout(() => {
            setFlash(true)
            setTimeout(() => setFlash(false), 200)
            setPhase(1)
        }, 300)

        // Phase 2 (700ms): old rank fades
        const t2 = setTimeout(() => setPhase(2), 700)

        // Phase 3 (1200ms): RANK UP text
        const t3 = setTimeout(() => setPhase(3), 1200)

        // Phase 4 (1800ms): new rank letter
        const t4 = setTimeout(() => setPhase(4), 1800)

        // Phase 5 (2600ms): title + message
        const t5 = setTimeout(() => setPhase(5), 2600)

        // Phase 6 (3500ms): particles
        const t6 = setTimeout(() => {
            setPhase(6)
            setParticles(
                Array.from({ length: 30 }, (_, i) => ({
                    id: i,
                    x: (Math.random() - 0.5) * 400,
                    y: -(Math.random() * 400 + 50),
                    rotation: Math.random() * 720 - 360,
                    color: i % 3 === 0 ? config.color : (i % 3 === 1 ? '#C9A84C' : '#ffffff'),
                    size: Math.random() * 8 + 4,
                }))
            )
        }, 3500)

        // Phase 7 (4500ms): tap to continue
        const t7 = setTimeout(() => setPhase(7), 4500)

        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
            clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); clearTimeout(t7)
        }
    }, [config.color])

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: '#000000' }}
            onClick={phase >= 7 ? onContinue : undefined}
        >
            {/* White flash */}
            <div
                className="fixed inset-0 pointer-events-none transition-opacity duration-200"
                style={{ background: '#ffffff', opacity: flash ? 1 : 0, zIndex: 60 }}
            />

            {/* Particles */}
            {phase >= 6 && particles.map(p => (
                <div
                    key={p.id}
                    className="fixed rounded-full pointer-events-none"
                    style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: p.color,
                        left: '50%',
                        top: '50%',
                        opacity: 0,
                        transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
                        transition: 'transform 1.5s ease-out, opacity 1.5s ease-out',
                        zIndex: 55,
                    }}
                />
            ))}

            <div className="flex flex-col items-center justify-center gap-4 px-6 text-center w-full max-w-xs">

                {/* Phase 2: old rank fades out */}
                <div
                    className="transition-all duration-500"
                    style={{ opacity: phase === 2 ? 0.3 : phase < 2 ? 0 : 0, transform: phase >= 2 ? 'scale(0.5)' : 'scale(1)' }}
                >
                    <p className="text-gray-400 font-mono text-6xl font-bold">{oldRank}</p>
                </div>

                {/* Phase 3: RANK UP text */}
                <div
                    className="transition-all duration-500"
                    style={{
                        opacity: phase >= 3 ? 1 : 0,
                        transform: phase >= 3 ? 'scale(1)' : 'scale(0.5)',
                    }}
                >
                    <p className="text-[#C9A84C] font-mono text-3xl font-bold tracking-[0.3em]">
                        RANK UP
                    </p>
                </div>

                {/* Phase 4: new rank big letter */}
                <div
                    className="transition-all duration-700 ease-out"
                    style={{
                        opacity: phase >= 4 ? 1 : 0,
                        transform: phase >= 4 ? 'translateY(0) scale(1)' : 'translateY(-100px) scale(0.3)',
                    }}
                >
                    <p
                        className="font-mono font-bold"
                        style={{
                            fontSize: '120px',
                            lineHeight: 1,
                            color: config.color,
                            textShadow: `0 0 60px ${config.color}, 0 0 120px ${config.color}88`,
                        }}
                    >
                        {newRank}
                    </p>
                </div>

                {/* Phase 5: title + message */}
                <div
                    className="transition-all duration-700"
                    style={{ opacity: phase >= 5 ? 1 : 0, transform: phase >= 5 ? 'translateY(0)' : 'translateY(20px)' }}
                >
                    <p className="font-mono text-xl font-bold" style={{ color: config.color }}>
                        {config.title}
                    </p>
                    <p className="text-gray-400 font-mono text-sm mt-2 leading-relaxed">
                        {config.message}
                    </p>
                </div>

                {/* Phase 7: tap to continue */}
                {phase >= 7 && (
                    <p className="text-gray-500 font-mono text-xs animate-pulse tracking-widest mt-4">
                        TAP TO CONTINUE →
                    </p>
                )}
            </div>
        </div>
    )
}
