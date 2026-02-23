import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { buildQuestBoard, calculateXP } from '../lib/questEngine'
import { getDailySkillQuest, getSkillQuestsForDomains } from '../lib/skillQuests'
import { AppShell } from '../components/AppShell'
import { QuestTimer } from '../components/QuestTimer'
import { getCurrentSlice } from '../lib/syllabusEngine'
import { SliceCompleteScreen } from '../components/SliceCompleteScreen'
import { TaskCompleteScreen } from '../components/TaskCompleteScreen'
import { CertificateUploadModal } from '../components/CertificateUploadModal'
import { RankUpCeremony } from '../components/RankUpCeremony'
import { TaskDetailsModal } from '../components/TaskDetailsModal'
import { rollReward } from '../lib/rewardEngine'
import { checkRankUp, getRankFromXP, getLevelFromXP } from '../lib/xpEngine'
import { checkForPenalties, applyPenalties } from '../lib/penaltyEngine'
import { notify, logActivity } from '../lib/notificationEngine'
import { useTimer } from '../context/TimerContext'
import { createTimelineEntry } from '../lib/timelineEngine'
import {
  getTodayTarget,
  getTomorrowTarget,
  getCurrentDay,
  isProgressionComplete,
} from '../lib/progressionEngine'
import AvatarDisplay from '../components/AvatarDisplay'
import { getAvatarById } from '../lib/avatarLibrary'
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

const swipeVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  center: {
    zIndex: 1,
    x: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30, duration: 0.25, ease: 'easeInOut' },
    }
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30, duration: 0.25, ease: 'easeInOut' },
    }
  })
}

// Streak milestones that trigger bonus XP
const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90]

