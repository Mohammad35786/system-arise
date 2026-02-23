import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { rollReward } from '../lib/rewardEngine'
import { GiftBoxCeremony } from './GiftBoxCeremony'
import { createTimelineEntry } from '../lib/timelineEngine'

export function CertificateUploadModal({ isOpen, onClose, userId, syllabus = null }) {
    const [certificatePhase, setCertificatePhase] = useState('form') // form, scanning, verified, gift
    const [certificateTitle, setCertificateTitle] = useState('')
    const [certificateIssuer, setCertificateIssuer] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [giftReward, setGiftReward] = useState(null)
    const fileInputRef = useRef(null)

    if (!isOpen) return null

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

            // 2b. Create timeline post so it appears in "YOUR TIMELINE"
            // Do not block certificate flow if timeline table is unavailable.
            await createTimelineEntry(
                userId,
                certificateTitle.trim(),
                'certificate',
                certificateIssuer.trim() || null,
                null
            )
            
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

    function handleFileSelect(e) {
        const file = e.target.files?.[0]
        if (file) setSelectedFile(file)
    }

    function handleGiftComplete() {
        setCertificatePhase('form')
        setCertificateTitle('')
        setCertificateIssuer('')
        setSelectedFile(null)
        setGiftReward(null)
        onClose()
    }

    function handleClose() {
        setCertificatePhase('form')
        setCertificateTitle('')
        setCertificateIssuer('')
        setSelectedFile(null)
        setGiftReward(null)
        onClose()
    }

    // If showing gift box ceremony
    if (certificatePhase === 'gift' && giftReward) {
        return <GiftBoxCeremony reward={giftReward} onComplete={handleGiftComplete} />
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-md p-6 rounded-xl" style={{ background: '#1a1a2e', border: '1px solid #C9A84C' }}>
                
                {/* Scanning animation */}
                {certificatePhase === 'scanning' && (
                    <div className="text-center py-12">
                        <p className="text-[#C9A84C] font-mono text-xl animate-pulse">
                            SCANNING CERTIFICATE...
                        </p>
                    </div>
                )}
                
                {/* Verified animation */}
                {certificatePhase === 'verified' && (
                    <div className="text-center py-12">
                        <p className="text-green-500 font-mono text-2xl font-bold">
                            VERIFIED ✓
                        </p>
                    </div>
                )}
                
                {/* Upload form */}
                {certificatePhase === 'form' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[#C9A84C] font-mono text-lg font-bold">UPLOAD CERTIFICATE</p>
                            <button onClick={handleClose} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        
                        <div className="space-y-4">
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
                                    className="w-full py-8 border-2 border-dashed border-[#C9A84C] text-[#C9A84C] font-mono text-xs rounded hover:bg-[#C9A84C10]"
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
                                UPLOAD & CLAIM REWARD
                            </button>
                            
                            {/* Info text */}
                            <p className="text-gray-500 font-mono text-xs text-center">
                                Upload a certificate to unlock a GIFT BOX reward
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
