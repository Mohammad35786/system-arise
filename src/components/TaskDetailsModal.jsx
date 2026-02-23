import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useTimer } from '../context/TimerContext'
import { parseInputToUnits, distributeUnitsAcrossDays, previewDistribution } from '../lib/syllabusParser'

// Domains used across the app
const DOMAINS = ['Work', 'Health', 'Learning', 'Relationships', 'Creative', 'Finance']
const DURATION_OPTIONS = [3, 7, 14, 30, 60, 90]

export function TaskDetailsModal({
  isOpen,
  task,
  taskType, // 'habit' | 'instant' | 't_do'
  profile,
  onClose,
  onDeleted,
  onComplete,
  onUpdated
}) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Editable fields for all tasks
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [impact, setImpact] = useState(5)
  const [alignment, setAlignment] = useState(5)
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [firstStep, setFirstStep] = useState('')
  const [deadline, setDeadline] = useState('')
  const [streak, setStreak] = useState(0)
  const [fearFlag, setFearFlag] = useState(false)

  // Daily Quest (habit) specific fields
  const [frequency, setFrequency] = useState('DAILY')
  const [customDays, setCustomDays] = useState([])
  const [timeOfDay, setTimeOfDay] = useState('MORNING')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifMinutes, setNotifMinutes] = useState(30)
  const [progressionEnabled, setProgressionEnabled] = useState(false)
  const [progressionStartValue, setProgressionStartValue] = useState('')
  const [progressionTargetValue, setProgressionTargetValue] = useState('')
  const [progressionDays, setProgressionDays] = useState('')
  const [progressionUnit, setProgressionUnit] = useState('')

  // Syllabus (Long Term Plan) specific fields
  const [durationDays, setDurationDays] = useState(7)
  const [units, setUnits] = useState([])
  const [rawInput, setRawInput] = useState('')
  const [priority, setPriority] = useState('A')
  const [scheduledDays, setScheduledDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
  const [manualDistribution, setManualDistribution] = useState(false)

  // Determine if we're editing a habit or instant task
  const isHabit = taskType === 'habit'
  const isSyllabus = taskType === 'syllabus'
  const userDomains = profile?.domains?.length > 0 ? profile.domains : DOMAINS
  const { activeTimerId, startTimer, pauseTimer, resumeTimer } = useTimer()

  const priorityColors = { A: '#EF4444', B: '#F97316', C: '#EAB308', D: '#9CA3AF' }
  const impactToPriority = (i) => i >= 10 ? 'A' : i >= 8 ? 'B' : i >= 5 ? 'C' : 'D'

  const startHunt = () => {
    // startTimer(taskId, taskName, taskType, durationSeconds, musicEnabled)
    startTimer(task.id, name, taskType, estimatedMinutes * 60, true)
    onClose()
  }

  // Syllabus management functions
  const handleUnitEdit = (idx, newName) => {
    const next = [...units]
    next[idx].name = newName
    setUnits(next)
  }

  const handleUnitDayEdit = (idx, day) => {
    const next = [...units]
    next[idx].assignedDay = day ? Number(day) : null
    setUnits(next)
  }

  const handleSubtopicEdit = (uIdx, sIdx, val) => {
    const next = [...units]
    next[uIdx].subtopics[sIdx] = val
    setUnits(next)
  }

  const addSubtopic = (uIdx) => {
    const next = [...units]
    if (!next[uIdx].subtopics) next[uIdx].subtopics = []
    next[uIdx].subtopics.push('New Subtopic')
    setUnits(next)
  }

  const removeSubtopic = (uIdx, sIdx) => {
    const next = [...units]
    next[uIdx].subtopics.splice(sIdx, 1)
    setUnits(next)
  }

  const moveUnit = (idx, dir) => {
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === units.length - 1) return
    const next = [...units]
    const target = dir === 'up' ? idx - 1 : idx + 1
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    setUnits(next)
  }

  const preview = useMemo(() =>
    units.length > 0 ? previewDistribution(units, durationDays, manualDistribution) : [],
    [units, durationDays, manualDistribution]
  )

  useEffect(() => {
    if (task && isOpen) {
      if (isSyllabus) {
        // Syllabus (Long Term Plan) mapping
        setName(task.goal_name || '')
        setDomain(task.domain || userDomains[0] || 'Work')
        const p = task.priority || 'A'
        setPriority(p)
        const PRIORITY_IMPACT = { A: 10, B: 8, C: 5, D: 3 }
        setImpact(PRIORITY_IMPACT[p] || 5)
        setAlignment(PRIORITY_IMPACT[p] || 5)
        setEstimatedMinutes(30)
        setDurationDays(task.duration_days || 7)
        setUnits(task.units || [])
        setRawInput(task.raw_input || '')
        setScheduledDays(task.scheduled_days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
        setManualDistribution(task.distribution_mode === 'manual')
        setFearFlag(false)
      } else {
        setName(task.name || '')
        setDomain(task.domain || userDomains[0] || 'Work')
        setImpact(task.impact || 5)
        setAlignment(task.goal_alignment || task.alignment || 5)
        setEstimatedMinutes(task.estimated_minutes || 30)
        setFirstStep(task.first_step || '')
        setStreak(task.streak || 0)
        setFearFlag(task.fear_flag || false)
      }

      // Daily Quest (habit) mapping
      if (isHabit) {
        const freq = task.frequency || 'DAILY'
        if (Array.isArray(freq)) {
          setFrequency('CUSTOM')
          setCustomDays(freq)
        } else {
          setFrequency(freq)
          setCustomDays([])
        }
        setTimeOfDay(task.time_of_day || 'MORNING')
        setNotifEnabled(task.notification_enabled || false)
        setNotifMinutes(task.notification_minutes || 30)
        setProgressionEnabled(task.progression_enabled || false)
        setProgressionStartValue(task.progression_start_value != null ? String(task.progression_start_value) : '')
        setProgressionTargetValue(task.progression_target_value != null ? String(task.progression_target_value) : '')
        setProgressionDays(task.progression_days != null ? String(task.progression_days) : '')
        setProgressionUnit(task.progression_unit || '')
      }

      // Handle deadline
      if (task.deadline) {
        const date = new Date(task.deadline)
        setDeadline(date.toISOString().slice(0, 10))
      } else {
        setDeadline('')
      }

      setError('')
    }
  }, [task, isOpen, userDomains, isHabit, isSyllabus])

  if (!isOpen || !task) return null

  const handleSave = async () => {
    if (!name.trim()) { setError('TASK NAME IS REQUIRED.'); return }
    setSaving(true)
    setError('')

    try {
      let tableName = 'tasks'
      if (isHabit) tableName = 'daily_habits'
      if (isSyllabus) tableName = 'syllabuses'

      let updateData = {}

      if (isHabit) {
        const frequencyData = frequency === 'CUSTOM' ? customDays : frequency
        updateData = {
          name: name.trim(),
          domain,
          frequency: frequencyData,
          time_of_day: timeOfDay,
          notification_enabled: notifEnabled,
          notification_minutes: notifEnabled ? notifMinutes : 30,
          progression_enabled: progressionEnabled,
          progression_start_value: progressionEnabled ? parseFloat(progressionStartValue) : null,
          progression_target_value: progressionEnabled ? parseFloat(progressionTargetValue) : null,
          progression_days: progressionEnabled ? parseInt(progressionDays, 10) : null,
          progression_unit: progressionEnabled ? (progressionUnit.trim() || 'reps') : null,
        }
      } else if (isSyllabus) {
        const studySlices = distributeUnitsAcrossDays(units, durationDays, manualDistribution)
        updateData = {
          goal_name: name.trim(),
          domain,
          duration_days: durationDays,
          priority: priority,
          units,
          slices: studySlices,
          raw_input: rawInput,
          scheduled_days: scheduledDays,
          distribution_mode: manualDistribution ? 'manual' : 'auto'
        }
      } else {
        updateData = {
          name: name.trim(),
          domain,
          impact,
          goal_alignment: alignment,
          estimated_minutes: estimatedMinutes,
          first_step: firstStep.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          fear_flag: fearFlag,
        }
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', task.id)

      if (updateError) throw updateError

      onUpdated && onUpdated({ ...task, ...updateData })
      onClose()
    } catch (err) {
      setError(err.message || 'FAILED TO SAVE.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      let tableName = 'tasks'
      if (isHabit) tableName = 'daily_habits'
      if (isSyllabus) tableName = 'syllabuses'

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', task.id)

      if (deleteError) throw deleteError

      onDeleted && onDeleted(task)
      onClose()
    } catch (err) {
      setError(err.message || 'FAILED TO DELETE.')
    } finally {
      setDeleting(false)
    }
  }

  const handleComplete = () => {
    onComplete && onComplete(task)
  }

  const getTaskTypeLabel = () => {
    switch (taskType) {
      case 'habit': return 'DAILY QUEST'
      case 'instant': return 'INSTANT TO-DO'
      case 'syllabus': return 'LONG TERM PLAN'
      default: return 'TASK'
    }
  }

  const previewScore = () => {
    if (isHabit) return 0
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

  // Render form fields for habits (Daily Quest)
  const renderHabitForm = () => (
    <div className="space-y-4">
      {/* Habit Name */}
      <div>
        <label className="text-gray-500 font-mono text-xs mb-1 block">HABIT NAME *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. 20 minutes of reading"
          className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]"
        />
      </div>

      {/* Domain */}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-gray-500 font-mono text-xs mb-2 block">FREQUENCY</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-2 py-2 text-xs text-[#E8E8E8] font-mono focus:outline-none focus:border-[#C9A84C]"
          >
            {['DAILY', 'MON-FRI', 'WEEKENDS', 'CUSTOM'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-500 font-mono text-xs mb-2 block">TIME</label>
          <select
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-2 py-2 text-xs text-[#E8E8E8] font-mono focus:outline-none focus:border-[#C9A84C]"
          >
            {['MORNING', 'AFTERNOON', 'EVENING'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {frequency === 'CUSTOM' && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
            <button
              key={day}
              onClick={() => {
                setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
              }}
              className={`border font-mono text-[10px] px-2 py-1 rounded transition-all ${customDays.includes(day)
                ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                : 'border-gray-700 text-gray-600'
                }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Persistence / Progression Group */}
      <div className="bg-[#0A0A0F] border border-gray-800 rounded p-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] font-mono text-xs font-bold">PROGRESSION GOAL</p>
            <p className="text-gray-500 font-mono text-[10px]">Auto-increases target daily</p>
          </div>
          <button
            onClick={() => setProgressionEnabled(!progressionEnabled)}
            className={`w-10 h-5 rounded-full relative transition-colors ${progressionEnabled ? 'bg-[#C9A84C]' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${progressionEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {progressionEnabled && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-500 font-mono text-[10px] mb-1 block">START VALUE</label>
                <input
                  type="number"
                  value={progressionStartValue}
                  onChange={e => setProgressionStartValue(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#C9A84C]"
                />
              </div>
              <div>
                <label className="text-gray-500 font-mono text-[10px] mb-1 block">TARGET VALUE</label>
                <input
                  type="number"
                  value={progressionTargetValue}
                  onChange={e => setProgressionTargetValue(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#C9A84C]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-500 font-mono text-[10px] mb-1 block">DAYS</label>
                <input
                  type="number"
                  value={progressionDays}
                  onChange={e => setProgressionDays(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#C9A84C]"
                />
              </div>
              <div>
                <label className="text-gray-500 font-mono text-[10px] mb-1 block">UNIT</label>
                <input
                  type="text"
                  value={progressionUnit}
                  onChange={e => setProgressionUnit(e.target.value)}
                  placeholder="reps, mins..."
                  className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#C9A84C]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
          <p className="text-gray-500 font-mono text-xs">CURRENT STREAK</p>
          <p className="text-[#C9A84C] font-mono text-lg font-bold">{streak} days</p>
        </div>
      </div>
    </div>
  )

  // Render form fields for instant tasks
  const renderInstantForm = () => (
    <div className="space-y-5">
      {/* Task Name */}
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

      {/* Domain */}
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

      {/* Priority (Impact mapped) */}
      <div>
        <label className="text-gray-500 font-mono text-xs mb-2 block">PRIORITY</label>
        <div className="flex gap-1">
          {['A', 'B', 'C', 'D'].map(p => {
            const PRIORITY_IMPACT = { A: 10, B: 8, C: 5, D: 3 }
            const isSelected = impactToPriority(impact) === p
            return (
              <button
                key={p}
                onClick={() => {
                  setImpact(PRIORITY_IMPACT[p])
                  setAlignment(PRIORITY_IMPACT[p])
                }}
                className={`flex-1 py-2 rounded border font-mono text-xs transition-all ${isSelected
                  ? 'border-transparent text-black'
                  : 'border-gray-700 text-gray-500'
                  }`}
                style={{ backgroundColor: isSelected ? priorityColors[p] : 'transparent' }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Estimated Time */}
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

      {/* Deadline */}
      <div>
        <label className="text-gray-500 font-mono text-xs mb-1 block">
          DEADLINE <span className="text-gray-700">(boosts urgency score)</span>
        </label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono focus:outline-none focus:border-[#C9A84C]"
        />
      </div>

      {/* First Step */}
      <div>
        <label className="text-gray-500 font-mono text-xs mb-1 block">FIRST MICRO-STEP</label>
        <p className="text-gray-700 font-mono text-xs mb-2 italic">
          The single first action to beat procrastination.
        </p>
        <input
          type="text"
          value={firstStep}
          onChange={e => setFirstStep(e.target.value)}
          placeholder="e.g. Open the document and write one line"
          className="w-full bg-[#0A0A0F] border border-gray-600 rounded px-3 py-2.5 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]"
        />
      </div>

      {/* Fear Flag */}
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
            ⚠️ YES — AVOIDING
          </button>
          <button onClick={() => setFearFlag(false)}
            className={`border-2 font-mono py-3 rounded text-xs font-bold transition-all ${!fearFlag
              ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
              : 'border-gray-700 text-gray-600'
              }`}>
            ✅ NO — READY
          </button>
        </div>
      </div>

      {/* Score Preview */}
      <div className="bg-[#0A0A0F] border border-gray-800 rounded p-3">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 font-mono text-xs">SYSTEM SCORE</p>
          <p className="text-[#C9A84C] font-mono text-lg font-bold">{previewScore()}</p>
        </div>
        <p className="text-gray-700 font-mono text-xs mt-1">
          {previewScore() >= 40
            ? '🔥 HIGH PRIORITY — LIKELY YOUR FROG'
            : previewScore() >= 25
              ? '—— MEDIUM PRIORITY'
              : '—— LOW PRIORITY'}
        </p>
      </div>
    </div>
  )

  // Render form fields for syllabuses (Long Term Plan)
  const renderSyllabusForm = () => (
    <div className="space-y-6">
      {/* GOAL CONFIG */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-gray-500 font-mono text-[11px] mb-1 block uppercase">Goal Identifier *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Master React, Python Backend..."
            className="w-full bg-black border border-gray-800 rounded-lg px-3 py-3 text-sm text-white font-mono focus:border-[#A78BFA] transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-gray-500 font-mono text-[11px] mb-1 block uppercase">Domain</label>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-2 py-2 text-xs text-white font-mono"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex-[0.6]">
            <label className="text-gray-500 font-mono text-[11px] mb-1 block uppercase">Days (1-21)</label>
            <input
              type="number"
              min="1"
              max="21"
              value={durationDays}
              onChange={e => setDurationDays(Math.min(21, Math.max(1, Number(e.target.value))))}
              className="w-full bg-black border border-gray-800 rounded-lg px-2 py-2 text-xs text-white font-mono focus:border-[#A78BFA]"
            />
          </div>
          <div className="flex-1">
            <label className="text-gray-500 font-mono text-[11px] mb-1 block uppercase">Rank</label>
            <select
              value={priority}
              onChange={e => {
                setPriority(e.target.value)
                const PRIORITY_IMPACT = { A: 10, B: 8, C: 5, D: 3 }
                setImpact(PRIORITY_IMPACT[e.target.value])
              }}
              className="w-full bg-black border border-gray-800 rounded-lg px-2 py-2 text-xs text-white font-mono"
            >
              {['A', 'B', 'C', 'D'].map(p => <option key={p} value={p}>RANK {p}</option>)}
            </select>
          </div>
        </div>

        {/* STUDY DAYS */}
        <div>
          <label className="text-gray-500 font-mono text-[11px] mb-2 block uppercase">Study Schedule</label>
          <div className="flex gap-1 flex-wrap">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
              const isActive = scheduledDays.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => {
                    setScheduledDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
                  }}
                  className={`border font-mono text-[10px] px-1 py-2 rounded flex-1 transition-all ${isActive
                    ? 'border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA]'
                    : 'border-gray-800 text-gray-700 hover:border-gray-700'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* SYLLABUS STEP */}
      {units.length === 0 ? (
        <div className="space-y-3">
          <label className="text-gray-500 font-mono text-[11px] uppercase block">Input Syllabus Blueprint</label>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            rows={8}
            placeholder="Unit 1: Fundamentals&#10;  - Concept A&#10;  - Concept B..."
            className="w-full bg-[#0A0A0F] border border-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono focus:border-[#A78BFA] resize-none leading-relaxed"
          />
          <button
            onClick={() => setUnits(parseInputToUnits(rawInput))}
            disabled={!rawInput.trim()}
            className="w-full py-2 border border-[#A78BFA]/30 text-[#A78BFA] font-mono text-[11px] rounded bg-[#A78BFA]/5 hover:bg-[#A78BFA]/10 transition-colors"
          >
            PARSE SYLLABUS BLUEPRINT
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-500 font-mono text-[11px] uppercase">Unit Architect [{units.length}]</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualDistribution(!manualDistribution)}
                className={`text-[9px] font-mono border px-1.5 py-1 rounded transition-all ${manualDistribution
                  ? 'border-[#A78BFA] text-[#A78BFA]'
                  : 'border-gray-800 text-gray-600'
                  }`}
              >
                {manualDistribution ? 'MANUAL' : 'AUTO'}
              </button>
              <button
                onClick={() => { setUnits([]); setRawInput('') }}
                className="text-red-500 text-[9px] font-mono hover:underline"
              >
                RESET
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {units.map((u, uIdx) => (
              <div key={uIdx} className="bg-[#0A0A0F] border border-gray-800 rounded-xl p-3 space-y-2 group">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUnit(uIdx, 'up')} className="text-gray-700 hover:text-white text-[10px]">▲</button>
                    <button onClick={() => moveUnit(uIdx, 'down')} className="text-gray-700 hover:text-white text-[10px]">▼</button>
                  </div>
                  <input
                    value={u.name}
                    onChange={e => handleUnitEdit(uIdx, e.target.value)}
                    className="flex-1 bg-transparent border-b border-gray-800 focus:border-[#A78BFA] text-xs text-white font-mono px-1 py-0.5"
                  />

                  {manualDistribution && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-mono text-[9px]">DY</span>
                      <input
                        type="number"
                        min="1"
                        max={durationDays}
                        value={u.assignedDay || ''}
                        onChange={e => handleUnitDayEdit(uIdx, e.target.value)}
                        placeholder="--"
                        className="w-8 bg-black border border-gray-800 rounded text-[10px] text-[#A78BFA] font-mono px-0.5 py-0.5 text-center focus:border-[#A78BFA]"
                      />
                    </div>
                  )}

                  <button onClick={() => {
                    const next = [...units]; next.splice(uIdx, 1); setUnits(next)
                  }} className="text-gray-700 hover:text-red-500 text-[10px]">✕</button>
                </div>
                <div className="pl-6 space-y-2">
                  {u.subtopics?.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <span className="text-gray-700 text-[10px]">—</span>
                      <input
                        value={s}
                        onChange={e => handleSubtopicEdit(uIdx, sIdx, e.target.value)}
                        className="flex-1 bg-transparent border-b border-gray-900 focus:border-gray-700 text-[10px] text-gray-400 font-mono py-0.5"
                      />
                      <button onClick={() => removeSubtopic(uIdx, sIdx)} className="text-gray-800 hover:text-red-500 text-[9px]">✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtopic(uIdx)}
                    className="text-[9px] text-gray-600 hover:text-[#A78BFA] font-mono flex items-center gap-1"
                  >
                    ＋ ADD SUBTOPIC
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setUnits([...units, { name: 'New Unit', subtopics: [] }])}
              className="w-full py-2 border border-dashed border-gray-800 text-gray-600 font-mono text-[10px] rounded hover:border-gray-600 hover:text-gray-400"
            >
              ＋ ADD NEW UNIT
            </button>
          </div>
        </div>
      )}

      {/* DISTRIBUTION PREVIEW */}
      {units.length > 0 && (
        <div className="bg-[#080810] border border-gray-900 rounded-lg p-3 space-y-3">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Projection Across {durationDays} Days</p>
          <div className="grid grid-cols-2 gap-2">
            {preview.slice(0, 4).map(p => (
              <div key={p.day} className="text-[10px] font-mono border-l-2 border-[#A78BFA]/30 pl-2">
                <span className="text-gray-600 block">D{p.day}</span>
                <span className="text-gray-300 truncate block">{p.unitNames.slice(0, 2).join(', ') || 'Review'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-[#0D1117] border border-[#C9A84C] rounded-t-xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <p className="text-[#C9A84C] font-mono text-xs">{getTaskTypeLabel()} DETAILS</p>
            {!isHabit && !isSyllabus && (
              <p className="text-gray-600 font-mono text-xs">
                SCORE: <span className="text-[#C9A84C]">{previewScore()}</span>
              </p>
            )}
            {isSyllabus && (
              <p className="text-gray-600 font-mono text-xs">
                CAMPAGIN STATUS: <span className="text-[#A78BFA]">ACTIVE</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 font-mono text-xs">✕ CLOSE</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
              <p className="text-red-400 font-mono text-xs">{error}</p>
            </div>
          )}

          {/* Render appropriate form based on task type */}
          {isHabit ? renderHabitForm() : isSyllabus ? renderSyllabusForm() : renderInstantForm()}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Timer / Hunt Button */}
            {!isHabit && !isSyllabus && (
              <button
                onClick={startHunt}
                className={`w-full font-mono text-sm font-bold py-3 rounded transition-colors ${activeTimerId === String(task.id)
                  ? 'bg-[#C9A84C]/20 border border-[#C9A84C] text-[#C9A84C]'
                  : 'bg-[#C9A84C] border border-[#C9A84C] text-black hover:bg-[#D4B85C]'
                  }`}
              >
                {activeTimerId === String(task.id) ? '🗡️ HUNT IN PROGRESS' : '🗡️ START HUNT (TIMER)'}
              </button>
            )}


            {/* Complete Action */}
            <button
              onClick={handleComplete}
              className="w-full bg-green-500/10 border border-green-500 text-green-400 font-mono text-sm font-bold py-3 rounded hover:bg-green-500/20 transition-colors"
            >
              ✅ MARK AS COMPLETE
            </button>

            {/* Save Changes */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#C9A84C]/10 border border-[#C9A84C] text-[#C9A84C] font-mono text-sm py-3 rounded hover:bg-[#C9A84C]/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'SAVING...' : '💾 SAVE CHANGES'}
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full bg-red-500/10 border border-red-500 text-red-400 font-mono text-sm py-3 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? 'DELETING...' : '🗑️ DELETE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