export default function Home() {
  const navigate = useNavigate()
  const { activeTimerId } = useTimer()
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showCertificateUpload, setShowCertificateUpload] = useState(false)
  const [certificateSyllabus, setCertificateSyllabus] = useState(null)

  // Task Details Modal state
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTaskType, setSelectedTaskType] = useState(null) // 'habit' | 'instant' | 't_do'
  const [frog, setFrog] = useState(null)
  const [sideQuests, setSideQuests] = useState([])
  const [skillQuest, setSkillQuest] = useState(null)
  const [habits, setHabits] = useState([])
  const [syllabuses, setSyllabuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [completionWarning, setCompletionWarning] = useState({})
  const [showAddTask, setShowAddTask] = useState(false)
  const [showSkillSwap, setShowSkillSwap] = useState(false)
  const [completingFrog, setCompletingFrog] = useState(false)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [notification, setNotification] = useState('')
  const [notificationDuration, setNotificationDuration] = useState(3500)

  // Celebration state
  const [showComplete, setShowComplete] = useState(false)
  const [completeData, setCompleteData] = useState(null)
  const [activeCelebrationTaskId, setActiveCelebrationTaskId] = useState(null)

  // Feature 1: Slice ceremony
  const [showSliceCeremony, setShowSliceCeremony] = useState(false)
  const [sliceReward, setSliceReward] = useState(null)

  // Feature 2: Rank up
  const [showRankUp, setShowRankUp] = useState(false)
  const [rankUpData, setRankUpData] = useState(null)

  // Feature 4: Recovery protocol micro-step state
  const [microStepsChecked, setMicroStepsChecked] = useState([false, false, false, false, false])

  // Diary state: { [taskId]: { text, saving, saved, notes[] } }
  const [diaryOpen, setDiaryOpen] = useState({})
  const [diaryText, setDiaryText] = useState({})
  const [diarySaving, setDiarySaving] = useState({})
  const [diaryNotes, setDiaryNotes] = useState({})

  // Tab State
  const TABS = ['DAILY', 'INSTANT', 'LONG']
  const [activeTab, setActiveTab] = useState('INSTANT')
  const [tabDirection, setTabDirection] = useState(0)

  // Feature: Dropdown state for showing historical tasks inline
  const [dropdownOpen, setDropdownOpen] = useState({
    dailyQuests: false,
    instantTodo: false,
  })

  // Historical data for dropdowns
  const [historicalData, setHistoricalData] = useState({
    dailyQuests: [],
    instantTodo: [],
  })

  const [dropdownLoading, setDropdownLoading] = useState({
    dailyQuests: false,
    instantTodo: false,
  })

  // Completed items this session (for undo)
  const [completedItems, setCompletedItems] = useState({})

  function resolveTaskFeeling(task) {
    if (!task) return null
    return task.feeling || task.mood || task.comment || task.notes || null
  }

  // Track which section a task detail was opened from
  const [taskDetailSource, setTaskDetailSource] = useState(null)

  // Get current location for route change detection
  const location = useLocation()


  function showNotif(msg, duration = 3500) {
    setNotification(msg)
    setNotificationDuration(duration)
    setTimeout(() => setNotification(''), duration)
  }

  // Helper: award XP, check rank up, return new rank if changed
  async function awardXP(oldProfile, xpToAdd) {
    const oldXP = oldProfile?.xp || 0
    const newXP = oldXP + xpToAdd
    const rankedUp = checkRankUp(oldXP, newXP)
    const newRank = rankedUp || getRankFromXP(newXP)
    const newLevel = getLevelFromXP(newXP)

    const profileUpdate = { xp: newXP, level: newLevel }
    if (rankedUp) profileUpdate.rank = rankedUp

    await supabase.from('profiles').update(profileUpdate).eq('id', oldProfile.id)
    return { newXP, rankedUp, newRank }
  }

  // Helper: maybe show rank up ceremony
  function maybeShowRankUp(oldRank, rankedUp) {
    if (rankedUp) {
      setRankUpData({ newRank: rankedUp, oldRank })
      setShowRankUp(true)
    }
  }

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      // DATA PERSISTENCE: load incomplete tasks + tasks completed TODAY
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const startOfTodayISO = startOfToday.toISOString()

      const [
        { data: profileData },
        { data: tasksData },
        { data: habitData },
        { data: syllabusData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tasks').select('*').eq('user_id', user.id)
          .or(`completed.eq.false,completed_at.gte.${startOfTodayISO}`)
          .order('created_at', { ascending: false }),
        supabase.from('daily_habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('syllabuses').select('*').eq('user_id', user.id)
          .in('status', ['active', 'completed'])
          .order('created_at', { ascending: true }),
      ])

      console.log('Syllabus Data:', syllabusData)
      if (syllabusData) setSyllabuses(syllabusData)

      // Also load today's diary notes
      try {
        const todayStr = new Date().toISOString().slice(0, 10)
        const { data: diaryData } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
        if (diaryData) {
          const grouped = {}
          for (const entry of diaryData) {
            const key = entry.task_id || entry.syllabus_id || 'general'
            if (!grouped[key]) grouped[key] = []
            grouped[key].push(entry)
          }
          setDiaryNotes(grouped)
        }
      } catch (_) { }


      if (profileData) {
        setProfile(profileData)
        const sq = getDailySkillQuest(profileData?.domains || [])
        setSkillQuest(sq)
      }
      if (tasksData) {
        setTasks(tasksData)
        const { frog: f, sideQuests: sq } = buildQuestBoard(tasksData)
        setFrog(f)
        setSideQuests(sq)

        // Feature 3: Penalty check
        if (profileData) {
          const penalized = checkForPenalties(tasksData)
          if (penalized.length > 0) {
            const xpLost = await applyPenalties(penalized, profileData, supabase)
            if (xpLost > 0) {
              showNotif(`! PENALTY APPLIED: -${xpLost} XP. ${penalized.length} FROG${penalized.length > 1 ? 'S' : ''} CARRIED FORWARD.`)
            }
          }
        }
      }
      if (habitData) setHabits(habitData)
      if (syllabusData) setSyllabuses(syllabusData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])

  // Handle certificate upload for parent task with completion check
  function handleParentTaskCertificateUpload(sb) {
    let totalSlices = 0
    try {
      totalSlices = Array.isArray(sb.slices) ? sb.slices.length : JSON.parse(sb.slices).length
    } catch (e) {
      console.error('Error parsing slices:', e)
      totalSlices = 0
    }
    const progressPct = ((sb.current_slice_index || 0) / totalSlices) * 100
    if (progressPct < 100) {
      setCompletionWarning(prev => ({ ...prev, [sb.id]: true }))
      setTimeout(() => setCompletionWarning(prev => ({ ...prev, [sb.id]: false })), 3000)
    } else {
      setCertificateSyllabus(sb)
      setShowCertificateUpload(true)
    }
  }

  // Feature 1+2: Complete syllabus slice with reward ceremony
  async function completeSlice(syllabus) {
    const sliceTaskId = `${syllabus.id}-${syllabus.current_slice_index || 0}`
    if (activeCelebrationTaskId === sliceTaskId) return
    setActiveCelebrationTaskId(sliceTaskId)
    try {
      const reward = rollReward()
      let slices = []
      try {
        slices = Array.isArray(syllabus.slices)
          ? [...syllabus.slices]
          : JSON.parse(syllabus.slices)
      } catch (e) {
        console.error('Error parsing slices:', e)
        slices = []
      }
      if (slices.length === 0) return
      const currentIndex = syllabus.current_slice_index || 0
      slices[currentIndex] = {
        ...slices[currentIndex],
        completed: true,
        completedAt: new Date().toISOString(),
      }
      const isLastSlice = currentIndex >= slices.length - 1
      const nextIndex = isLastSlice ? currentIndex : currentIndex + 1

      let bonusXP = 0
      let streakBonus = 0
      if (reward.type === 'XP') bonusXP = reward.value
      if (reward.type === 'STREAK') streakBonus = reward.value
      if (isLastSlice) bonusXP += 500
      const totalXP = 100 + bonusXP

      await supabase.from('syllabuses').update({
        slices,
        current_slice_index: nextIndex,
        status: isLastSlice ? 'completed' : 'active',
      }).eq('id', syllabus.id)

      const oldProfile = profile
      const oldXP = oldProfile?.xp || 0
      const oldRank = getRankFromXP(oldXP)
      const profileUpdate = {
        xp: oldXP + totalXP,
        streak: (oldProfile?.streak || 0) + 1 + streakBonus,
      }
      if (reward.type === 'AVATAR') {
        profileUpdate.avatar_variant = reward.value
      }
      const newXP = profileUpdate.xp
      const rankedUp = checkRankUp(oldXP, newXP)
      if (rankedUp) {
        profileUpdate.rank = rankedUp
        profileUpdate.level = getLevelFromXP(newXP)
      }
      await supabase.from('profiles').update(profileUpdate).eq('id', oldProfile.id)

      setSliceReward({
        reward,
        baseXP: 100,
        isLastSlice,
        slice: slices[currentIndex],
        syllabus,
      })
      setShowSliceCeremony(true)

      // Create timeline entry for completed slice
      const sliceTitle = slices[currentIndex]?.title || syllabus.title
      await createTimelineEntry(profile?.id, sliceTitle, 'slice', resolveTaskFeeling(syllabus), syllabus.id)

      if (rankedUp) {
        // Show after ceremony completes via onContinue
        setRankUpData({ newRank: rankedUp, oldRank })
      }
    } catch (err) {
      console.error('completeSlice error:', err)
    }
  }

  async function completeFrog() {
    if (!frog || completingFrog) return
    if (activeCelebrationTaskId === frog.id) return
    setCompletingFrog(true)
    setActiveCelebrationTaskId(frog.id)
    try {
      const reward = rollReward()
      const now = new Date()
      const isBeforeNoon = now.getHours() < 12
      const xpEarned = calculateXP(isBeforeNoon, false)
      await supabase.from('tasks').update({
        completed: true,
        completed_at: now.toISOString(),
      }).eq('id', frog.id)

      const oldXP = profile?.xp || 0
      const oldRank = getRankFromXP(oldXP)
      const { rankedUp } = await awardXP(profile, xpEarned)

      // Feature 5: streak milestone check
      const newStreak = (profile?.streak || 0) + 1
      await supabase.from('profiles').update({ streak: newStreak }).eq('id', profile.id)
      checkStreakMilestone(newStreak, profile)

      // Notify + log
      await notify(profile.id, 'xp', ' FROG CONSUMED', `+${xpEarned} XP${isBeforeNoon ? ' - PEAK POWER BONUS' : ''}`, { xp: xpEarned })
      await logActivity(profile.id, 'frog', frog.name || frog.title, `Frog consumed. +${xpEarned} XP`, xpEarned, { isBeforeNoon })

      // Create timeline entry for completed frog
      await createTimelineEntry(
        profile.id,
        frog.name || frog.title,
        'frog',
        resolveTaskFeeling(frog),
        frog.id
      )

      setCompletedItems(prev => ({
        ...prev,
        [frog.id]: {
          type: 'frog',
          xpEarned: xpEarned,
          streakAdded: 1,
          timestamp: Date.now()
        }
      }))

      setCompleteData({
        taskName: frog.name || frog.title,
        taskType: 'frog',
        xpEarned: xpEarned + (reward.type === 'XP' ? reward.value : 0),
        reward: reward,
      })
      setShowComplete(true)

      maybeShowRankUp(oldRank, rankedUp)
    } catch (err) {
      console.error(err)
    } finally {
      setCompletingFrog(false)
    }
  }

  // Inline diary note helpers
  function toggleDiary(id) {
    setDiaryOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }
  async function saveDiaryNote(taskId, syllabusId) {
    const key = taskId || syllabusId || 'general'
    const text = (diaryText[key] || '').trim()
    if (!text) return
    setDiarySaving(prev => ({ ...prev, [key]: true }))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const todayStr = new Date().toISOString().slice(0, 10)
      const { data: inserted } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        task_id: taskId || null,
        syllabus_id: syllabusId || null,
        content: text,
        date: todayStr,
      }).select().single()
      setDiaryText(prev => ({ ...prev, [key]: '' }))
      setDiaryNotes(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), inserted],
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setDiarySaving(prev => ({ ...prev, [key]: false }))
    }
  }

  async function completeSideQuest(taskId) {
    if (activeCelebrationTaskId === taskId) return
    setActiveCelebrationTaskId(taskId)
    const task = sideQuests.find(t => t.id === taskId)
    const reward = rollReward()
    await supabase.from('tasks').update({
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId)
    const oldXP = profile?.xp || 0
    const oldRank = getRankFromXP(oldXP)
    const { rankedUp } = await awardXP(profile, 25)
    await notify(profile.id, 'xp', 'done SIDE QUEST COMPLETE', `+25 XP - ${task?.name || ''}`, { xp: 25 })
    await logActivity(profile.id, 'side_quest', task?.name || 'Side Quest', 'Side quest completed. +25 XP', 25)

    // Create timeline entry for completed side quest
    await createTimelineEntry(
      profile.id,
      task?.name || 'Side Quest',
      'side_quest',
      resolveTaskFeeling(task),
      taskId
    )

    setCompletedItems(prev => ({
      ...prev,
      [taskId]: {
        type: 'instant',
        xpEarned: 25,
        streakAdded: 0,
        timestamp: Date.now()
      }
    }))

    setCompleteData({
      taskName: task?.name || 'SIDE QUEST',
      taskType: 'instant',
      xpEarned: 25 + (reward.type === 'XP' ? reward.value : 0),
      reward: reward,
    })
    setShowComplete(true)

    maybeShowRankUp(oldRank, rankedUp)
  }

  async function completeSkillQuest() {
    if (!skillQuest || !profile) return
    await supabase.from('skill_quest_log').insert({
      user_id: profile.id,
      quest_title: skillQuest.title,
      domain: skillQuest.domain,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    const oldXP = profile?.xp || 0
    const oldRank = getRankFromXP(oldXP)
    const { rankedUp } = await awardXP(profile, 30)
    await notify(profile.id, 'xp', 'done SKILL QUEST COMPLETE', `+30 XP - ${skillQuest.title}`, { xp: 30 })
    await logActivity(profile.id, 'skill_quest', skillQuest.title, 'Skill quest completed. +30 XP', 30, { domain: skillQuest.domain })

    // Create timeline entry for completed skill quest
    await createTimelineEntry(profile.id, skillQuest.title, 'skill_quest', resolveTaskFeeling(skillQuest))

    showNotif('done SKILL QUEST COMPLETE. +30 XP')
    maybeShowRankUp(oldRank, rankedUp)
    setSkillQuest(null)
    await loadData()
  }

  // Feature 5: streak milestone check
  async function checkStreakMilestone(newStreak, currentProfile) {
    if (STREAK_MILESTONES.includes(newStreak)) {
      const milestoneXP = 500
      const oldXP = currentProfile?.xp || 0
      const newXP = oldXP + milestoneXP
      await supabase.from('profiles').update({ xp: newXP }).eq('id', currentProfile.id)
      showNotif(`! ${newStreak}-DAY STREAK MILESTONE - +500 XP BONUS`, 5000)
    }
  }

  // Feature 4: Recovery protocol - complete all micro steps for top penalty task
  async function resolveRecoveryTask() {
    const penaltyTasks = tasks.filter(t => t.penalty_tag === true)
    if (penaltyTasks.length === 0) return
    // Highest scored penalty task
    const topTask = penaltyTasks.reduce((best, t) => (t.score || 0) > (best.score || 0) ? t : best, penaltyTasks[0])
    await supabase.from('tasks').update({ penalty_tag: false }).eq('id', topTask.id)
    const oldXP = profile?.xp || 0
    const oldRank = getRankFromXP(oldXP)
    const { rankedUp } = await awardXP(profile, 50)
    showNotif('done RECOVERY COMPLETE. PENALTY CLEARED. +50 XP')
    maybeShowRankUp(oldRank, rankedUp)
    setMicroStepsChecked([false, false, false, false, false])
    await loadData()
  }

  async function undoCompletion(itemId, itemType) {
    const item = completedItems[itemId]
    if (!item) return

    try {
      if (itemType === 'habit') {
        const habit = habits.find(h => h.id === itemId)
        await supabase.from('daily_habits').update({
          last_completed: null,
          streak: Math.max(0, (habit?.streak || 1) - 1),
        }).eq('id', itemId)
        await supabase.from('profiles').update({
          xp: Math.max(0, (profile?.xp || 0) - item.xpEarned),
          streak: Math.max(0, (profile?.streak || 1) - 2),
        }).eq('id', profile.id)
      }

      if (itemType === 'frog' || itemType === 'instant') {
        await supabase.from('tasks').update({
          completed: false,
          completed_at: null,
        }).eq('id', itemId)
        await supabase.from('profiles').update({
          xp: Math.max(0, (profile?.xp || 0) - item.xpEarned),
          streak: Math.max(0, (profile?.streak || 1) - 2),
        }).eq('id', profile.id)
      }

      setCompletedItems(prev => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })

      showNotif('! UNDO APPLIED. XP REVERSED. -1 STREAK PENALTY.')
      await loadData()
    } catch (err) {
      console.error('undoCompletion error:', err)
    }
  }

  const xpForNextRank = 1000
  const xpProgress = profile
    ? Math.min(((profile.xp % xpForNextRank) / xpForNextRank) * 100, 100)
    : 0

  // Data persistence: separate completed today vs active
  const todayCompletedTasks = tasks.filter(t => {
    if (!t.completed || !t.completed_at) return false
    const completedDate = t.completed_at.split('T')[0]
    const today = new Date().toISOString().slice(0, 10)
    return completedDate === today
  })
  const allDoneToday = frog === null && sideQuests.length === 0 && todayCompletedTasks.length > 0

  if (loading) {
    return (
      <AppShell profile={profile}>
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
          <p className="text-[#C9A84C] font-mono text-xs animate-pulse">
            LOADING COMMAND CENTER...
          </p>
        </div>
      </AppShell>
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const activeSyllabus = syllabuses[0] || null
  const currentSyllabusSlice = activeSyllabus ? getCurrentSlice(activeSyllabus) : null

  // Feature 3 / 4: penalty tasks
  const penaltyTasks = tasks.filter(t => t.penalty_tag === true)
  const showRecovery = penaltyTasks.length >= 3
  const topPenaltyTask = showRecovery
    ? penaltyTasks.reduce((best, t) => (t.score || 0) > (best.score || 0) ? t : best, penaltyTasks[0])
    : null

  const microStepLabels = [
    'Define the exact outcome you need from this task',
    'Gather all materials or information needed',
    'Complete the first 10 minutes only - no more',
    'Review and adjust your approach',
    'Push to full completion',
  ]
  const allStepsDone = microStepsChecked.every(Boolean)

  // Feature 5: streak display helpers
  const streak = profile?.streak || 0
  function getStreakDisplay() {
    if (streak === 0) return { icon: 'o', label: '', color: '#6B7280', pulse: false }
    if (streak <= 2) return { icon: 'o', label: `${streak} DAYS`, color: '#6B7280', pulse: false }
    if (streak <= 6) return { icon: '', label: `${streak} DAYS`, color: '#F97316', pulse: false }
    if (streak <= 13) return { icon: '', label: `HOT STREAK - ${streak} DAYS`, color: '#F97316', pulse: false }
    if (streak <= 29) return { icon: '', label: `ON FIRE - ${streak} DAYS`, color: '#F97316', pulse: true }
    return { icon: '', label: `LEGENDARY STREAK - ${streak} DAYS`, color: '#C9A84C', pulse: true }
  }
  const totalHabits = habits?.length || 0
  const doneHabits = habits?.filter(h => {
    const today = new Date().toISOString().split('T')[0]
    return h.last_completed?.startsWith(today)
  }).length || 0

  const totalInstant = sideQuests?.length || 0
  const doneInstant = sideQuests?.filter(
    t => t.completed
  ).length || 0

  const hasFrog = !!frog
  const frogDone = frog?.completed || false

  const totalMissions = totalHabits + totalInstant +
    (hasFrog ? 1 : 0)
  const doneMissions = doneHabits + doneInstant +
    (frogDone ? 1 : 0)

  const powerPercent = totalMissions > 0
    ? Math.round((doneMissions / totalMissions) * 100)
    : 0

  const streakDisplay = getStreakDisplay()

  // --- TAB CONTENT RENDERING ---

  const DailyTab = (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-4 pt-4">
      {/* 1. DAILY QUESTS (Habits) */}
      <motion.div variants={sectionVariants} layout className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">DAILY QUESTS</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/history/daily-quests')}
              className="font-mono text-[9px] text-gray-600 hover:text-[#C9A84C] transition-colors border border-gray-800 hover:border-[#C9A84C]/30 rounded px-2 py-1"
            >
              details
            </button>
            <button
              onClick={() => navigate('/create')}
              className="font-mono text-[9px] text-[#C9A84C] border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded px-2 py-1 transition-colors"
            >
              + ADD
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <span className="text-4xl mb-2">🔥</span>
            <p className="font-mono text-sm text-gray-400">No active quests here.</p>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {habits
              .sort((a, b) => {
                const today = new Date().toISOString().slice(0, 10)
                const aDone = a.last_completed === today
                const bDone = b.last_completed === today
                if (aDone && !bDone) return 1
                if (!aDone && bDone) return -1
                return 0
              })
              .map(habit => {
                const doneToday = habit.last_completed === new Date().toISOString().slice(0, 10)
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    doneToday={doneToday}
                    onUndo={
                      doneToday && completedItems[habit.id]
                        ? () => undoCompletion(habit.id, 'habit')
                        : undefined
                    }
                    onViewDetails={() => {
                      setSelectedTask(habit)
                      setSelectedTaskType('habit')
                      setShowTaskDetails(true)
                    }}
                    onDone={() => {
                      if (doneToday) return
                      if (activeCelebrationTaskId === habit.id) return
                      setActiveCelebrationTaskId(habit.id)
                      const today = new Date()
                      const lastDate = habit.last_completed ? new Date(habit.last_completed) : null
                      let newStreak = habit.streak || 0
                      if (lastDate) {
                        const diff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
                        if (diff === 1) newStreak += 1
                        else if (diff > 1) newStreak = 1
                      } else newStreak = 1

                      supabase.from('daily_habits').update({
                        last_completed: today.toISOString().slice(0, 10),
                        streak: newStreak
                      }).eq('id', habit.id).then(() => {
                        setCompletedItems(prev => ({
                          ...prev,
                          [habit.id]: {
                            type: 'habit',
                            xpEarned: 10,
                            streakAdded: 1,
                            timestamp: Date.now()
                          }
                        }))
                        awardXP(profile, 10).then(({ rankedUp }) => {
                          const reward = rollReward()
                          const todayTarget = getTodayTarget(habit)
                          const tomorrowTarget = getTomorrowTarget(habit)
                          const isLastDay = isProgressionComplete(habit)
                          setCompleteData({
                            taskName: habit.name,
                            taskType: 'habit',
                            xpEarned: 10 + (reward.type === 'XP' ? reward.value : 0),
                            reward: reward,
                            progressionTarget: todayTarget,
                            progressionUnit: habit.progression_unit || 'reps',
                            progressionTomorrow: tomorrowTarget,
                            progressionIsLastDay: isLastDay,
                            progressionCurrentDay: getCurrentDay(habit),
                            progressionTotalDays: habit.progression_days,
                            progressionStart: habit.progression_start_value != null ? Math.round(habit.progression_start_value) : null,
                          })
                          setShowComplete(true)
                          maybeShowRankUp(getRankFromXP(profile.xp), rankedUp)
                        })
                      })
                    }}
                  />
                )
              })}
          </div>
        )}
      </motion.div>

      {/* 4. SKILL QUEST */}
      {skillQuest && (
        <motion.div variants={sectionVariants} className="space-y-2 pt-2 px-4 pb-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 px-1">
            <p className="text-gray-500 font-mono text-[11px] font-bold">SKILL QUEST</p>
            <button onClick={() => setShowSkillSwap(true)} className="text-[#C9A84C] font-mono text-[10px] hover:underline">SWAP {'<->'}</button>
          </div>
          <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 rounded p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-[#E8E8E8] font-mono text-sm font-bold">{skillQuest.title}</p>
              <span className="text-[#C9A84C] font-mono text-xs flex-shrink-0">+{skillQuest.xp} XP</span>
            </div>
            <p className="text-gray-500 font-mono text-[10px] mb-3">{skillQuest.domain?.toUpperCase()} . ~{skillQuest.minutes} MINS</p>
            <button
              onClick={completeSkillQuest}
              className="w-full bg-[#C9A84C]/10 border border-[#C9A84C] text-[#C9A84C] font-mono text-xs py-2 rounded hover:bg-[#C9A84C] hover:text-black transition-colors"
            >
              COMPLETE QUEST
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )

  const InstantTab = (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-4 pt-4">
      <div className="flex items-center justify-between px-4">
        <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">INSTANT TO-DO</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/history/instant-todo')}
            className="font-mono text-[9px] text-gray-600 hover:text-[#C9A84C] transition-colors border border-gray-800 hover:border-[#C9A84C]/30 rounded px-2 py-1"
          >
            details
          </button>
          <button
            onClick={() => navigate('/create')}
            className="font-mono text-[9px] text-[#C9A84C] border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded px-2 py-1 transition-colors"
          >
            + ADD
          </button>
        </div>
      </div>

      {/* Recovery Protocol Banner (If applies) */}
      {showRecovery && topPenaltyTask && (
        <div className="mx-4 border border-red-500/50 bg-red-500/5 rounded-lg p-4">
          <p className="text-red-400 font-mono text-xs font-bold mb-1">! RECOVERY PROTOCOL ACTIVE</p>
          <p className="text-gray-400 font-mono text-xs mb-3 leading-relaxed">
            Penalty tasks detected. Break your highest penalty Frog into micro-steps.
          </p>
          <p className="text-red-400 font-mono text-[11px] mb-2 truncate">FROG: {topPenaltyTask.name}</p>
          <div className="space-y-2">
            {microStepLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => {
                  const next = [...microStepsChecked]
                  next[i] = !next[i]
                  setMicroStepsChecked(next)
                }}
                className={`w-full text-left flex items-start gap-2 border rounded p-2 transition-all font-mono text-xs ${microStepsChecked[i] ? 'border-green-500/50 bg-green-500/5 text-green-400' : 'border-gray-700 text-gray-500'
                  }`}
              >
                <span className="flex-shrink-0 mt-0.5">{microStepsChecked[i] ? 'done' : `${i + 1}.`}</span>
                <span className="leading-relaxed">{label}</span>
              </button>
            ))}
          </div>
          {allStepsDone && (
            <button
              onClick={resolveRecoveryTask}
              className="w-full mt-3 bg-green-500/20 border border-green-500 text-green-400 font-mono text-xs font-bold py-2 rounded"
            >
              done CLEAR PENALTY - +50 XP
            </button>
          )}
        </div>
      )}

      {/* 2. INSTANT TO-DO (Tasks sorted by ABCDE score) */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <span className="text-4xl mb-2">⚔️</span>
          <p className="font-mono text-sm text-gray-400">No active quests here.</p>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-2">
          {[...(frog ? [frog] : []), ...sideQuests].map((task) => {
            const isActive = activeTimerId === String(task.id)
            return (
              <motion.div
                key={task.id}
                variants={cardVariants}
                whileHover={{ scale: 1.01, boxShadow: '0 0 15px rgba(201,168,76,0.1)' }}
                whileTap={{ scale: 0.99 }}
                className="space-y-1"
              >
                <div
                  onClick={() => {
                    setSelectedTask(task)
                    setSelectedTaskType('instant')
                    setTaskDetailSource('instantTodo')
                    setShowTaskDetails(true)
                  }}
                  className={`border bg-[var(--bg-card)] rounded p-3 transition-all cursor-pointer hover:border-[#C9A84C] ${isActive
                    ? 'border-[#C9A84C] shadow-[0_0_16px_#C9A84C55]'
                    : task.is_frog
                      ? 'border-[#C9A84C] shadow-[0_0_12px_#C9A84C22]'
                      : 'border-gray-800 hover:border-gray-700'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`border-2 rounded w-7 h-7 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold ${task.is_frog ? 'border-[#C9A84C] text-[#C9A84C]' :
                      task.abcde_label === 'A' ? 'border-red-500 text-red-500' :
                        task.abcde_label === 'B' ? 'border-orange-500 text-orange-500' :
                          'border-gray-600 text-gray-500'
                      }`}>
                      {task.is_frog ? 'A' : task.abcde_label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono text-xs leading-tight mb-1 truncate ${task.is_frog ? 'text-[#E8E8E8] font-bold' : 'text-gray-400'}`}>
                        {task.name || task.title}
                        {task.is_frog && <span className="text-[#C9A84C] text-[10px] ml-2">[FROG]</span>}
                      </p>
                      <p className="text-gray-600 font-mono text-[10px]">
                        {task.domain || 'WORK'} . {task.estimated_minutes || 30}M . IMPACT {task.impact}
                      </p>
                    </div>
                  </div>
                  <QuestTimer
                    taskId={task.id}
                    taskName={task.name || task.title}
                    taskType="instant"
                    onComplete={() => task.is_frog ? completeFrog() : completeSideQuest(task.id)}
                  />
                </div>
              </motion.div>
            )
          })}

          {/* Today's Completed Tasks */}
          {todayCompletedTasks.map(task => {
            const canUndo = !!completedItems[task.id]
            return (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task)
                  setSelectedTaskType('instant')
                  setTaskDetailSource('instantTodo')
                  setShowTaskDetails(true)
                }}
                className="border border-green-500/20 bg-[var(--bg-card)] rounded p-3 opacity-70 cursor-pointer hover:border-green-500/50">
                <div className="flex items-start gap-3">
                  <div className="border border-green-500 rounded w-7 h-7
              flex items-center justify-center flex-shrink-0 text-green-500 text-sm">
                    done
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-500 line-through truncate">
                      {task.name}
                    </p>
                    <p className="text-gray-700 font-mono text-[9px] uppercase">
                      COMPLETED . {new Date(task.completed_at).toLocaleTimeString([],
                        { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {canUndo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); undoCompletion(task.id, completedItems[task.id].type); }}
                      className="flex-shrink-0 border border-orange-500/50 text-orange-400
                    font-mono text-[9px] px-2 py-1 rounded
                    hover:bg-orange-500/10 transition-colors"
                    >
                      UNDO
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )

  const LongTab = (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-4 pt-4">
      <div className="flex items-center justify-between px-4">
        <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">LONG TERM PLAN</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/history/long-term')}
            className="font-mono text-[9px] text-gray-600 hover:text-[#C9A84C] transition-colors border border-gray-800 hover:border-[#C9A84C]/30 rounded px-2 py-1"
          >
            details
          </button>
          <button
            onClick={() => navigate('/create')}
            className="font-mono text-[9px] text-[#C9A84C] border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded px-2 py-1 transition-colors"
          >
            + ADD
          </button>
        </div>
      </div>

      {/* 3. LONG TERM PLAN (Syllabuses) */}
      {!syllabuses || syllabuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <span className="text-4xl mb-2">📖</span>
          <p className="font-mono text-sm text-gray-400">No active quests here.</p>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-2">
          {syllabuses.map((sb, idx) => {
            const slice = getCurrentSlice(sb)
            const totalSlices = Array.isArray(sb.slices) ? sb.slices.length : JSON.parse(sb.slices).length
            const rank = sb.priority || (idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D')

            // Logic to show completed slice if advanced today
            let slices = []
            try {
              slices = Array.isArray(sb.slices) ? sb.slices : JSON.parse(sb.slices)
            } catch (e) {
              console.error('Error parsing slices:', e)
              slices = []
            }
            let displaySlice = slice
            let isCompletedSlice = false

            const todayStr = new Date().toISOString().slice(0, 10)
            const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            const isScheduledToday = !sb.scheduled_days || sb.scheduled_days.includes(todayDayOfWeek)

            // Check if previous slice was completed today
            if ((sb.current_slice_index || 0) > 0) {
              const prevSlice = slices[(sb.current_slice_index || 0) - 1]
              if (prevSlice && prevSlice.completedAt && prevSlice.completedAt.startsWith(todayStr)) {
                displaySlice = prevSlice
                isCompletedSlice = true
              }
            }

            const timerTaskId = `${sb.id}-${sb.current_slice_index}`
            const isActive = activeTimerId === timerTaskId

            if (!isScheduledToday) {
              return (
                <div key={sb.id} className="opacity-40 grayscale-[0.5] border border-gray-800 rounded p-3 flex items-center justify-between group" style={{ background: 'rgba(13,17,23,0.9)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black border border-gray-900 flex items-center justify-center text-gray-700 font-mono text-xs font-bold">
                      {sb.goal_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-600 font-mono text-[11px] font-bold uppercase">{sb.goal_name}</p>
                      <p className="text-gray-700 font-mono text-[9px] uppercase tracking-tighter">REST DAY · NEXT: {sb.scheduled_days?.join(', ')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(sb)
                      setSelectedTaskType('syllabus')
                      setShowTaskDetails(true)
                    }}
                    className="text-gray-700 hover:text-gray-400 font-mono text-[9px] uppercase border border-gray-900 px-2 py-1 rounded"
                  >
                    Details
                  </button>
                </div>
              )
            }

            // Allow navigation unless clicking complete button
            return (
              <motion.div
                key={sb.id}
                variants={cardVariants}
                whileHover={{ scale: 1.01, boxShadow: '0 0 15px rgba(201,168,76,0.1)' }}
                whileTap={{ scale: 0.99 }}
                className="space-y-1"
              >
                <div
                  onClick={() => {
                    setSelectedTask(sb)
                    setSelectedTaskType('syllabus')
                    setShowTaskDetails(true)
                  }}
                  className={`rounded p-3 cursor-pointer transition-all border`}
                  style={{
                    background: 'rgba(13,17,23,0.9)',
                    border: sb.status === 'completed' ? '1px solid #713f12' : '1px solid rgba(255,255,255,0.06)',
                    ...(isActive ? { borderColor: '#C9A84C', boxShadow: '0 0 16px rgba(201,168,76,0.3)' } : {})
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`border-2 rounded w-7 h-7 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold ${sb.status === 'completed' ? 'border-yellow-600 text-yellow-600' :
                      rank === 'A' ? 'border-[#C9A84C] text-[#C9A84C]' :
                        'border-gray-700 text-gray-600'
                      }`}>
                      {sb.status === 'completed' ? '+' : rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono text-xs font-bold truncate mb-1 ${sb.status === 'completed' ? 'text-gray-500 line-through' : 'text-[#E8E8E8]'}`}>
                        {sb.goal_name}
                      </p>
                      {sb.status === 'completed' ? (
                        <p className="text-green-500 font-mono text-[10px] font-bold">
                          ALL {totalSlices} SLICES COMPLETED TODAY
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-gray-600 font-mono text-[10px]">Slice {sb.current_slice_index + 1} of {totalSlices}</p>
                            <div className="flex-1 h-1 bg-gray-800 rounded-full mx-2 overflow-hidden">
                              <div className="bg-[#C9A84C] h-full" style={{ width: `${((sb.current_slice_index + 1) / totalSlices) * 100}%` }} />
                            </div>
                          </div>
                          {displaySlice && (
                            <div className={`mt-2 border rounded p-2 ${isCompletedSlice ? 'border-green-800 bg-green-500/5' : 'border-gray-800 bg-[var(--bg-primary)]'}`}>
                              <div className="flex justify-between items-center mb-1">
                                <p className={`font-mono text-[9px] font-bold ${isCompletedSlice ? 'text-green-500' : 'text-[#C9A84C]'}`}>
                                  {isCompletedSlice ? 'done COMPLETED TODAY' : "TODAY'S SLICE:"}
                                </p>
                              </div>
                              <p className={`font-mono text-[10px] leading-tight line-clamp-2 ${isCompletedSlice ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                                {displaySlice.title}
                              </p>
                              {!isCompletedSlice && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <QuestTimer
                                      taskId={timerTaskId}
                                      taskName={displaySlice?.title || sb.goal_name}
                                      taskType="slice"
                                      onComplete={() => {
                                        if (sb.status === 'completed') return
                                        completeSlice(sb)
                                      }}
                                      mode="button"
                                    />
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      completeSlice(sb)
                                    }}
                                    className="flex-1 border border-[#C9A84C] text-[#C9A84C] font-mono text-[10px] py-1 rounded hover:bg-[#C9A84C] hover:text-black transition-colors"
                                  >
                                    COMPLETE SLICE
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <QuestTimer
                  taskId={timerTaskId}
                  taskName={displaySlice?.title || sb.goal_name}
                  taskType="slice"
                  onComplete={() => {
                    if (sb.status === 'completed') return
                    completeSlice(sb)
                  }}
                  hideInactive
                />

                {/* Completion Warning */}
                {completionWarning[sb.id] && (
                  <div className="mt-1 bg-orange-500/10 border border-orange-500/50 rounded p-1 text-center">
                    <p className="text-orange-400 font-mono text-[10px]">
                      ! COMPLETE TASK FIRST
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )

  return (
    <>
      {/*  Overlays  */}
      {showSliceCeremony && sliceReward && (
        <SliceCompleteScreen
          slice={sliceReward.slice}
          syllabus={sliceReward.syllabus}
          reward={sliceReward.reward}
          baseXP={sliceReward.baseXP}
          isLastSlice={sliceReward.isLastSlice}
          profile={profile}
          userId={profile?.id}
          onContinue={() => {
            setShowSliceCeremony(false)
            setSliceReward(null)
            setActiveCelebrationTaskId(null)
            if (rankUpData) setShowRankUp(true)
            else loadData()
          }}
        />
      )}

      {showRankUp && rankUpData && (
        <RankUpCeremony
          newRank={rankUpData.newRank}
          oldRank={rankUpData.oldRank}
          onContinue={() => {
            setShowRankUp(false)
            setRankUpData(null)
            setActiveCelebrationTaskId(null)
            loadData()
          }}
        />
      )}

      <AppShell profile={profile}>
        {showComplete && completeData && (
          <TaskCompleteScreen
            taskName={completeData.taskName}
            taskType={completeData.taskType}
            xpEarned={completeData.xpEarned}
            reward={completeData.reward}
            progressionTarget={completeData.progressionTarget}
            progressionUnit={completeData.progressionUnit}
            progressionTomorrow={completeData.progressionTomorrow}
            progressionIsLastDay={completeData.progressionIsLastDay}
            progressionCurrentDay={completeData.progressionCurrentDay}
            progressionTotalDays={completeData.progressionTotalDays}
            progressionStart={completeData.progressionStart}
            onContinue={() => {
              setShowComplete(false)
              setCompleteData(null)
              setActiveCelebrationTaskId(null)
              loadData()
            }}
          />
        )}
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0D1117] border border-[#C9A84C] rounded px-4 py-2 max-w-xs w-full mx-4 shadow-[0_0_15px_#C9A84C44]">
            <p className="text-[#C9A84C] font-mono text-xs text-center">{notification}</p>
          </div>
        )}

        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="max-w-lg mx-auto pb-24 space-y-3"
        >

          {/* Hunter Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mx-4 mt-4 rounded-xl p-4 corners relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d0d2b 0%, #0a0a1a 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 0 30px rgba(201,168,76,0.08)'
            }}
          >
            <div className="absolute top-2 right-3 text-[#C9A84C] font-mono text-[10px] opacity-10 tracking-widest select-none">
              SYSTEM: ARISE
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              {/* Feature: Avatar Sync */}
              <div className="relative">
                <AvatarDisplay
                  avatarId={profile?.avatar_id || 1}
                  size="md"
                  showGlow={true}
                />
                <div className="absolute -bottom-1 -right-1 bg-[#080810] border border-[#C9A84C] rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-[#C9A84C] font-mono text-[9px] font-bold">
                    {getRankFromXP(profile?.xp || 0)}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-[#E8E8E8] font-mono text-sm font-bold uppercase truncate">
                  {getAvatarById(profile?.avatar_id || 1)?.name || 'HUNTER'}
                </p>
                <div className="flex flex-col">
                  <p className="text-gray-500 font-mono text-[9px] uppercase">
                    {getRankFromXP(profile?.xp || 0)}-RANK · {profile?.avatar_category || getAvatarById(profile?.avatar_id || 1)?.class}
                  </p>
                  <p className={`font-mono text-[10px] flex items-center gap-1 ${streakDisplay.pulse ? 'animate-pulse' : ''}`} style={{ color: streakDisplay.color }}>
                    {streakDisplay.icon} {streakDisplay.label || 'NO STREAK'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#C9A84C] font-mono text-sm font-bold">{profile?.xp || 0} XP</p>
                <p className="text-gray-600 font-mono text-[10px]">LV {getLevelFromXP(profile?.xp || 0)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden relative z-10">
              <div className="bg-[#C9A84C] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_#C9A84C]" style={{ width: `${xpProgress}%` }} />
            </div>
          </motion.div>

          {/* TODAY'S BRIEFING Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-4 mt-3 rounded-xl p-4 corners relative"
            style={{
              background: 'rgba(10,10,26,0.9)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
              <p className="system-label">TODAY'S BRIEFING</p>
              <div className="flex-1 system-divider" />
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-[#C9A84C] font-mono text-lg font-bold leading-none">
                  {doneMissions}
                </p>
                <p className="text-gray-600 font-mono text-[9px] mt-0.5">DONE</p>
              </div>
              <div className="text-gray-700 font-mono text-xs">/</div>
              <div className="text-center">
                <p className="text-gray-400 font-mono text-lg font-bold leading-none">
                  {totalMissions}
                </p>
                <p className="text-gray-600 font-mono text-[9px] mt-0.5">TOTAL</p>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-[#C9A84C] font-mono text-2xl font-bold leading-none">
                  {powerPercent}%
                </p>
                <p className="text-gray-600 font-mono text-[9px] mt-0.5">POWER</p>
              </div>
            </div>

            <div className="w-full bg-gray-800/50 rounded-full h-1.5 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${powerPercent}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #C9A84C, #E8C96A)',
                  boxShadow: '0 0 8px rgba(201,168,76,0.5)',
                }}
              />
            </div>

            <p className="font-mono text-[10px] text-gray-600">
              {powerPercent === 100
                ? '◆ ALL MISSIONS COMPLETE · MAXIMUM POWER'
                : powerPercent >= 50
                  ? '◈ MISSION IN PROGRESS · KEEP PUSHING'
                  : '◌ AWAITING HUNTER ACTION · BEGIN NOW'}
            </p>

            {hasFrog && !frogDone && (
              <div className="caution-bar mt-3">
                CAUTION — PRIORITY TARGET UNDEFEATED
              </div>
            )}
          </motion.div>

          {/* Tab Navigation */}
          <div className="sticky top-0 z-20 bg-[#0D1117] flex border-b border-gray-800/30">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  const direction = TABS.indexOf(tab) > TABS.indexOf(activeTab) ? 1 : -1
                  setTabDirection(direction)
                  setActiveTab(tab)
                }}
                className={`flex-1 py-3 font-mono text-xs tracking-widest uppercase transition-all ${activeTab === tab
                  ? 'text-[#C9A84C] border-b-2 border-[#C9A84C]'
                  : 'text-[#6B7280] border-b-2 border-transparent hover:text-gray-400'
                  }`}
              >
                {tab === 'DAILY' ? 'DAILY' : tab === 'INSTANT' ? 'INSTANT' : 'LONG TERM'}
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden min-h-[400px]">
            <AnimatePresence initial={false} custom={tabDirection} mode="wait">
              <motion.div
                key={activeTab}
                custom={tabDirection}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.05}
                onDragEnd={(e, info) => {
                  const threshold = 50
                  if (info.offset.x > threshold && TABS.indexOf(activeTab) > 0) {
                    setTabDirection(-1)
                    setActiveTab(TABS[TABS.indexOf(activeTab) - 1])
                  } else if (info.offset.x < -threshold && TABS.indexOf(activeTab) < TABS.length - 1) {
                    setTabDirection(1)
                    setActiveTab(TABS[TABS.indexOf(activeTab) + 1])
                  }
                }}
                className="pb-2"
              >
                {activeTab === 'DAILY' && DailyTab}
                {activeTab === 'INSTANT' && InstantTab}
                {activeTab === 'LONG' && LongTab}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-4" />

        </motion.div>

        {/* Modals */}
        {showAddTask && (
          <TaskModal
            profile={profile}
            onClose={() => setShowAddTask(false)}
            onSaved={() => { setShowAddTask(false); loadData() }}
          />
        )}

        {showSkillSwap && (
          <SkillSwapModal
            domains={profile?.domains || []}
            currentQuest={skillQuest}
            onSelect={(q) => { setSkillQuest(q); setShowSkillSwap(false) }}
            onClose={() => setShowSkillSwap(false)}
          />
        )}

        {showAddHabit && (
          <AddHabitModal
            profile={profile}
            onClose={() => setShowAddHabit(false)}
            onSaved={async () => { setShowAddHabit(false); await loadData() }}
          />
        )}

        {/* Certificate Upload Modal */}
        {
          showCertificateUpload && (
            <CertificateUploadModal
              isOpen={showCertificateUpload}
              onClose={() => {
                setShowCertificateUpload(false)
                setCertificateSyllabus(null)
              }}
              userId={profile?.id}
              syllabus={certificateSyllabus}
            />
          )
        }

        {/* Task Details Modal */}
        {
          showTaskDetails && selectedTask && (
            <TaskDetailsModal
              isOpen={showTaskDetails}
              task={selectedTask}
              taskType={selectedTaskType}
              profile={profile}
              onClose={() => {
                setShowTaskDetails(false)
                setSelectedTask(null)
                setSelectedTaskType(null)
                // Keep the section expanded when closing the detail modal
              }}
              onDeleted={async (deletedTask) => {
                await loadData()
                showNotif('TASK DELETED')
              }}
              onComplete={(task) => {
                // Handle completion from details modal
                if (selectedTaskType === 'habit') {
                  // Complete habit
                  const today = new Date()
                  const lastDate = task.last_completed ? new Date(task.last_completed) : null
                  let newStreak = task.streak || 0
                  if (lastDate) {
                    const diff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
                    if (diff === 1) newStreak += 1
                    else if (diff > 1) newStreak = 1
                  } else newStreak = 1

                  supabase.from('daily_habits').update({
                    last_completed: today.toISOString().slice(0, 10),
                    streak: newStreak
                  }).eq('id', task.id).then(() => {
                    setCompletedItems(prev => ({
                      ...prev,
                      [task.id]: {
                        type: 'habit',
                        xpEarned: 10,
                        streakAdded: 1,
                        timestamp: Date.now()
                      }
                    }))
                    awardXP(profile, 10).then(({ rankedUp }) => {
                      const reward = rollReward()
                      const todayTarget = getTodayTarget(task)
                      const tomorrowTarget = getTomorrowTarget(task)
                      const isLastDay = isProgressionComplete(task)
                      setCompleteData({
                        taskName: task.name,
                        taskType: 'habit',
                        xpEarned: 10 + (reward.type === 'XP' ? reward.value : 0),
                        reward: reward,
                        progressionTarget: todayTarget,
                        progressionUnit: task.progression_unit || 'reps',
                        progressionTomorrow: tomorrowTarget,
                        progressionIsLastDay: isLastDay,
                        progressionCurrentDay: getCurrentDay(task),
                        progressionTotalDays: task.progression_days,
                        progressionStart: task.progression_start_value != null ? Math.round(task.progression_start_value) : null,
                      })
                      setShowComplete(true)
                      maybeShowRankUp(getRankFromXP(profile.xp), rankedUp)
                    })
                  })
                } else if (selectedTaskType === 'instant') {
                  // Complete instant task
                  completeSideQuest(task.id)
                }
                setShowTaskDetails(false)
                setSelectedTask(null)
                setSelectedTaskType(null)
              }}
              onUpdated={(updatedTask) => {
                showNotif('TASK UPDATED')
                loadData()
              }}
            />
          )
        }
      </AppShell >
    </>
  )
}


//  ADD TASK MODAL 
function TaskModal({ profile, onClose, onSaved }) {
  const DOMAINS = ['Work', 'Health', 'Learning', 'Relationships', 'Creative', 'Finance']
  const userDomains = profile?.domains?.length > 0 ? profile.domains : DOMAINS

  const [name, setName] = useState('')
  const [domain, setDomain] = useState(userDomains[0] || 'Work')
  const [impact, setImpact] = useState(5)
  const [alignment, setAlignment] = useState(5)
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [firstStep, setFirstStep] = useState('')
  const [deadline, setDeadline] = useState('')
  const [fearFlag, setFearFlag] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const previewScore = () => {
    const urgency = deadline ? (() => {
      const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
      if (days <= 0) return 10
      if (days <= 1) return 9
      if (days <= 3) return 7
      if (days <= 7) return 5
      if (days <= 14) return 3
      return 2
    })() : 1
    return (impact * 3) + (urgency * 2) + (alignment * 2) + 3 + (fearFlag ? 8 : 0)
  }

  async function handleSave() {
    if (!name.trim()) { setError('TASK NAME IS REQUIRED.'); return }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        name: name.trim(),
        domain,
        impact,
        goal_alignment: alignment,
        estimated_minutes: estimatedMinutes,
        first_step: firstStep.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        fear_flag: fearFlag,
      })
      if (insertError) throw insertError
      onSaved()
    } catch (err) {
      setError(err.message || 'FAILED TO SAVE.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-[var(--bg-card)] border border-[#C9A84C] rounded-t-xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] font-mono text-xs">ADD TO DUNGEON LOG</p>
            <p className="text-gray-600 font-mono text-xs">
              SCORE PREVIEW: <span className="text-[#C9A84C]">{previewScore()}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 font-mono text-xs">X CANCEL</button>
        </div>

        <div className="p-4 space-y-5">

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">TASK NAME *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-2 block">DOMAIN</label>
            <div className="grid grid-cols-3 gap-2">
              {userDomains.map(d => (
                <button key={d} onClick={() => setDomain(d)}
                  className={`border font-mono py-2 rounded text-xs transition-all ${domain === d
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">
              IMPACT <span className="text-[#C9A84C]">{impact}/10</span>
              <span className="text-gray-700 ml-1">(*3 in score)</span>
            </label>
            <input type="range" min="1" max="10" value={impact}
              onChange={e => setImpact(Number(e.target.value))}
              className="w-full accent-[#C9A84C]" />
            <div className="flex justify-between">
              <span className="text-gray-700 font-mono text-xs">LOW</span>
              <span className="text-gray-700 font-mono text-xs">HIGH</span>
            </div>
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">
              GOAL ALIGNMENT <span className="text-[#C9A84C]">{alignment}/10</span>
              <span className="text-gray-700 ml-1">(*2 in score)</span>
            </label>
            <input type="range" min="1" max="10" value={alignment}
              onChange={e => setAlignment(Number(e.target.value))}
              className="w-full accent-[#C9A84C]" />
            <div className="flex justify-between">
              <span className="text-gray-700 font-mono text-xs">UNRELATED</span>
              <span className="text-gray-700 font-mono text-xs">ALIGNED</span>
            </div>
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-2 block">ESTIMATED TIME</label>
            <div className="grid grid-cols-5 gap-1">
              {[15, 30, 60, 90, 120].map(t => (
                <button key={t} onClick={() => setEstimatedMinutes(t)}
                  className={`border font-mono py-2 rounded text-xs transition-all ${estimatedMinutes === t
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}>
                  {t >= 60 ? `${t / 60}H` : `${t}M`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">
              DEADLINE <span className="text-gray-700">(boosts urgency score)</span>
            </label>
            <input type="date" value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono focus:outline-none focus:border-[#C9A84C]" />
            {deadline && (
              <p className="text-gray-600 font-mono text-xs mt-1">
                {Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) <= 0
                  ? '! OVERDUE - MAX URGENCY'
                  : `${Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))} DAYS LEFT`}
              </p>
            )}
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">FIRST MICRO-STEP</label>
            <p className="text-gray-700 font-mono text-xs mb-2 italic">
              The single first action to beat procrastination.
            </p>
            <input type="text" value={firstStep}
              onChange={e => setFirstStep(e.target.value)}
              placeholder="e.g. Open the document and write one line"
              className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]" />
          </div>

          <div>
            <label className="text-gray-500 font-mono text-xs mb-1 block">
              FEAR FLAG <span className="text-gray-700">(+8 to score if avoided)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFearFlag(true)}
                className={`border-2 font-mono py-3 rounded text-xs font-bold transition-all ${fearFlag
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-gray-700 text-gray-600 hover:border-orange-500/50'
                  }`}>
                ! YES - AVOIDING
              </button>
              <button onClick={() => setFearFlag(false)}
                className={`border-2 font-mono py-3 rounded text-xs font-bold transition-all ${!fearFlag
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'border-gray-700 text-gray-600'
                  }`}>
                done NO - READY
              </button>
            </div>
          </div>

          <div className="bg-[#0A0A0F] border border-gray-800 rounded p-3">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 font-mono text-xs">SYSTEM SCORE PREVIEW</p>
              <p className="text-[#C9A84C] font-mono text-lg font-bold">{previewScore()}</p>
            </div>
            <p className="text-gray-700 font-mono text-xs mt-1">
              {previewScore() >= 40
                ? ' HIGH PRIORITY - LIKELY YOUR FROG'
                : previewScore() >= 25
                  ? '- MEDIUM PRIORITY'
                  : '- LOW PRIORITY'}
            </p>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-500/10 rounded px-3 py-2">
              <p className="text-red-400 text-xs font-mono">! {error}</p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-[#C9A84C] text-black font-bold font-mono py-3 rounded text-sm disabled:opacity-70">
            {saving ? 'LOGGING TO DUNGEON...' : 'LOG TASK TO DUNGEON'}
          </button>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

//  SKILL SWAP MODAL 
function SkillSwapModal({ domains, currentQuest, onSelect, onClose }) {
  const allQuests = getSkillQuestsForDomains(domains)
  const [filterDomain, setFilterDomain] = useState('ALL')

  const filtered = filterDomain === 'ALL'
    ? allQuests
    : allQuests.filter(q => q.domain === filterDomain)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-[#0D1117] border border-gray-700 rounded-t-xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <p className="text-[#C9A84C] font-mono text-xs">SWAP SKILL QUEST</p>
          <button onClick={onClose} className="text-gray-500 font-mono text-xs">X CANCEL</button>
        </div>
        <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
          <button onClick={() => setFilterDomain('ALL')}
            className={`flex-shrink-0 border font-mono text-xs px-3 py-1 rounded ${filterDomain === 'ALL' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-gray-700 text-gray-500'
              }`}>
            ALL
          </button>
          {domains.map(d => (
            <button key={d} onClick={() => setFilterDomain(d)}
              className={`flex-shrink-0 border font-mono text-xs px-3 py-1 rounded ${filterDomain === d ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-gray-700 text-gray-500'
                }`}>
              {d.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-2">
          {filtered.map((quest) => (
            <button key={quest.id} onClick={() => onSelect(quest)}
              className={`w-full text-left border rounded p-3 transition-all ${currentQuest?.id === quest.id
                ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                : 'border-gray-700 hover:border-gray-500'
                }`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[#E8E8E8] font-mono text-xs font-bold">{quest.title}</p>
                <span className="text-[#C9A84C] font-mono text-xs">+{quest.xp} XP</span>
              </div>
              <p className="text-gray-600 font-mono text-xs mb-1">
                {quest.domain} . ~{quest.minutes}MIN
              </p>
              <p className="text-gray-600 font-mono text-xs leading-relaxed">
                {quest.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HabitCard({ habit, doneToday, onDone, onUndo, onViewDetails }) {
  const { activeTimerId } = useTimer()
  const isActive = activeTimerId === String(habit.id)
  const todayTarget = getTodayTarget(habit)
  const currentDay = getCurrentDay(habit)
  const isProgressive = habit.progression_enabled && todayTarget !== null
  let flameIcon = 'o'
  let flameColor = '#6B7280'
  const s = habit.streak || 0
  if (s >= 3 && s <= 6) { flameIcon = '*'; flameColor = '#F97316' }
  if (s >= 7 && s <= 13) { flameIcon = '*'; flameColor = '#F97316' }
  if (s >= 14 && s <= 29) { flameIcon = '*'; flameColor = '#F97316' }
  if (s >= 30) { flameIcon = '*'; flameColor = '#C9A84C' }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01, boxShadow: '0 0 15px rgba(201,168,76,0.1)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        onClick={onViewDetails}
        className={`rounded p-3 flex items-center gap-3 transition-all duration-300 cursor-pointer hover:border-[#C9A84C]`}
        style={{
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          ...(doneToday ? { borderColor: 'rgba(74,222,128,0.2)', opacity: 0.7 } : {}),
          ...(isActive ? { borderColor: '#C9A84C', boxShadow: '0 0 16px rgba(201,168,76,0.3)' } : {})
        }}
      >
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-xs leading-tight mb-1 truncate ${doneToday ? 'text-gray-500 line-through' : isProgressive ? 'text-[#C9A84C]' : 'text-[#E8E8E8]'}`}>
            {isProgressive ? `${todayTarget} ${habit.name}` : habit.name}
          </p>
          {doneToday ? (
            <p className="text-green-600 font-mono text-xs">
              COMPLETED TODAY
            </p>
          ) : (
            <p className={isProgressive ? 'text-gray-500 font-mono text-[10px]' : 'text-gray-600 font-mono text-[11px]'}>
              {isProgressive
                ? `DAY ${currentDay}/${habit.progression_days || 1} . ${habit.progression_unit || 'reps'}`
                : (habit.domain || 'HEALTH')}
            </p>
          )}
        </div>
        <div className="text-right mr-2">
          <p className="font-mono text-xs flex items-center justify-end gap-1" style={{ color: flameColor }}>
            {flameIcon} {s}
          </p>
          <p className="text-gray-600 font-mono text-[10px]">STREAK</p>
        </div>
        {doneToday ? (
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full border border-green-600 flex items-center justify-center">
              <span className="text-green-400 text-sm">done</span>
            </div>
            {onUndo && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUndo()
                }}
                className="border border-orange-500/50 text-orange-400
                font-mono text-[9px] px-2 py-1 rounded
                hover:bg-orange-500/10 transition-colors"
              >
                UNDO
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <QuestTimer
                taskId={habit.id}
                taskName={habit.name}
                taskType="habit"
                onComplete={onDone}
                mode="button"
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDone()
              }}
              className="border font-mono text-[11px] px-2 py-1 rounded border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black"
            >
              MARK
            </button>
          </div>
        )}
      </div>
      {!doneToday && (
        <QuestTimer
          taskId={habit.id}
          taskName={habit.name}
          taskType="habit"
          onComplete={onDone}
          hideInactive
        />
      )}
    </motion.div>
  )
}
function SyllabusFrogCard({ profile, syllabus, slice, onCompleted, onUploadCertificate }) {
  const slices = typeof syllabus.slices === 'string'
    ? JSON.parse(syllabus.slices)
    : syllabus.slices
  const total = slices.length
  const isCompleted = slice.completedAt != null
  const isLastSlice = (syllabus.current_slice_index || 0) >= total - 1

  return (
    <div>
      <p className="text-gray-500 font-mono text-xs mb-2">
        SYLLABUS FROG - {syllabus.goal_name}
      </p>
      <div className="border-2 border-[#C9A84C] bg-[#0D1117] rounded p-4 shadow-[0_0_18px_#C9A84C22]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 font-mono text-[11px]">
            DAY {slice.day} OF {total} . {slice.phase}
          </p>
          <p className="text-gray-600 font-mono text-[11px]">
            {slice.estimatedMinutes || 45} MINS
          </p>
        </div>
        <p className="text-[#E8E8E8] font-mono text-sm font-bold mb-2">
          {slice.title}
        </p>
        <p className="text-gray-400 font-mono text-xs leading-relaxed mb-3">
          {slice.description}
        </p>
        {slice.firstStep && (
          <div className="bg-[#080810] border border-gray-700 rounded p-3 mb-3">
            <p className="text-gray-500 font-mono text-[11px] mb-1">FIRST STEP</p>
            <p className="text-[#E8E8E8] font-mono text-xs leading-relaxed">
              {slice.firstStep}
            </p>
          </div>
        )}
        <button
          onClick={onCompleted}
          className="w-full bg-[#C9A84C] text-black font-mono font-bold py-2.5 rounded text-sm"
        >
          COMPLETE SLICE
        </button>

        {/* Certificate Upload Button - Only for completed slices */}
      </div>
    </div>
  )
}

function AddHabitModal({ profile, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('Health')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const DOMAINS = ['Work', 'Health', 'Learning', 'Finance', 'Creative', 'Relationships']

  async function handleSave() {
    if (!name.trim()) {
      setError('Habit name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: insertError } = await supabase.from('daily_habits').insert({
        user_id: user.id,
        name: name.trim(),
        domain,
      })
      if (insertError) throw insertError
      await onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save habit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-[#0D1117] border border-[#C9A84C] rounded-t-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <p className="text-[#C9A84C] font-mono text-xs">ADD HABIT</p>
          <button onClick={onClose} className="text-gray-500 font-mono text-xs">X</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-gray-500 font-mono text-[11px] mb-1 block">HABIT NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 20 minutes of reading"
              className="w-full bg-[#080810] border border-gray-700 rounded px-3 py-2 text-xs text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="text-gray-500 font-mono text-[11px] mb-1 block">DOMAIN</label>
            <div className="grid grid-cols-3 gap-2">
              {DOMAINS.map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`border font-mono text-[11px] py-2 rounded transition-all ${domain === d
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="border border-red-500 bg-red-500/10 rounded px-3 py-2">
              <p className="text-red-400 text-[11px] font-mono">{error}</p>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#C9A84C] text-black font-mono font-bold py-3 rounded text-sm disabled:opacity-70"
          >
            {saving ? 'SAVING...' : 'SAVE HABIT'}
          </button>
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

