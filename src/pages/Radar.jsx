import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { TalentRadar } from '../components/TalentRadar'
import { supabase } from '../lib/supabase'

const APTITUDE_UNLOCK = 30

export default function Radar() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [skillLogs, setSkillLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const [{ data: profileData }, { data: skillData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('skill_quest_log').select('*').eq('user_id', user.id).order('completed_at', { ascending: false })
      ])

      if (profileData) setProfile(profileData)
      if (skillData) setSkillLogs(skillData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])

  const completedSkillQuests = useMemo(
    () => skillLogs.filter(l => l.completed).length,
    [skillLogs]
  )

  const progressPct = Math.min((completedSkillQuests / APTITUDE_UNLOCK) * 100, 100)

  const domains = useMemo(() => {
    const fromProfile = (profile?.domains || []).filter(Boolean)
    if (fromProfile.length) return fromProfile
    const set = new Set(skillLogs.map(s => s.domain).filter(Boolean))
    return Array.from(set)
  }, [profile, skillLogs])

  const domainCounts = useMemo(() => {
    const map = {}
    domains.forEach(d => { map[d] = 0 })
    skillLogs.forEach(l => {
      if (!l.domain) return
      if (map[l.domain] === undefined) map[l.domain] = 0
      map[l.domain] += 1
    })
    return map
  }, [domains, skillLogs])

  const maxCount = Math.max(...Object.values(domainCounts), 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">SCANNING RADAR...</p>
      </div>
    )
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Talent Matrix Section - Always visible at top */}
        <TalentRadar />

        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[#C9A84C] font-mono text-xs font-bold">SKILL RADAR</p>
              <p className="text-gray-600 font-mono text-xs mt-1 leading-relaxed">
                Detect emerging strengths by logging skill quests across domains.
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 font-mono text-[10px]">APTITUDE REPORT</p>
              <p className="text-[#E8E8E8] font-mono text-xs font-bold">
                {completedSkillQuests}/{APTITUDE_UNLOCK}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 font-mono text-xs">PROGRESS</span>
              <span className="text-[#C9A84C] font-mono text-xs">{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-[#C9A84C] h-2 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            {completedSkillQuests < APTITUDE_UNLOCK && (
              <p className="text-gray-700 font-mono text-xs mt-2 italic">
                Unlock the Aptitude Report at {APTITUDE_UNLOCK} completed skill quests.
              </p>
            )}
          </div>
        </div>

        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-2">DOMAIN ENGAGEMENT</p>
          {skillLogs.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded p-6 text-center">
              <p className="text-gray-600 font-mono text-xs mb-2">NO RADAR SIGNAL YET</p>
              <p className="text-gray-700 font-mono text-xs leading-relaxed">
                Complete your first skill quest to begin mapping your niche.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(domainCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([domain, count]) => {
                  const pct = Math.max((count / maxCount) * 100, 6)
                  return (
                    <div key={domain}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 font-mono text-xs">{String(domain).toUpperCase()}</span>
                        <span className="text-[#C9A84C] font-mono text-xs">{count}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="bg-[#C9A84C] h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-3">HOW THE RADAR WORKS</p>
          <div className="space-y-2">
            {[
              { step: '1', text: 'Log micro skill quests after real work (small, repeatable reps).' },
              { step: '2', text: 'The System clusters quests by domain to detect repeated engagement.' },
              { step: '3', text: 'As counts rise, high-signal domains emerge as niche candidates.' },
              { step: '4', text: 'At 30 quests, the Aptitude Report unlocks: strengths, patterns, next targets.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded border border-gray-800 bg-[#080810] flex items-center justify-center text-[#C9A84C] font-mono text-xs font-bold">
                  {s.step}
                </div>
                <p className="text-gray-400 font-mono text-xs leading-relaxed flex-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </AppShell>
  )
}

