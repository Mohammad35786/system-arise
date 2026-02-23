import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S']
const RANK_XP = { E: 0, D: 500, C: 1500, B: 3500, A: 7500, S: 15000 }
const RANK_NEXT = { E: 500, D: 1500, C: 3500, B: 7500, A: 15000, S: 15000 }

const RANK_MESSAGES = {
  E: 'Hunter status: Awakening. Potential undetected.',
  D: 'Power is dormant. The System is activating it.',
  C: 'Ability detected. Optimization in progress.',
  B: 'Hunter profile confirmed. Efficiency protocols active.',
  A: 'Elite classification. Advanced access granted.',
  S: 'Shadow Monarch tier. The System bows to no one.',
}

export default function Status() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [skillLogs, setSkillLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const [
        { data: profileData },
        { data: tasksData },
        { data: skillData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('skill_quest_log').select('*').eq('user_id', user.id)
      ])

      if (profileData) setProfile(profileData)
      if (tasksData) setTasks(tasksData)
      if (skillData) setSkillLogs(skillData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">
          LOADING STATUS WINDOW...
        </p>
      </div>
    )
  }

  // Stats calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed)
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks.length / totalTasks) * 100)
    : 0
  const fearTasks = tasks.filter(t => t.fear_flag && t.completed).length
  const currentXP = profile?.xp || 0
  const currentRank = profile?.rank || 'E'
  const nextRankXP = RANK_NEXT[currentRank]
  const currentRankXP = RANK_XP[currentRank]
  const xpIntoRank = currentXP - currentRankXP
  const xpNeededForRank = nextRankXP - currentRankXP
  const rankProgress = Math.min((xpIntoRank / xpNeededForRank) * 100, 100)
  const rankIndex = RANK_ORDER.indexOf(currentRank)

  // Last 7 days streak calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const completedDates = completedTasks.map(t =>
    t.completed_at ? new Date(t.completed_at).toDateString() : null
  ).filter(Boolean)

  return (
    <AppShell profile={profile}>
      <div className="max-w-sm mx-auto px-4 pt-4 space-y-4">

        {/* ── Rank Card ── */}
        <div className="border-2 border-[#C9A84C] bg-[#0D1117] rounded p-4 text-center shadow-[0_0_30px_#C9A84C22]">
          <p className="text-gray-500 font-mono text-xs mb-3">CURRENT RANK</p>
          <div className="border-2 border-[#C9A84C] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_#C9A84C55]">
            <span className="text-[#C9A84C] font-mono font-bold text-4xl">
              {currentRank}
            </span>
          </div>
          <p className="text-[#E8E8E8] font-mono text-sm font-bold mb-1">
            {currentRank}-RANK HUNTER
          </p>
          <p className="text-gray-500 font-mono text-xs italic mb-4 px-4">
            "{RANK_MESSAGES[currentRank]}"
          </p>

          {/* Rank progress */}
          <div className="mb-1">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 font-mono text-xs">{currentRank}</span>
              <span className="text-gray-600 font-mono text-xs">
                {currentRank !== 'S' ? RANK_ORDER[rankIndex + 1] : 'MAX'}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-[#C9A84C] h-2 rounded-full transition-all duration-700"
                style={{ width: `${rankProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-700 font-mono text-xs">{currentXP} XP</span>
              {currentRank !== 'S' && (
                <span className="text-gray-700 font-mono text-xs">
                  {nextRankXP - currentXP} XP TO {RANK_ORDER[rankIndex + 1]}-RANK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── View Talent Matrix Link ── */}
        <button
          onClick={() => navigate('/radar')}
          className="w-full border border-[#C9A84C] bg-[#0D1117] rounded p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:border-[#E8C547] group"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#C9A84C] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-[#C9A84C] text-lg">🎯</span>
            </div>
            <div className="text-left">
              <p className="font-mono text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors duration-300">
                TALENT MATRIX
              </p>
              <p className="font-mono text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                View your strengths & abilities →
              </p>
            </div>
          </div>
        </button>

        {/* ── Rank Path ── */}
        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-3">RANK PROGRESSION PATH</p>
          <div className="flex items-center justify-between">
            {RANK_ORDER.map((rank, i) => {
              const achieved = i <= rankIndex
              const isCurrent = rank === currentRank
              return (
                <div key={rank} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C] shadow-[0_0_10px_#C9A84C55]'
                        : achieved
                          ? 'border-green-600 bg-green-600/20 text-green-400'
                          : 'border-gray-700 text-gray-700'
                    }`}>
                      {rank}
                    </div>
                    <span className={`font-mono text-xs mt-1 ${
                      isCurrent ? 'text-[#C9A84C]' : achieved ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {RANK_XP[rank] === 0 ? 'START' : `${RANK_XP[rank]}`}
                    </span>
                  </div>
                  {i < RANK_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${
                      i < rankIndex ? 'bg-green-700' : 'bg-gray-800'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div>
          <p className="text-gray-500 font-mono text-xs mb-2">COMBAT STATISTICS</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'TOTAL XP', value: currentXP, color: 'text-[#C9A84C]' },
              { label: 'STREAK', value: `${profile?.streak || 0} DAYS`, color: 'text-[#C9A84C]' },
              { label: 'TASKS CLEARED', value: completedTasks.length, color: 'text-green-400' },
              { label: 'COMPLETION RATE', value: `${completionRate}%`, color: 'text-green-400' },
              { label: 'FEAR FLAGS BEATEN', value: fearTasks, color: 'text-orange-400' },
              { label: 'SKILL QUESTS', value: skillLogs.filter(s => s.completed).length, color: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className={`font-mono text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-600 font-mono text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly Activity ── */}
        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-3">LAST 7 DAYS ACTIVITY</p>
          <div className="flex justify-between gap-1">
            {last7Days.map((day, i) => {
              const hasActivity = completedDates.includes(day.toDateString())
              const isToday = day.toDateString() === new Date().toDateString()
              const dayName = day.toLocaleDateString('en', { weekday: 'short' }).toUpperCase()
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-full aspect-square rounded mb-1 border transition-all ${
                    isToday
                      ? hasActivity
                        ? 'bg-[#C9A84C] border-[#C9A84C]'
                        : 'border-[#C9A84C] border-dashed'
                      : hasActivity
                        ? 'bg-[#C9A84C]/60 border-[#C9A84C]/60'
                        : 'bg-gray-800 border-gray-800'
                  }`} />
                  <span className="text-gray-700 font-mono text-xs">{dayName.slice(0, 2)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#C9A84C]" />
              <span className="text-gray-600 font-mono text-xs">ACTIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-800 border border-gray-700" />
              <span className="text-gray-600 font-mono text-xs">INACTIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-dashed border-[#C9A84C]" />
              <span className="text-gray-600 font-mono text-xs">TODAY</span>
            </div>
          </div>
        </div>

        {/* ── Hunter Profile ── */}
        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-3">HUNTER PROFILE</p>
          <div className="space-y-3">
            {profile?.strength && (
              <div>
                <p className="text-gray-600 font-mono text-xs mb-1">STRENGTH</p>
                <p className="text-[#E8E8E8] font-mono text-xs leading-relaxed">
                  {profile.strength}
                </p>
              </div>
            )}
            {profile?.weakness && (
              <div className="border-t border-gray-800 pt-3">
                <p className="text-gray-600 font-mono text-xs mb-1">KEY CONSTRAINT</p>
                <p className="text-[#E8E8E8] font-mono text-xs leading-relaxed">
                  {profile.weakness}
                </p>
              </div>
            )}
            {profile?.ambition && (
              <div className="border-t border-gray-800 pt-3">
                <p className="text-gray-600 font-mono text-xs mb-1">12-MONTH VISION</p>
                <p className="text-[#E8E8E8] font-mono text-xs leading-relaxed italic">
                  "{profile.ambition}"
                </p>
              </div>
            )}
            {profile?.energy_window && (
              <div className="border-t border-gray-800 pt-3">
                <p className="text-gray-600 font-mono text-xs mb-1">PEAK POWER WINDOW</p>
                <p className="text-[#C9A84C] font-mono text-xs font-bold">
                  {profile.energy_window.toUpperCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── XP Guide ── */}
        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <p className="text-gray-500 font-mono text-xs mb-3">XP EARNING GUIDE</p>
          <div className="space-y-2">
            {[
              { action: 'Frog completed before noon', xp: '+150 XP', color: 'text-[#C9A84C]' },
              { action: 'Frog completed after noon', xp: '+100 XP', color: 'text-[#C9A84C]' },
              { action: 'Side quest completed', xp: '+25 XP', color: 'text-gray-400' },
              { action: 'Skill quest completed', xp: '+30 XP', color: 'text-blue-400' },
              { action: '7-day streak bonus', xp: '+500 XP', color: 'text-green-400' },
              { action: 'Frog incomplete penalty', xp: '−75 XP', color: 'text-red-400' },
            ].map(item => (
              <div key={item.action} className="flex justify-between items-center">
                <span className="text-gray-600 font-mono text-xs">{item.action}</span>
                <span className={`font-mono text-xs font-bold ${item.color}`}>{item.xp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </AppShell>
  )
}