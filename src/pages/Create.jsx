import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { supabase } from '../lib/supabase'
import { parseInputToUnits, distributeUnitsAcrossDays, previewDistribution } from '../lib/syllabusParser'
import { notify, logActivity } from '../lib/notificationEngine'
import { getTodayTarget, getCurrentDay } from '../lib/progressionEngine'
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

const DOMAINS = ['Work', 'Health', 'Learning', 'Finance', 'Creative', 'Relationships']
const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DURATION_OPTIONS = [3, 7, 14, 30, 60, 90]

// ─── Section Card ───────────────────────────────────────────────────────────
function SectionCard({ id, icon, title, subtitle, color, isOpen, onToggle, children }) {
  return (
    <motion.div
      variants={cardVariants}
      layout
      className="corners relative rounded-xl overflow-hidden"
      style={{
        background: 'rgba(10,10,26,0.95)',
        border: (isOpen && id === 'longterm')
          ? '1px solid rgba(167,139,250,0.2)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          <span className="text-[#C9A84C] text-sm">{icon}</span>
        </div>

        <div className="flex-1">
          <p className="font-mono text-sm font-bold text-[#E8E8E8]">{title}</p>
          <p className="font-mono text-[10px] text-gray-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        <motion.span
          animate={{
            rotate: isOpen ? 180 : 0
          }}
          transition={{ duration: 0.2 }}
          className="text-[#C9A84C] text-xs opacity-60"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent mb-4" />
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Daily Routine Section ───────────────────────────────────────────────────


// ─── Instant Work Section ─────────────────────────────────────────────────────
function InstantWorkSection({ profile }) {
  const navigate = useNavigate()
  const [instantTasks, setInstantTasks] = useState([])
  const [instantInput, setInstantInput] = useState('')
  const [instantPriority, setInstantPriority] = useState('A')
  const [instantDomain, setInstantDomain] = useState('Work')
  const [instantDeadline, setInstantDeadline] = useState('')
  const [instantFear, setInstantFear] = useState(false)
  const [instantSaving, setInstantSaving] = useState(false)

  // Manage panel states
  const [showManage, setShowManage] = useState(false)
  const [existingTasks, setExistingTasks] = useState([])
  const [editingId, setEditingId] = useState(null)

  const loadExisting = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('sort_order', { ascending: true })
        .order('impact', { ascending: false })
      if (data) setExistingTasks(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    if (showManage) loadExisting()
  }, [showManage, loadExisting])

  function addToList() {
    if (!instantInput.trim()) return
    setInstantTasks(prev => [...prev, {
      id: Date.now(),
      name: instantInput.trim(),
      priority: instantPriority,
      domain: instantDomain,
      deadline: instantDeadline,
      fear_flag: instantFear,
    }])
    setInstantInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addToList()
    }
  }

  async function dispatchTasks() {
    if (instantTasks.length === 0) return
    setInstantSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const PRIORITY_IMPACT = { A: 10, B: 8, C: 5, D: 3 }
      for (const t of instantTasks) {
        await supabase.from('tasks').insert({
          user_id: user.id,
          name: t.name,
          domain: t.domain || 'Work',
          impact: PRIORITY_IMPACT[t.priority] || 5,
          goal_alignment: PRIORITY_IMPACT[t.priority] || 5,
          estimated_minutes: 30,
          deadline: t.deadline ? new Date(t.deadline).toISOString() : null,
          fear_flag: t.fear_flag || false,
          completed: false,
        })
      }
      setInstantTasks([])
      setInstantInput('')
      setTimeout(() => navigate('/home'), 1500)
    } catch (err) {
      console.error('dispatchTasks error:', err)
    } finally {
      setInstantSaving(false)
    }
  }

  // Management functions
  async function deleteTask(id) {
    if (!window.confirm('DELETE THIS TASK?')) return
    await supabase.from('tasks').delete().eq('id', id)
    loadExisting()
  }

  async function reorderTask(id, direction) {
    const idx = existingTasks.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === existingTasks.length - 1) return

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    const taskA = existingTasks[idx]
    const taskB = existingTasks[targetIdx]

    // Swap sort_order
    const orderA = taskA.sort_order || 0
    const orderB = taskB.sort_order || 0

    await Promise.all([
      supabase.from('tasks').update({ sort_order: orderB }).eq('id', taskA.id),
      supabase.from('tasks').update({ sort_order: orderA }).eq('id', taskB.id)
    ])
    loadExisting()
  }

  const priorityColors = { A: '#EF4444', B: '#F97316', C: '#EAB308', D: '#9CA3AF' }
  const impactToPriority = (i) => i >= 10 ? 'A' : i >= 8 ? 'B' : i >= 5 ? 'C' : 'D'

  return (
    <div className="space-y-4">
      {/* STEP 1: Input Row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={instantInput}
          onChange={e => setInstantInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type task and press Enter or ＋"
          className="system-input flex-1"
        />
        <button
          onClick={addToList}
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl transition-all"
          style={{
            background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
            color: '#000000',
            boxShadow: '0 0 15px rgba(201,168,76,0.2)',
          }}
        >
          ＋
        </button>
      </div>

      {/* STEP 3: Settings Row */}
      <div className="space-y-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Priority</label>
            </div>
            <div className="flex gap-1">
              {['A', 'B', 'C', 'D'].map(p => (
                <button
                  key={p}
                  onClick={() => setInstantPriority(p)}
                  className="flex-1 py-2 rounded font-mono text-[11px] transition-all"
                  style={instantPriority === p ? {
                    background: 'rgba(201,168,76,0.15)',
                    border: '1px solid rgba(201,168,76,0.5)',
                    color: '#C9A84C',
                  } : {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#6B7280',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Domain</label>
            </div>
            <select
              value={instantDomain}
              onChange={e => setInstantDomain(e.target.value)}
              className="system-input"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Deadline</label>
            </div>
            <input
              type="date"
              value={instantDeadline}
              onChange={e => setInstantDeadline(e.target.value)}
              className="system-input"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">Fear Flag</label>
            <button
              onClick={() => setInstantFear(!instantFear)}
              className={`w-8 h-4 rounded-full relative transition-colors ${instantFear ? 'bg-red-500/60' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${instantFear ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2: Staging List */}
      <AnimatePresence>
        {instantTasks.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider px-1">Staged Missions</p>
            {instantTasks.map(t => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-black font-bold text-[10px]" style={{ backgroundColor: priorityColors[t.priority] }}>
                  {t.priority}
                </span>
                <span className="flex-1 text-xs text-gray-300 font-mono truncate">{t.name}</span>
                <button
                  onClick={() => setInstantTasks(prev => prev.filter(it => it.id !== t.id))}
                  className="text-gray-500 hover:text-red-400 p-1"
                >✕</button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* STEP 4: Dispatch Button */}
      <button
        onClick={dispatchTasks}
        disabled={instantTasks.length === 0 || instantSaving}
        className="w-full py-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
          backgroundSize: '200% 100%',
          color: '#000000',
          boxShadow: '0 0 20px rgba(201,168,76,0.3)',
        }}
      >
        {instantSaving ? 'DISPATCHING...' : `DISPATCH ${instantTasks.length} MISSIONS TO DUNGEON`}
      </button>

      {/* ─── MANAGE PANEL ─── */}
      <div className="mt-6">
        <button
          onClick={() => setShowManage(!showManage)}
          className="w-full flex items-center justify-between gap-2 border border-white/5 rounded-lg px-3 py-2.5 text-gray-500 hover:text-gray-300 transition-colors bg-white/5"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">☰ Manage Existing Dungeon Logs ({existingTasks.length})</span>
          <motion.span
            animate={{ rotate: showManage ? 180 : 0 }}
            className="text-[10px]"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {showManage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-2 overflow-hidden"
            >
              {existingTasks.length === 0 ? (
                <p className="text-gray-700 font-mono text-[10px] py-8 text-center italic">DUNGEON LOG IS EMPTY</p>
              ) : (
                existingTasks.map(t => {
                  const isEditing = editingId === t.id
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="flex flex-col gap-1">
                        <button onClick={() => reorderTask(t.id, 'up')} className="text-gray-700 hover:text-gray-400 text-[10px]">▲</button>
                        <button onClick={() => reorderTask(t.id, 'down')} className="text-gray-700 hover:text-gray-400 text-[10px]">▼</button>
                      </div>
                      <span className="w-5 h-5 rounded flex items-center justify-center text-black font-bold text-[10px]" style={{ backgroundColor: priorityColors[impactToPriority(t.impact)] }}>
                        {impactToPriority(t.impact)}
                      </span>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={t.name}
                            onBlur={async (e) => {
                              await supabase.from('tasks').update({ name: e.target.value }).eq('id', t.id)
                              setEditingId(null)
                              loadExisting()
                            }}
                            className="system-input py-1 text-[11px]"
                          />
                        ) : (
                          <p onClick={() => setEditingId(t.id)} className="text-gray-300 font-mono text-[11px] truncate cursor-text">{t.name}</p>
                        )}
                        <p className="text-gray-600 font-mono text-[9px] uppercase tracking-tighter mt-0.5">{t.domain} {t.deadline ? `· ${new Date(t.deadline).toLocaleDateString()}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(t.id)}
                          className="border border-gray-700 text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] font-mono text-[9px] px-2 py-1 rounded transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="border border-red-500/20 text-red-500/50 hover:border-red-500/50 hover:text-red-400 font-mono text-[9px] px-2 py-1 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Daily Routine Section ───────────────────────────────────────────────────
function DailyRoutineSection({ profile }) {
  const [habitName, setHabitName] = useState('')
  const [domain, setDomain] = useState('Work')
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
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Manage panel states
  const [showManage, setShowManage] = useState(false)
  const [existingHabits, setExistingHabits] = useState([])
  const [editingId, setEditingId] = useState(null)

  const loadExisting = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('daily_habits').select('*').eq('user_id', user.id)
      if (data) setExistingHabits(data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => {
    if (showManage) loadExisting()
  }, [showManage, loadExisting])

  async function deleteHabit(id) {
    if (!window.confirm('DELETE THIS HABIT?')) return
    await supabase.from('daily_habits').delete().eq('id', id)
    loadExisting()
  }

  const freqOptions = ['DAILY', 'MON-FRI', 'WEEKENDS', 'CUSTOM']
  const timeOptions = ['MORNING', 'AFTERNOON', 'EVENING']

  function toggleDay(day) {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    if (!habitName.trim() || !profile) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const frequencyData = frequency === 'CUSTOM' ? customDays : frequency

      await supabase.from('daily_habits').insert({
        user_id: user.id,
        name: habitName.trim(),
        domain,
        frequency: frequencyData,
        time_of_day: timeOfDay,
        notification_enabled: notifEnabled,
        notification_minutes: notifEnabled ? notifMinutes : 30,
        progression_enabled: progressionEnabled,
        progression_start_value: progressionEnabled ? parseFloat(progressionStartValue) : null,
        progression_target_value: progressionEnabled ? parseFloat(progressionTargetValue) : null,
        progression_days: progressionEnabled ? parseInt(progressionDays, 10) : null,
        progression_start_date: progressionEnabled ? new Date().toISOString().split('T')[0] : null,
        progression_unit: progressionEnabled ? (progressionUnit.trim() || 'reps') : null,
      })

      await notify(user.id, 'system', 'HABIT ADDED', `${habitName.trim()} added to your daily routine.`)

      setSuccess(true)
      setHabitName('')
      setProgressionEnabled(false)
      setProgressionStartValue('')
      setProgressionTargetValue('')
      setProgressionDays('')
      setProgressionUnit('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-[#4ADE80] font-mono text-sm font-bold">HABIT ADDED TO YOUR DAILY ROUTINE</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
          <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Habit Name</label>
        </div>
        <input
          type="text"
          value={habitName}
          onChange={e => setHabitName(e.target.value)}
          placeholder="e.g. Morning run, Read 20 pages, Meditate..."
          className="system-input"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
          <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Domain</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="py-2 rounded font-mono text-[11px] transition-all"
              style={domain === d ? {
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.5)',
                color: '#C9A84C',
              } : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#6B7280',
              }}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Frequency</label>
          </div>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            className="system-input"
          >
            {freqOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Time</label>
          </div>
          <select
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            className="system-input"
          >
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {frequency === 'CUSTOM' && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {DAYS_OF_WEEK.map(day => {
            const isSelected = customDays.includes(day)
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="px-2 py-1 rounded font-mono text-[10px] transition-all flex-1"
                style={isSelected ? {
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.5)',
                  color: '#C9A84C',
                } : {
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#6B7280',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      )}

      <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[#C9A84C] font-mono text-[11px] font-bold">PROGRESSION GOAL</p>
            <p className="text-gray-500 font-mono text-[10px]">System auto-increases target daily</p>
          </div>
          <button
            type="button"
            onClick={() => setProgressionEnabled(prev => !prev)}
            className={`w-10 h-5 rounded-full relative transition-colors ${progressionEnabled ? 'bg-[#C9A84C]/60' : 'bg-gray-800'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${progressionEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {progressionEnabled && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
                <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Starting Value</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={progressionStartValue}
                  onChange={e => setProgressionStartValue(e.target.value)}
                  className="system-input"
                />
                <input
                  type="text"
                  value={progressionUnit}
                  onChange={e => setProgressionUnit(e.target.value)}
                  placeholder="reps, mins, pages..."
                  className="system-input"
                />
              </div>
              <p className="text-gray-600 font-mono text-[10px] mt-1 italic">
                e.g. {progressionStartValue || '10'} {progressionUnit.trim() || 'push ups'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
                <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Target Value</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={progressionTargetValue}
                  onChange={e => setProgressionTargetValue(e.target.value)}
                  className="system-input"
                />
                <div className="bg-[#080810] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono flex items-center">
                  {(progressionUnit.trim() || 'reps').toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
                <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Days to Reach Target</label>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {[7, 14, 21, 30, 60, 90].map(d => {
                  const isSelected = String(d) === progressionDays
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setProgressionDays(String(d))}
                      className="py-2 rounded font-mono text-[10px] transition-all"
                      style={isSelected ? {
                        background: 'rgba(201,168,76,0.15)',
                        border: '1px solid rgba(201,168,76,0.5)',
                        color: '#C9A84C',
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#6B7280',
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <input
                type="number"
                min="1"
                placeholder="Custom days"
                value={progressionDays}
                onChange={e => setProgressionDays(e.target.value)}
                className="system-input"
              />
            </div>

            {(() => {
              const start = parseFloat(progressionStartValue)
              const target = parseFloat(progressionTargetValue)
              const days = parseInt(progressionDays, 10)
              if (!Number.isFinite(start) || !Number.isFinite(target) || !Number.isFinite(days) || days <= 0) return null
              const increment = (target - start) / days
              const unit = progressionUnit.trim() || 'reps'
              return (
                <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-mono">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Growth Projection</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-600">DAILY INCREASE</p>
                      <p className="text-[#C9A84C] text-sm font-bold">+{increment.toFixed(1)} {unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-600 uppercase">Final Phase</p>
                      <p className="text-gray-400 text-[10px]">{Math.round(start)} → <span className="text-[#C9A84C]">{Math.round(target)}</span> {unit}</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !habitName.trim()}
        className="w-full py-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #4ADE80 0%, #22C3EE 100%)',
          color: '#000000',
          boxShadow: '0 0 20px rgba(74,222,128,0.2)',
        }}
      >
        {saving ? 'SAVING...' : 'SAVE SYSTEM HABIT'}
      </button>

      {/* ─── MANAGE PANEL ─── */}
      <div className="mt-6">
        <button
          onClick={() => setShowManage(!showManage)}
          className="w-full flex items-center justify-between gap-2 border border-white/5 rounded-lg px-3 py-2.5 text-gray-500 hover:text-gray-300 transition-colors bg-white/5"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">☰ Manage Daily Protocols ({existingHabits.length})</span>
          <motion.span
            animate={{ rotate: showManage ? 180 : 0 }}
            className="text-[10px]"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {showManage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-2 overflow-hidden"
            >
              {existingHabits.map(h => {
                const isEditing = editingId === h.id
                const todayTarget = getTodayTarget(h)
                const currentDay = getCurrentDay(h)
                return (
                  <motion.div
                    key={h.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          defaultValue={h.name}
                          onBlur={async (e) => {
                            await supabase.from('daily_habits').update({ name: e.target.value }).eq('id', h.id)
                            setEditingId(null)
                            loadExisting()
                          }}
                          className="system-input py-1 text-[11px]"
                        />
                      ) : (
                        <p onClick={() => setEditingId(h.id)} className="text-gray-300 font-mono text-[11px] truncate">{h.name}</p>
                      )}
                      <p className="text-gray-600 font-mono text-[9px] uppercase tracking-tighter mt-0.5">{h.domain} · STREAK: {h.streak || 0}</p>
                      {h.progression_enabled && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[#C9A84C] font-mono text-[8px] border border-[#C9A84C]/30 px-1 rounded">PROGRESSIVE</span>
                          <span className="text-gray-500 font-mono text-[8px] uppercase">
                            DAY {currentDay}/{h.progression_days || 1} · TARGET: {todayTarget ?? 0} {(h.progression_unit || 'reps')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(h.id)}
                        className="border border-gray-700 text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] font-mono text-[9px] px-2 py-1 rounded transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => deleteHabit(h.id)}
                        className="border border-red-500/20 text-red-500/50 hover:border-red-500/50 hover:text-red-400 font-mono text-[9px] px-2 py-1 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Long Term Plan Section ──────────────────────────────────────────────────
function LongTermPlanSection({ profile }) {
  const navigate = useNavigate()
  const [goalName, setGoalName] = useState('')
  const [duration, setDuration] = useState(7)
  const [domain, setDomain] = useState('Work')
  const [rawInput, setRawInput] = useState('')
  const [units, setUnits] = useState([])
  const [slicing, setSlicing] = useState(false)
  const [slicePhase, setSlicePhase] = useState(0)
  const [manualPriority, setManualPriority] = useState('A')
  const [day1Title, setDay1Title] = useState('')
  const [scheduledDays, setScheduledDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
  const [manualDistribution, setManualDistribution] = useState(false)

  // Manage panel states
  const [showManage, setShowManage] = useState(false)
  const [existingPlans, setExistingPlans] = useState([])

  const loadExisting = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('syllabuses').select('*').eq('user_id', user.id).neq('status', 'abandoned')
      if (data) setExistingPlans(data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => {
    if (showManage) loadExisting()
  }, [showManage, loadExisting])

  // Sync units from rawInput if units are empty
  useEffect(() => {
    if (rawInput.trim() && units.length === 0) {
      setUnits(parseInputToUnits(rawInput))
    }
  }, [rawInput, units.length])

  function handleUnitEdit(idx, newName) {
    const next = [...units]
    next[idx].name = newName
    setUnits(next)
  }

  function handleUnitDayEdit(idx, day) {
    const next = [...units]
    next[idx].assignedDay = day ? Number(day) : null
    setUnits(next)
  }

  function handleSubtopicEdit(uIdx, sIdx, val) {
    const next = [...units]
    next[uIdx].subtopics[sIdx] = val
    setUnits(next)
  }

  function addSubtopic(uIdx) {
    const next = [...units]
    next[uIdx].subtopics.push('New Subtopic')
    setUnits(next)
  }

  function removeSubtopic(uIdx, sIdx) {
    const next = [...units]
    next[uIdx].subtopics.splice(sIdx, 1)
    setUnits(next)
  }

  function moveUnit(idx, dir) {
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === units.length - 1) return
    const next = [...units]
    const target = dir === 'up' ? idx - 1 : idx + 1
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    setUnits(next)
  }

  const preview = units.length > 0 ? previewDistribution(units, duration, manualDistribution) : []
  const canSlice = goalName.trim().length >= 2 && duration > 0 && units.length > 0

  async function handleSlice() {
    if (!canSlice || !profile || slicing) return

    // In manual mode, ensure units have assigned days, otherwise distribute auto.
    const slices = distributeUnitsAcrossDays(units, duration, manualDistribution)
    setDay1Title(slices[0]?.title || '')
    setSlicing(true)
    setSlicePhase(0)

    const timers = [
      setTimeout(() => setSlicePhase(1), 400),
      setTimeout(() => setSlicePhase(2), 1200),
      setTimeout(() => setSlicePhase(3), 2000),
      setTimeout(() => setSlicePhase(4), 2800),
      setTimeout(() => setSlicePhase(5), 3500),
      setTimeout(() => setSlicePhase(6), 4200),
      setTimeout(async () => {
        setSlicePhase(7)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const priorityToUse = manualPriority || 'A'
          setManualPriority(priorityToUse)

          await supabase.from('syllabuses').insert({
            user_id: user.id,
            goal_name: goalName.trim(),
            duration_days: duration,
            domain,
            priority: priorityToUse,
            raw_input: rawInput,
            units: units,
            slices,
            current_slice_index: 0,
            status: 'active',
            scheduled_days: scheduledDays,
            distribution_mode: manualDistribution ? 'manual' : 'auto'
          })
          await notify(user.id, 'system', 'PLAN ACTIVATED', `${goalName.trim()} is now live. RANK: ${priorityToUse}`)
          await logActivity(user.id, 'slice', `Plan Activation`, `Forged ${goalName.trim()}`, 0)
        } catch (err) { console.error(err) }
      }, 5000),
      setTimeout(() => navigate('/home'), 5800),
    ]
    return () => timers.forEach(clearTimeout)
  }

  async function abandonPlan(id) {
    if (!window.confirm('ABANDON THIS PLAN? ALL PROGRESS WILL BE LOST.')) return
    await supabase.from('syllabuses').update({ status: 'abandoned' }).eq('id', id)
    loadExisting()
  }

  if (slicing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-mono">
        {slicePhase >= 1 && slicePhase < 4 && <div className="text-[12rem] animate-pulse">🐸</div>}
        {slicePhase >= 2 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 h-px w-full bg-[#A78BFA] animate-[slash_0.4s_ease-out_forwards]" />
            <div className="absolute top-1/2 h-px w-full bg-[#A78BFA] animate-[slash_0.4s_ease-out_0.2s_forwards]" />
            <div className="absolute top-3/4 h-px w-full bg-[#A78BFA] animate-[slash_0.4s_ease-out_0.4s_forwards]" />
          </div>
        )}
        <div className="relative z-10 text-center space-y-6 px-8">
          {slicePhase >= 4 && (
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-[#A78BFA]">PLAN FORGED</h2>
              <p className="text-[#A78BFA]/60 text-sm">RANK: {manualPriority}</p>
            </div>
          )}
          {slicePhase >= 5 && day1Title && (
            <div className="bg-[#0D1117] border border-[#A78BFA]/30 p-4 rounded-xl">
              <p className="text-[10px] text-gray-500 mb-1">INITIAL FROG:</p>
              <p className="text-white text-sm">{day1Title}</p>
            </div>
          )}
          {slicePhase >= 6 && <p className="text-[#A78BFA] animate-bounce">DIVIDING INTO DAILY MISSIONS...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GOAL CONFIG */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Goal Identifier</label>
          </div>
          <input
            type="text"
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
            placeholder="e.g. Master React, Python Backend, IELTS Mastery..."
            className="system-input py-3 text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Domain</label>
            </div>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="system-input"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex-[0.6]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Days</label>
            </div>
            <input
              type="number"
              min="1"
              max="21"
              value={duration}
              onChange={e => setDuration(Math.min(21, Math.max(1, Number(e.target.value))))}
              className="system-input text-center"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Rank</label>
            </div>
            <select
              value={manualPriority}
              onChange={e => setManualPriority(e.target.value)}
              className="system-input"
            >
              {['A', 'B', 'C', 'D'].map(p => <option key={p} value={p}>RANK {p}</option>)}
            </select>
          </div>
        </div>

        {/* STUDY DAYS */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Study Schedule</label>
          </div>
          <div className="flex gap-1 flex-wrap">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
              const isActive = scheduledDays.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => {
                    setScheduledDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
                  }}
                  className="py-2.5 rounded flex-1 font-mono text-[10px] transition-all"
                  style={isActive ? {
                    background: 'rgba(201,168,76,0.15)',
                    border: '1px solid rgba(201,168,76,0.5)',
                    color: '#C9A84C',
                  } : {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#6B7280',
                  }}
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#C9A84C]/60 rounded-full" />
            <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Input Syllabus Blueprint</label>
          </div>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            rows={10}
            placeholder="Unit 1: Fundamentals&#10;  - Concept A&#10;  - Concept B&#10;Unit 2: Architecture..."
            className="system-input min-h-[200px] leading-relaxed"
          />
          <button
            onClick={() => setUnits(parseInputToUnits(rawInput))}
            disabled={!rawInput.trim()}
            className="w-full py-3 rounded-lg border border-[#C9A84C]/20 text-[#C9A84C] font-mono text-[11px] transition-all hover:bg-[#C9A84C]/5"
          >
            PARSE SYLLABUS BLUEPRINT
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-[#A78BFA]/60 rounded-full" />
              <label className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Units Architect [{units.length}]</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setManualDistribution(!manualDistribution)}
                className={`text-[9px] font-mono border px-2 py-1 rounded transition-all ${manualDistribution
                  ? 'border-[#A78BFA] text-[#A78BFA] bg-[#A78BFA]/10'
                  : 'border-white/5 text-gray-600'
                  }`}
              >
                {manualDistribution ? 'MANUAL MAPPING ON' : 'AUTO DISTRIBUTION'}
              </button>
              <button
                onClick={() => { setUnits([]); setRawInput('') }}
                className="text-gray-600 hover:text-red-400 text-[9px] font-mono uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {units.map((u, uIdx) => (
              <div key={uIdx} className="p-3 rounded-lg border border-white/5 bg-white/5 space-y-3 group transition-all hover:bg-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUnit(uIdx, 'up')} className="text-gray-700 hover:text-white text-[10px]">▲</button>
                    <button onClick={() => moveUnit(uIdx, 'down')} className="text-gray-700 hover:text-white text-[10px]">▼</button>
                  </div>
                  <input
                    value={u.name}
                    onChange={e => handleUnitEdit(uIdx, e.target.value)}
                    className="flex-1 bg-transparent border-b border-transparent focus:border-[#A78BFA]/40 text-xs text-white font-mono px-1 py-0.5 outline-none"
                  />

                  {manualDistribution && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-mono text-[9px]">DAY</span>
                      <input
                        type="number"
                        min="1"
                        max={duration}
                        value={u.assignedDay || ''}
                        onChange={e => handleUnitDayEdit(uIdx, e.target.value)}
                        placeholder="--"
                        className="w-10 bg-black border border-white/10 rounded text-[10px] text-[#A78BFA] font-mono px-1 py-0.5 text-center focus:border-[#A78BFA] outline-none"
                      />
                    </div>
                  )}

                  <button onClick={() => {
                    const next = [...units]; next.splice(uIdx, 1); setUnits(next)
                  }} className="text-gray-700 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
                <div className="pl-6 space-y-2 border-l border-white/5 ml-3">
                  {u.subtopics.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-800" />
                      <input
                        value={s}
                        onChange={e => handleSubtopicEdit(uIdx, sIdx, e.target.value)}
                        className="flex-1 bg-transparent border-none text-[10px] text-gray-500 font-mono py-0.5 outline-none"
                      />
                      <button onClick={() => removeSubtopic(uIdx, sIdx)} className="text-gray-800 hover:text-red-500 text-[9px]">✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtopic(uIdx)}
                    className="text-[8px] text-gray-600 hover:text-[#A78BFA] font-mono flex items-center gap-1 uppercase tracking-widest mt-1"
                  >
                    ＋ Add Module
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setUnits([...units, { name: 'New Unit', subtopics: [] }])}
              className="w-full py-2.5 border border-dashed border-white/10 text-gray-600 font-mono text-[10px] rounded-lg hover:border-[#A78BFA]/30 hover:text-gray-400 transition-all uppercase tracking-widest"
            >
              ＋ Consign New Unit
            </button>
          </div>
        </div>
      )}

      {/* DISTRIBUTION PREVIEW */}
      {units.length > 0 && (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Growth Projection</p>
            <p className="text-[10px] text-[#A78BFA] font-mono">{duration} DAY CAMPAIGN</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {preview.slice(0, 4).map(p => (
              <div key={p.day} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 font-mono text-[9px]">SOLO DAY {p.day}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]/40" />
                </div>
                <span className="text-gray-300 font-mono text-[10px] truncate block px-1 border-l border-[#A78BFA]/20">
                  {p.unitNames.slice(0, 2).join(', ') || 'System Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSlice}
        disabled={!canSlice || slicing}
        className="w-full py-4 rounded-lg font-mono text-xs font-bold tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase"
        style={{
          background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
          color: '#FFFFFF',
          boxShadow: '0 0 20px rgba(167,139,250,0.3)',
        }}
      >
        {slicing ? 'MATERIALIZING SAGA...' : `FORGE CAMPAIGN: ${duration} MISSIONS`}
      </button>

      {/* MANAGE EXISTING */}
      <div className="mt-8">
        <button
          onClick={() => setShowManage(!showManage)}
          className="w-full flex items-center justify-between gap-2 border border-white/5 rounded-lg px-3 py-2.5 text-gray-500 hover:text-gray-300 transition-colors bg-white/5"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">☰ Manage Active Sagas ({existingPlans.length})</span>
          <motion.span
            animate={{ rotate: showManage ? 180 : 0 }}
            className="text-[10px]"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {showManage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              {existingPlans.length === 0 ? (
                <p className="text-center text-gray-700 text-[10px] font-mono py-8 italic uppercase tracking-widest">No Active Sagas in Archives</p>
              ) : (
                existingPlans.map(p => {
                  const progress = Math.round(((p.current_slice_index + 1) / p.duration_days) * 100)
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl space-y-4"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center font-bold text-[#A78BFA] text-lg shadow-[inset_0_0_10px_rgba(167,139,250,0.1)]">
                            {p.goal_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-mono font-bold uppercase tracking-tight">{p.goal_name}</p>
                            <p className="text-gray-600 text-[9px] font-mono uppercase tracking-widest">Rank {p.priority || 'C'} · {p.domain}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => abandonPlan(p.id)}
                          className="border border-red-500/20 text-red-500/50 hover:border-red-500/50 hover:text-red-400 font-mono text-[9px] px-2 py-1 rounded transition-colors uppercase tracking-widest"
                        >
                          Abandon
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                          <span>Campaign Progress</span>
                          <span className="text-[#A78BFA]">{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6]"
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase tracking-tighter">
                          <span>Day {p.current_slice_index + 1} / {p.duration_days}</span>
                          <span>{p.duration_days - p.current_slice_index - 1} Cycles Remaining</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Create Page ─────────────────────────────────────────────────────────
export default function Create() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(null)

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData) setProfile(profileData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadProfile() }, [loadProfile])

  function toggle(id) {
    setActiveSection(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">OPENING FORGE...</p>
      </div>
    )
  }

  return (
    <AppShell profile={profile}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="max-w-lg mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-4 pt-6 pb-4"
        >
          {/* Top decorative line */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A84C]/40" />
            <span className="font-mono text-[9px] text-[#C9A84C]/60 tracking-widest">
              SYSTEM INTERFACE
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A84C]/40" />
          </div>

          <h1 className="font-mono text-xl font-bold text-[#E8E8E8] tracking-wide mb-1">
            FORGE YOUR MISSION
          </h1>
          <p className="font-mono text-[11px] text-gray-500">
            Choose your path. Build your system.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="px-4 space-y-3 pb-24"
        >
          <SectionCard
            id="routine"
            icon="◈"
            title="DAILY ROUTINE"
            subtitle="Build permanent habits"
            color="#4ADE80"
            isOpen={activeSection === 'routine'}
            onToggle={() => toggle('routine')}
          >
            <DailyRoutineSection profile={profile} />
          </SectionCard>

          <SectionCard
            id="instant"
            icon="⚔"
            title="INSTANT MISSION"
            subtitle="Log a task for today"
            color="#C9A84C"
            isOpen={activeSection === 'instant'}
            onToggle={() => toggle('instant')}
          >
            <InstantWorkSection profile={profile} />
          </SectionCard>

          <SectionCard
            id="longterm"
            icon="◆"
            title="OPEN A GATE"
            subtitle="Start a long term plan"
            color="#A78BFA"
            isOpen={activeSection === 'longterm'}
            onToggle={() => toggle('longterm')}
          >
            <LongTermPlanSection profile={profile} />
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  )
}
