import { useState, useEffect, useRef } from 'react'
import { RARITY_CONFIG, rollReward } from '../lib/rewardEngine'
import { supabase } from '../lib/supabase'
import { GiftBoxCeremony } from './GiftBoxCeremony'

const FLOAT_STYLE = `
@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-90vh) scale(0.5); }
}
@keyframes pulse-gold {
  0%, 100% { text-shadow: 0 0 10px #C9A84C; }
  50% { text-shadow: 0 0 30px #C9A84C, 0 0 50px #C9A84C; }
}
`

export function SliceCompleteScreen({ slice, syllabus, reward, baseXP, isLastSlice, onContinue, userId }) {
    const [phase, setPhase] = useState(0)
    const [flash, setFlash] = useState(false)
    const [xpCount, setXpCount] = useState(0)
    const [cardVisible, setCardVisible] = useState(false)
    const [canContinue, setCanContinue] = useState(false)
    
    // Certificate flow state
    const [showCertificatePrompt, setShowCertificatePrompt] = useState(false)
    const [certificatePhase, setCertificatePhase] = useState('prompt') // prompt, upload, scanning, verified, gift
    const [certificateTitle, setCertificateTitle] = useState('')
    const [certificateIssuer, setCertificateIssuer] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [giftReward, setGiftReward] = useState(null)
    const fileInputRef = useRef(null)

    const rarityConfig = RARITY_CONFIG[reward?.rarity] || RARITY_CONFIG.COMMON

    // Orchestrate phases
    useEffect(() => {
        // Phase 1: white flash (200ms)
        const t1 = setTimeout(() => {
            setFlash(true)
            setTimeout(() => setFlash(false), 150)
            setPhase(1)
        }, 200)

        // Phase 2: slice consumed text (600ms)
        const t2 = setTimeout(() => setPhase(2), 600)

        // Phase 3: XP counter (1800ms)
        const t3 = setTimeout(() => {
            setPhase(3)
            let count = 0
            const interval = setInterval(() => {
                count += 5
                setXpCount(count)
                if (count >= baseXP) {
                    setXpCount(baseXP)
                    clearInterval(interval)
                }
            }, 40)
        }, 1800)

        // Phase 4: reward card (3200ms)
        const t4 = setTimeout(() => {
            setPhase(4)
            setTimeout(() => {
                setCardVisible(true)
                setCanContinue(true)
            }, 100)
        }, 3200)

        // Phase 5: final message (4800ms)
        const t5 = setTimeout(() => setPhase(5), 4800)

        // Phase 6: tap to continue (6000ms)
        const t6 = setTimeout(() => setPhase(6), 6000)

        // Show certificate prompt after phase 6
        const t7 = setTimeout(() => setShowCertificatePrompt(true), 6500)

        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
            clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
            clearTimeout(t7)
        }
    }, [baseXP])

    function getRewardIcon() {
        if (!reward) return '⚡'
        if (reward.type === 'XP') return '⚡'
        if (reward.type === 'STREAK') return '🔥'
        if (reward.type === 'AVATAR') return '◈'
        if (reward.type === 'QUOTE') return '❝'
        return '⚡'
    }

    const particles = reward?.rarity === 'LEGENDARY'
        ? Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            duration: `${2 + Math.random() * 2}s`,
            delay: `${Math.random()}s`,
            color: i % 2 === 0 ? '#C9A84C' : (rarityConfig.color || '#C9A84C'),
        }))
        : []

    function handleContinue() {
        if (!showCertificatePrompt) {
            onContinue?.()
        }
    }

    async function handleUploadCertificate() {
        if (!selectedFile || !certificateTitle.trim()) return
        
        setCertificatePhase('scanning')
        
        try {
            // 1. Upload file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${userId}/${Date.now()}.${fileExt}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(fileName, selectedFile)
            
            if (uploadError) throw uploadError
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName)
            
            // 2. Insert into certificates table
            const { error: dbError } = await supabase
                .from('certificates')
                .insert({
                    user_id: userId,
                    title: certificateTitle.trim(),
                    issuer: certificateIssuer.trim(),
                    domain: syllabus?.domain || 'general',
                    file_url: publicUrl,
                    created_at: new Date().toISOString()
                })
            
            if (dbError) throw dbError
            
            // 3. Increment certificates_count in profiles
            const { error: profileError } = await supabase.rpc('increment_certificates_count', {
                user_id: userId
            })
            
            // If RPC doesn't exist, try direct update
            if (profileError) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('certificates_count')
                    .eq('id', userId)
                    .single()
                
                await supabase
                    .from('profiles')
                    .update({ certificates_count: (profile?.certificates_count || 0) + 1 })
                    .eq('id', userId)
            }
            
            // 4. Scanning animation (1.5s)
            setTimeout(() => {
                setCertificatePhase('verified')
                
                // 5. Show verified for 0.5s then gift box
                setTimeout(() => {
                    const newReward = rollReward()
                    setGiftReward(newReward)
                    setCertificatePhase('gift')
                }, 500)
                
            }, 1500)
            
        } catch (error) {
            console.error('Certificate upload error:', error)
            // On error, just skip to gift
            const newReward = rollReward()
            setGiftReward(newReward)
            setCertificatePhase('gift')
        }
    }

    function handleSkipCertificate() {
        setShowCertificatePrompt(false)
        onContinue?.()
    }

    function handleGiftComplete() {
        setShowCertificatePrompt(false)
        setCertificatePhase('prompt')
        setCertificateTitle('')
        setCertificateIssuer('')
        setSelectedFile(null)
        setGiftReward(null)
        onContinue?.()
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0]
        if (file) setSelectedFile(file)
    }

    // If showing gift box ceremony
    if (showCertificatePrompt && certificatePhase === 'gift' && giftReward) {
        return <GiftBoxCeremony reward={giftReward} onComplete={handleGiftComplete} />
    }

    // Certificate prompt screen
    if (showCertificatePrompt) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#080810' }}>
                
                {/* Scanning animation */}
                {certificatePhase === 'scanning' && (
                    <div className="text-center">
                        <p className="text-[#C9A84C] font-mono text-xl animate-pulse" style={{ animation: 'pulse-gold 1s infinite' }}>
                            SCANNING CERTIFICATE...
                        </p>
                    </div>
                )}
                
                {/* Verified animation */}
                {certificatePhase === 'verified' && (
                    <div className="text-center">
                        <p className="text-green-500 font-mono text-2xl font-bold">
                            VERIFIED ✓
                        </p>
                    </div>
                )}
                
                {/* Certificate prompt UI */}
                {certificatePhase === 'prompt' && (
                    <>
                        <div className="text-5xl mb-4">🏆</div>
                        <p className="text-[#C9A84C] font-mono text-lg font-bold text-center">PROOF OF MASTERY</p>
                        <p className="text-gray-500 font-mono text-sm text-center px-6 mt-4">
                            Do you have a certificate for this achievement?
                        </p>
                        <p className="text-[#C9A84C] font-mono text-xs text-center mt-2">
                            Upload it to unlock a GIFT BOX reward.
                        </p>
                        
                        <div className="w-full max-w-xs mt-6 space-y-3">
                            <button
                                onClick={() => setCertificatePhase('upload')}
                                className="w-full py-3 font-mono text-sm font-bold"
                                style={{ background: '#C9A84C', color: '#000000' }}
                            >
                                UPLOAD CERTIFICATE
                            </button>
                            <button
                                onClick={handleSkipCertificate}
                                className="w-full py-3 font-mono text-sm border"
                                style={{ borderColor: '#4B5563', color: '#9CA3AF' }}
                            >
                                SKIP
                            </button>
                        </div>
                    </>
                )}
                
                {/* Upload form */}
                {certificatePhase === 'upload' && (
                    <>
                        <p className="text-[#C9A84C] font-mono text-lg font-bold mb-6">UPLOAD CERTIFICATE</p>
                        
                        <div className="w-full max-w-xs space-y-4">
                            {/* Title input */}
                            <div>
                                <label className="text-[#C9A84C] font-mono text-xs">CERTIFICATE TITLE</label>
                                <input
                                    type="text"
                                    value={certificateTitle}
                                    onChange={(e) => setCertificateTitle(e.target.value)}
                                    placeholder="e.g., Python Fundamentals"
                                    className="w-full mt-1 px-3 py-2 bg-transparent border border-[#C9A84C] text-white font-mono text-sm rounded"
                                />
                            </div>
                            
                            {/* Issuer input */}
                            <div>
                                <label className="text-[#C9A84C] font-mono text-xs">ISSUER / INSTITUTION</label>
                                <input
                                    type="text"
                                    value={certificateIssuer}
                                    onChange={(e) => setCertificateIssuer(e.target.value)}
                                    placeholder="e.g., Coursera, Udemy"
                                    className="w-full mt-1 px-3 py-2 bg-transparent border border-[#C9A84C] text-white font-mono text-sm rounded"
                                />
                            </div>
                            
                            {/* File input */}
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-8 border-2 border-dashed border-[#C9A84C] text-[#C9A84C] font-mono text-xs rounded"
                                >
                                    {selectedFile ? selectedFile.name : 'TAP TO SELECT FILE'}
                                </button>
                            </div>
                            
                            {/* Confirm button */}
                            <button
                                onClick={handleUploadCertificate}
                                disabled={!selectedFile || !certificateTitle.trim()}
                                className="w-full py-3 font-mono text-sm font-bold disabled:opacity-50"
                                style={{ background: '#C9A84C', color: '#000000' }}
                            >
                                CONFIRM
                            </button>
                            
                            {/* Back link */}
                            <button
                                onClick={() => setCertificatePhase('prompt')}
                                className="text-gray-500 font-mono text-xs"
                            >
                                ← BACK
                            </button>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: '#000000' }}
            onClick={canContinue ? handleContinue : undefined}
        >
            <style>{FLOAT_STYLE}</style>

            {/* White flash */}
            <div
                className="fixed inset-0 pointer-events-none transition-opacity duration-150"
                style={{ background: '#ffffff', opacity: flash ? 1 : 0, zIndex: 60 }}
            />

            {/* Legendary particles */}
            {reward?.rarity === 'LEGENDARY' && phase >= 4 && particles.map(p => (
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

                {/* Phase 2: Slice consumed */}
                <div
                    className="text-center transition-all duration-700"
                    style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(-16px)' }}
                >
                    <p className="text-[#C9A84C] font-mono text-3xl font-bold tracking-widest">
                        SLICE CONSUMED
                    </p>
                    <p className="text-gray-500 font-mono text-sm mt-1">
                        DAY {slice?.day || 1} — {syllabus?.goal_name || 'GOAL'}
                    </p>
                </div>

                {/* Phase 3: XP counter */}
                <div
                    className="text-center transition-all duration-500"
                    style={{ opacity: phase >= 3 ? 1 : 0 }}
                >
                    <p className="text-[#C9A84C] font-mono font-bold" style={{ fontSize: '72px', lineHeight: 1 }}>
                        +{xpCount}
                    </p>
                    <p className="text-gray-500 font-mono text-xs tracking-widest mt-1">BASE SLICE REWARD</p>
                </div>

                {/* Phase 4: Reward card */}
                {phase >= 4 && reward && (
                    <div
                        className="w-full rounded-xl p-6 border transition-all duration-700 ease-out relative overflow-hidden"
                        style={{
                            borderColor: rarityConfig.color,
                            background: rarityConfig.bg,
                            boxShadow: rarityConfig.glow,
                            transform: cardVisible ? 'translateY(0)' : 'translateY(-200px)',
                            opacity: cardVisible ? 1 : 0,
                        }}
                    >
                        {/* Rarity pill */}
                        <div className="flex justify-center mb-3">
                            <span
                                className="font-mono text-xs px-3 py-0.5 rounded-full border"
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

                        {/* Quote content */}
                        {reward.type === 'QUOTE' && reward.quote && (
                            <div className="text-center mt-2">
                                <p className="text-gray-400 font-mono text-sm italic leading-relaxed">
                                    "{reward.quote}"
                                </p>
                                <p className="text-[#C9A84C] font-mono text-xs mt-2">
                                    — {reward.author}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Phase 5: Final message */}
                {phase >= 5 && (
                    <div
                        className="text-center transition-all duration-700"
                        style={{ opacity: phase >= 5 ? 1 : 0 }}
                    >
                        {isLastSlice ? (
                            <>
                                <p className="text-[#C9A84C] font-mono text-2xl font-bold animate-pulse">
                                    ◆ GOAL COMPLETE ◆
                                </p>
                                <p className="text-white font-mono text-lg mt-1">
                                    {syllabus?.goal_name} — MASTERED
                                </p>
                                <p className="text-[#C9A84C] font-mono text-xl mt-2">+500 BONUS XP</p>
                                <div className="mt-4" style={{ filter: 'drop-shadow(0 0 24px #C9A84C)' }}>
                                    <span className="text-[#C9A84C] font-mono animate-pulse" style={{ fontSize: '96px', lineHeight: 1 }}>
                                        ◆
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-[#C9A84C] font-mono text-xl font-bold">
                                    WORK COMPLETE FOR TODAY
                                </p>
                                <p className="text-gray-500 font-mono text-sm mt-2">
                                    YOUR NEXT SLICE AWAITS TOMORROW
                                </p>
                                <p className="text-gray-600 font-mono text-6xl mt-4">◗</p>
                                <p className="text-gray-600 font-mono text-xs tracking-widest mt-3">
                                    REST. RECOVER. RETURN TOMORROW.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Phase 6: Tap to continue */}
                {phase >= 6 && (
                    <p className="text-gray-500 font-mono text-xs animate-pulse tracking-widest">
                        TAP ANYWHERE TO CONTINUE →
                    </p>
                )}
            </div>
        </div>
    )
}
