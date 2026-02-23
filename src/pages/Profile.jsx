import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import AvatarDisplay from '../components/AvatarDisplay'
import ProfileSettingsModal from '../components/ProfileSettingsModal'
import { getAvatarById } from '../lib/avatarLibrary'
import { getRankFromXP, getLevelFromXP } from '../lib/xpEngine'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [activities, setActivities] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('activity')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    github: '', twitter: '', linkedin: '', website: ''
  })
  const [editingSocial, setEditingSocial] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const [
        { data: profileData },
        { data: activityData },
        { data: certData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('certificates').select('*').eq('user_id', user.id)
      ])

      if (profileData) {
        setProfile(profileData)
        if (profileData.social_links) {
          try {
            setSocialLinks(JSON.parse(profileData.social_links))
          } catch (e) {
            console.error('Error parsing social links:', e)
          }
        }
      }
      if (activityData) setActivities(activityData)
      if (certData) setCertificates(certData)
    } catch (err) {
      console.error('Error loading profile data:', err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function updateProfile(newAvatarId) {
    try {
      await supabase.from('profiles')
        .update({ avatar_id: newAvatarId })
        .eq('id', profile.id)
      setProfile(prev => ({ ...prev, avatar_id: newAvatarId }))
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  }

  async function saveSocialLinks() {
    setEditingSocial(true)
    try {
      await supabase.from('profiles')
        .update({ social_links: JSON.stringify(socialLinks) })
        .eq('id', profile.id)
      setProfile(prev => ({ ...prev, social_links: JSON.stringify(socialLinks) }))
      setShowSocialModal(false)
    } catch (err) {
      console.error('Error saving social links:', err)
    } finally {
      setEditingSocial(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">LOADING PROFILE...</p>
      </div>
    )
  }

  const avatarData = getAvatarById(profile?.avatar_id || 1)
  const currentRank = getRankFromXP(profile?.xp || 0)
  const daysActive = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at)) / 86400000)
    : 0

  const hasAnySocial = Object.values(socialLinks).some(link => link && link.trim() !== '')

  function formatTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr)
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 pb-12">

        <div className="relative">
          {/* Banner background */}
          <div className="w-full h-28 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d0d2b 0%, #1a1a3e 40%, #0a0a1a 100%)',
            }}
          >
            {/* Decorative grid lines */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Rank watermark text top right */}
            <div className="absolute top-3 right-4 font-mono text-[10px] text-[#C9A84C]/20 tracking-widest">
              SYSTEM: ARISE
            </div>

            {/* Rank badge bottom right of banner */}
            <div className="absolute bottom-3 right-4 border border-[#C9A84C]/30 rounded px-2 py-1"
              style={{
                background: 'rgba(201,168,76,0.08)',
              }}
            >
              <p className="font-mono text-[10px] text-[#C9A84C] font-bold">
                {getRankFromXP(profile?.xp || 0)}-RANK
              </p>
            </div>
          </div>

          {/* Avatar overlapping banner */}
          <div className="px-4">
            <div className="flex items-end justify-between mt-[-40px] mb-3">
              {/* Avatar circle */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettingsModal(true)}
                className="cursor-pointer relative"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(201,168,76,0.3))'
                }}
              >
                <AvatarDisplay
                  avatarId={profile?.avatar_id || 1}
                  size="xl"
                  showGlow={true}
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: '#C9A84C',
                    border: '2px solid #080810',
                  }}
                >
                  <span className="text-black text-xs">✎</span>
                </div>
              </motion.div>

              {/* Top right action button */}
              <button
                onClick={() => navigate('/settings/account')}
                className="font-mono text-[10px] text-gray-500 border rounded px-3 py-1.5 mb-2 hover:text-[#C9A84C] transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                EDIT PROFILE
              </button>
            </div>

            {/* Name section */}
            <div className="mb-3">
              <h2 className="font-mono text-xl font-bold text-[#E8E8E8] mb-0.5">
                {profile?.display_name || 'HUNTER'}
              </h2>
              <p className="font-mono text-[11px] text-gray-500">
                @{profile?.display_name?.toLowerCase().replace(/\s/g, '_') || 'hunter'}
              </p>
              <p className="font-mono text-[10px] text-[#C9A84C]/70 mt-1">
                {getAvatarById(profile?.avatar_id || 1)?.name}
                {' · '}
                {getAvatarById(profile?.avatar_id || 1)?.class}
              </p>
            </div>

            {/* Social links row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {!hasAnySocial ? (
                <button
                  onClick={() => setShowSocialModal(true)}
                  className="font-mono text-[10px] text-[#C9A84C]/70 flex items-center gap-1 border rounded-full px-3 py-1 hover:text-[#C9A84C] transition-colors"
                  style={{
                    border: '1px solid rgba(201,168,76,0.2)',
                    background: 'rgba(201,168,76,0.05)',
                  }}
                >
                  + ADD SOCIAL LINK
                </button>
              ) : (
                <>
                  {socialLinks.github && (
                    <div className="border border-white/5 bg-white/5 rounded-full px-2.5 py-0.5 font-mono text-[9px] text-[#E8E8E8] flex items-center gap-1.5">
                      <span>🔗</span> GitHub
                    </div>
                  )}
                  {socialLinks.twitter && (
                    <div className="border border-white/5 bg-white/5 rounded-full px-2.5 py-0.5 font-mono text-[9px] text-[#E8E8E8] flex items-center gap-1.5">
                      <span>🐦</span> Twitter
                    </div>
                  )}
                  {socialLinks.linkedin && (
                    <div className="border border-white/5 bg-white/5 rounded-full px-2.5 py-0.5 font-mono text-[9px] text-[#E8E8E8] flex items-center gap-1.5">
                      <span>💼</span> LinkedIn
                    </div>
                  )}
                  {socialLinks.website && (
                    <div className="border border-white/5 bg-white/5 rounded-full px-2.5 py-0.5 font-mono text-[9px] text-[#E8E8E8] flex items-center gap-1.5">
                      <span>🌐</span> Website
                    </div>
                  )}
                  <button
                    onClick={() => setShowSocialModal(true)}
                    className="text-gray-600 font-mono text-[9px] ml-1 hover:text-[#C9A84C]"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>

            {/* Achievements row */}
            <button
              onClick={() => setActiveTab('achievements')}
              className="flex items-center gap-2 mb-3"
            >
              <span className="text-lg">📜</span>
              <span className="font-mono text-[11px] text-gray-400">
                {certificates?.length || 0} ACHIEVEMENTS
              </span>
              <span className="text-gray-600 text-xs">›</span>
            </button>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-1 mb-3 pb-3 border-b"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              {[
                { value: profile?.xp || 0, label: 'XP' },
                { value: profile?.streak || 0, label: 'STREAK' },
                { value: getLevelFromXP(profile?.xp || 0), label: 'LEVEL' },
                {
                  value: Math.floor((Date.now() - new Date(profile?.created_at || Date.now())) / 86400000),
                  label: 'DAYS'
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                  className="text-center"
                >
                  <p className="font-mono text-sm font-bold text-[#E8E8E8]">
                    {stat.value}
                  </p>
                  <p className="font-mono text-[9px] text-gray-600 mt-0.5">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ZONE 2: TAB BAR */}
        <div className="sticky top-0 z-10 px-4 pt-1 pb-0"
          style={{
            background: 'rgba(8,8,16,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex">
            {[
              { id: 'activity', label: 'ACTIVITY' },
              { id: 'achievements', label: 'ACHIEVEMENTS' },
              { id: 'about', label: 'ABOUT' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 font-mono text-[11px] relative transition-colors"
                style={{
                  color: activeTab === tab.id ? '#C9A84C' : '#4B5563',
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background: '#C9A84C',
                      boxShadow: '0 0 8px rgba(201,168,76,0.6)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 3: TAB CONTENT */}
        <div className="">
          {activeTab === 'activity' && (
            <div className="divide-y divide-white/5">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(201,168,76,0.05)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <span className="text-2xl opacity-40">⚔</span>
                  </div>
                  <p className="font-mono text-xs text-gray-600 text-center uppercase">NO ACTIVITY YET</p>
                  <p className="font-mono text-[10px] text-gray-700 text-center mt-1">
                    Complete quests to build your legend
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Type icon */}
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.15)',
                      }}
                    >
                      <span className="text-sm">
                        {activity.type === 'habit' ? '◈' :
                          activity.type === 'frog' ? '⚔' :
                            activity.type === 'slice' ? '◆' :
                              activity.type === 'skill_quest' ? '★' : '✓'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-[#E8E8E8] truncate uppercase font-bold">
                        {activity.title}
                      </p>
                      <p className="font-mono text-[10px] text-gray-600 mt-0.5">
                        {activity.description}
                      </p>
                      <p className="font-mono text-[9px] text-gray-700 mt-1 uppercase">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>

                    {/* XP badge */}
                    {activity.xp_earned > 0 && (
                      <div className="flex-shrink-0">
                        <span className="font-mono text-[10px] text-[#C9A84C] font-bold">
                          +{activity.xp_earned} XP
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="py-4 space-y-6">
              {/* RANK MILESTONES */}
              <section>
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="w-1 h-4 bg-[#C9A84C]/60 rounded-full" />
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                    RANK MILESTONES
                  </p>
                </div>
                <div className="px-4 grid grid-cols-6 gap-2 mb-4">
                  {['E', 'D', 'C', 'B', 'A', 'S'].map((rank, i) => {
                    const thresholds = [0, 500, 1500, 3500, 7500, 15000]
                    const achieved = (profile?.xp || 0) >= thresholds[i]
                    return (
                      <div key={rank}
                        className="aspect-square rounded-lg flex items-center justify-center flex-col gap-1"
                        style={{
                          background: achieved
                            ? 'rgba(201,168,76,0.15)'
                            : 'rgba(255,255,255,0.02)',
                          border: achieved
                            ? '1px solid rgba(201,168,76,0.4)'
                            : '1px solid rgba(255,255,255,0.04)',
                          opacity: achieved ? 1 : 0.3,
                        }}
                      >
                        <span className="font-mono text-sm font-bold"
                          style={{
                            color: achieved ? '#C9A84C' : '#4B5563'
                          }}
                        >
                          {rank}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* STREAK MILESTONES */}
              <section>
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="w-1 h-4 bg-[#C9A84C]/60 rounded-full" />
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                    STREAK MILESTONES
                  </p>
                </div>
                <div className="px-4 grid grid-cols-3 gap-2 mb-4">
                  {[7, 14, 21, 30, 60, 90].map(milestone => {
                    const achieved = (profile?.streak || 0) >= milestone
                    return (
                      <div key={milestone}
                        className="rounded-lg p-3 text-center"
                        style={{
                          background: achieved
                            ? 'rgba(201,168,76,0.1)'
                            : 'rgba(255,255,255,0.02)',
                          border: achieved
                            ? '1px solid rgba(201,168,76,0.3)'
                            : '1px solid rgba(255,255,255,0.04)',
                          opacity: achieved ? 1 : 0.3,
                        }}
                      >
                        <p className="font-mono text-sm font-bold"
                          style={{
                            color: achieved ? '#C9A84C' : '#4B5563'
                          }}
                        >
                          {milestone}
                        </p>
                        <p className="font-mono text-[9px] text-gray-600">DAYS</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* CERTIFICATES */}
              <section>
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="w-1 h-4 bg-[#C9A84C]/60 rounded-full" />
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                    CERTIFICATES
                  </p>
                </div>
                {certificates.length === 0 ? (
                  <div className="px-4">
                    <p className="text-gray-700 font-mono text-[10px] italic">No certificates yet</p>
                  </div>
                ) : (
                  <div className="px-4 space-y-2">
                    {certificates.map(cert => (
                      <div key={cert.id}
                        className="rounded-lg p-3 flex items-center gap-3"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span className="text-2xl">📜</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-[#E8E8E8] truncate uppercase font-bold">
                            {cert.title}
                          </p>
                          <p className="font-mono text-[10px] text-gray-600">
                            {cert.issuer}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-[#C9A84C] font-bold flex-shrink-0">
                          +200 XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="px-4 py-4 space-y-4">
              {/* Hunter class card */}
              <div className="corners rounded-xl p-4 text-center"
                style={{
                  background: 'rgba(10,10,26,0.95)',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                <AvatarDisplay
                  avatarId={profile?.avatar_id || 1}
                  size="lg"
                  showGlow={true}
                />
                <p className="font-mono text-sm font-bold text-[#C9A84C] mt-3 uppercase">
                  {getAvatarById(profile?.avatar_id || 1)?.name}
                </p>
                <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase">
                  {getAvatarById(profile?.avatar_id || 1)?.class}
                  {' CLASS'}
                </p>
              </div>

              {/* Domains */}
              {profile?.domains?.length > 0 && (
                <div className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-3">
                    ACTIVE DOMAINS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.domains.map(domain => (
                      <span key={domain}
                        className="font-mono text-[10px] rounded-full px-3 py-1"
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          border: '1px solid rgba(201,168,76,0.25)',
                          color: '#C9A84C',
                        }}
                      >
                        {domain.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Member since */}
              <div className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                  HUNTER SINCE
                </p>
                <p className="font-mono text-sm text-[#E8E8E8] uppercase">
                  {new Date(profile?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        {showSettingsModal && (
          <ProfileSettingsModal
            profile={profile}
            onSave={(newAvatarId) => updateProfile(newAvatarId)}
            onClose={() => setShowSettingsModal(false)}
          />
        )}

        {showSocialModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center animate-in fade-in duration-300">
            <div className="bg-[var(--bg-card)] border border-[#C9A84C]/50 rounded-t-2xl w-full max-w-lg p-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest uppercase">
                  SOCIAL ARCHIVE
                </h3>
                <button onClick={() => setShowSocialModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'github', label: 'GitHub URL', icon: '🔗' },
                  { id: 'twitter', label: 'Twitter URL', icon: '🐦' },
                  { id: 'linkedin', label: 'LinkedIn URL', icon: '💼' },
                  { id: 'website', label: 'Portfolio/Website', icon: '🌐' }
                ].map(field => (
                  <div key={field.id}>
                    <label className="block text-gray-600 font-mono text-[9px] uppercase mb-1.5 ml-1">
                      {field.icon} {field.label}
                    </label>
                    <input
                      type="text"
                      value={socialLinks[field.id]}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={`https://${field.id}.com/username`}
                      className="w-full bg-[var(--bg-primary)] border border-gray-800 rounded px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowSocialModal(false)}
                  className="flex-1 border border-gray-800 text-gray-500 font-mono text-xs font-bold py-3 rounded hover:bg-gray-900 transition-all uppercase"
                >
                  CANCEL
                </button>
                <button
                  onClick={saveSocialLinks}
                  disabled={editingSocial}
                  className="flex-2 bg-[#C9A84C] text-black font-mono text-xs font-bold py-3 rounded hover:bg-[#d4b76a] transition-all disabled:opacity-50 uppercase px-8"
                >
                  {editingSocial ? 'SAVING...' : 'SAVE LINKS'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
