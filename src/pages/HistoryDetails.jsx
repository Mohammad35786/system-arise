 import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'

// Section types mapping to readable names
const SECTION_CONFIG = {
  'daily-quests': {
    title: 'Daily Quests History',
    description: 'Your habit tracking history',
    table: 'daily_habits',
    fields: ['name', 'streak', 'last_completed', 'created_at'],
  },
  'instant-todo': {
    title: 'Instant To-Do History',
    description: 'Your completed tasks and side quests',
    table: 'tasks',
    fields: ['name', 'completed', 'completed_at', 'created_at', 'abcde_label', 'domain'],
  },
  'long-term': {
    title: 'Long-Term Plans History',
    description: 'Your syllabuses and study plans',
    table: 'syllabuses',
    fields: ['title', 'status', 'current_slice_index', 'created_at', 'updated_at'],
  },
}

export default function HistoryDetails() {
  const { sectionType } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const config = SECTION_CONFIG[sectionType]

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      const sectionConfig = SECTION_CONFIG[sectionType]
      if (!sectionConfig) {
        setError('Invalid section type')
        return
      }

      let data = []

      switch (sectionType) {
        case 'daily-quests': {
          // Get all habits with their history
          const { data: habitsData } = await supabase
            .from('daily_habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          data = (habitsData || []).map(h => ({
            id: h.id,
            name: h.name,
            streak: h.streak || 0,
            lastCompleted: h.last_completed,
            createdAt: h.created_at,
            status: h.last_completed ? 'active' : 'pending',
          }))
          break
        }

        case 'instant-todo': {
          // Get all tasks including completed ones from all time
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
          
          data = (tasksData || []).map(t => ({
            id: t.id,
            name: t.name || t.title,
            completed: t.completed,
            completedAt: t.completed_at,
            createdAt: t.created_at,
            label: t.abcde_label,
            domain: t.domain,
            isFrog: t.is_frog,
          }))
          break
        }

        case 'long-term': {
          // Get all syllabuses including completed and abandoned
          const { data: syllabusesData } = await supabase
            .from('syllabuses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          data = (syllabusesData || []).map(s => {
            const slices = Array.isArray(s.slices) ? s.slices : JSON.parse(s.slices || '[]')
            return {
              id: s.id,
              title: s.title,
              status: s.status,
              currentIndex: s.current_slice_index || 0,
              totalSlices: slices.length,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            }
          })
          break
        }

        default:
          data = []
      }

      setHistoryData(data)
    } catch (err) {
      console.error('Error loading history:', err)
      setError('Failed to load history data')
    } finally {
      setLoading(false)
    }
  }, [navigate, sectionType])

  useEffect(() => {
    loadData()
  }, [loadData])

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Group data by date for instant-todo
  const groupedByDate = historyData.reduce((acc, item) => {
    const dateKey = item.completedAt 
      ? new Date(item.completedAt).toISOString().slice(0, 10)
      : item.createdAt
        ? new Date(item.createdAt).toISOString().slice(0, 10)
        : 'unknown'
    
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">
          LOADING HISTORY...
        </p>
      </div>
    )
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/home')}
            className="text-gray-500 hover:text-gray-300 font-mono text-xs"
          >
            ← BACK
          </button>
          <div>
            <h1 className="text-[#C9A84C] font-mono text-lg font-bold">
              {config?.title || 'History'}
            </h1>
            <p className="text-gray-600 font-mono text-xs">
              {config?.description}
            </p>
          </div>
        </div>

        {error && (
          <div className="border border-red-500/50 bg-red-500/10 rounded p-4">
            <p className="text-red-400 font-mono text-xs">{error}</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {sectionType === 'instant-todo' && (
            <>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">TOTAL TASKS</p>
                <p className="text-[#C9A84C] font-mono text-xl">{historyData.length}</p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">COMPLETED</p>
                <p className="text-green-500 font-mono text-xl">
                  {historyData.filter(t => t.completed).length}
                </p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">PENDING</p>
                <p className="text-orange-500 font-mono text-xl">
                  {historyData.filter(t => !t.completed).length}
                </p>
              </div>
            </>
          )}
          {sectionType === 'daily-quests' && (
            <>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">TOTAL HABITS</p>
                <p className="text-[#C9A84C] font-mono text-xl">{historyData.length}</p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">ACTIVE</p>
                <p className="text-green-500 font-mono text-xl">
                  {historyData.filter(h => h.status === 'active').length}
                </p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">BEST STREAK</p>
                <p className="text-orange-500 font-mono text-xl">
                  {Math.max(...historyData.map(h => h.streak || 0), 0)}
                </p>
              </div>
            </>
          )}
          {sectionType === 'long-term' && (
            <>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">TOTAL PLANS</p>
                <p className="text-[#C9A84C] font-mono text-xl">{historyData.length}</p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">ACTIVE</p>
                <p className="text-green-500 font-mono text-xl">
                  {historyData.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="border border-gray-800 bg-[#0D1117] rounded p-3">
                <p className="text-gray-600 font-mono text-[10px]">COMPLETED</p>
                <p className="text-blue-500 font-mono text-xl">
                  {historyData.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* History List */}
        <div className="space-y-4">
          {sectionType === 'instant-todo' && sortedDates.map(date => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
                <p className="text-gray-500 font-mono text-[10px] font-bold">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-gray-700 font-mono text-[9px]">
                  ({groupedByDate[date].filter(t => t.completed).length} completed)
                </p>
              </div>
              <div className="space-y-2">
                {groupedByDate[date].map(task => (
                  <div
                    key={task.id}
                    className={`border bg-[#0D1117] rounded p-3 ${
                      task.completed 
                        ? 'border-green-500/20' 
                        : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-mono ${
                        task.completed
                          ? 'bg-green-500/20 text-green-500'
                          : task.isFrog
                            ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                            : task.label === 'A'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-gray-800 text-gray-500'
                      }`}>
                        {task.completed ? '✓' : task.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-xs truncate ${
                          task.completed ? 'text-gray-500 line-through' : 'text-gray-300'
                        }`}>
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-700 font-mono text-[9px]">
                            {task.domain || 'WORK'}
                          </span>
                          {task.completed && task.completedAt && (
                            <span className="text-green-600 font-mono text-[9px]">
                              ✓ {formatDate(task.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {sectionType === 'daily-quests' && historyData.map(habit => (
            <div
              key={habit.id}
              className="border bg-[#0D1117] rounded p-3"
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                  habit.status === 'active'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {habit.status === 'active' ? '✓' : '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-300 truncate">
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[#C9A84C] font-mono text-[9px]">
                      🔥 {habit.streak} day streak
                    </span>
                    <span className="text-gray-700 font-mono text-[9px]">
                      Last: {formatShortDate(habit.lastCompleted)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {sectionType === 'long-term' && historyData.map(plan => (
            <div
              key={plan.id}
              className="border bg-[#0D1117] rounded p-3 cursor-pointer hover:border-gray-700"
              onClick={() => navigate(`/syllabus/${plan.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                  plan.status === 'completed'
                    ? 'bg-blue-500/20 text-blue-500'
                    : plan.status === 'abandoned'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-[#C9A84C]/20 text-[#C9A84C]'
                }`}>
                  {plan.status === 'completed' ? '✓' : 
                   plan.status === 'abandoned' ? '✕' : '●'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-300 truncate">
                    {plan.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-600 font-mono text-[9px] uppercase">
                      {plan.status}
                    </span>
                    <span className="text-gray-700 font-mono text-[9px]">
                      {plan.currentIndex + 1}/{plan.totalSlices} slices
                    </span>
                    <span className="text-gray-700 font-mono text-[9px]">
                      Created: {formatShortDate(plan.createdAt)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-gray-800 rounded overflow-hidden">
                    <div 
                      className="h-full bg-[#C9A84C] transition-all"
                      style={{ width: `${(plan.currentIndex / plan.totalSlices) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {historyData.length === 0 && (
            <div className="border border-dashed border-gray-800 rounded p-8 text-center">
              <p className="text-gray-600 font-mono text-xs">No history available yet.</p>
              <p className="text-gray-700 font-mono text-[10px] mt-1">
                Complete some tasks to see your history here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
