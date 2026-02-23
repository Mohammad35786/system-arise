import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { rollReward } from '../lib/rewardEngine'
import { CertificateUploadModal } from '../components/CertificateUploadModal'

export default function SyllabusDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [syllabus, setSyllabus] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diaryEntries, setDiaryEntries] = useState([])
  const [newDiaryEntry, setNewDiaryEntry] = useState('')
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [editableSlices, setEditableSlices] = useState([])
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState('')
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [showCertificateUpload, setShowCertificateUpload] = useState(false)
  const [showCompletionWarning, setShowCompletionWarning] = useState(false)

  function showNotif(msg) {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  function handleParentTaskCertificateUpload() {
    if (progressPct < 100) {
      setShowCompletionWarning(true)
      setTimeout(() => setShowCompletionWarning(false), 3000)
    } else {
      setShowCertificateUpload(true)
    }
  }

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const [{ data: p }, { data: s }, { data: d }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('syllabuses').select('*').eq('id', id).single(),
        supabase.from('diary_entries').select('*')
          .eq('user_id', user.id)
          .eq('syllabus_id', id)
          .order('created_at', { ascending: false })
      ])

      if (p) setProfile(p)
      if (s) {
        setSyllabus(s)
        const slices = Array.isArray(s.slices) ? s.slices : JSON.parse(s.slices || '[]')
        setEditableSlices(slices)
      }
      if (d) setDiaryEntries(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { loadData() }, [loadData])

  function moveSlice(index, direction) {
    const slices = [...editableSlices]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= slices.length) return
      ;[slices[index], slices[swapIndex]] = [slices[swapIndex], slices[index]]
    setEditableSlices(slices)
  }

  function updateSliceTitle(index, newTitle) {
    const slices = [...editableSlices]
    slices[index] = { ...slices[index], title: newTitle }
    setEditableSlices(slices)
  }

  async function saveSliceChanges() {
    setSaving(true)
    try {
      await supabase.from('syllabuses')
        .update({ slices: editableSlices })
        .eq('id', id)
      showNotif('PLAN UPDATED SUCCESSFULLY')
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function changePriority(newPriority) {
    await supabase.from('syllabuses')
      .update({ priority: newPriority })
      .eq('id', id)
    showNotif(`PRIORITY CHANGED TO ${newPriority}`)
    await loadData()
  }

  async function abandonPlan() {
    await supabase.from('syllabuses')
      .update({ status: 'abandoned' })
      .eq('id', id)
    navigate('/home')
  }

  async function saveDiaryEntry() {
    if (!newDiaryEntry.trim() || !profile) return
    await supabase.from('diary_entries').insert({
      user_id: profile.id,
      syllabus_id: id,
      content: newDiaryEntry.trim(),
      date: new Date().toISOString().split('T')[0],
    })
    setNewDiaryEntry('')
    await loadData()
  }

  async function updateDuration(newDays) {
    if (!newDays || newDays < 1) return
    setSaving(true)
    try {
      await supabase.from('syllabuses')
        .update({ duration_days: parseInt(newDays) })
        .eq('id', id)
      showNotif('DURATION UPDATED')
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <p className="text-[#C9A84C] font-mono text-xs animate-pulse">
        LOADING PLAN...
      </p>
    </div>
  )

  if (!syllabus) return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <p className="text-gray-500 font-mono text-xs">PLAN NOT FOUND</p>
    </div>
  )

  const slices = Array.isArray(syllabus.slices)
    ? syllabus.slices
    : JSON.parse(syllabus.slices || '[]')
  const currentIndex = syllabus.current_slice_index || 0
  const completedCount = slices.filter(s => s.completed).length
  const totalSlices = slices.length
  const progressPct = totalSlices > 0
    ? Math.round((completedCount / totalSlices) * 100)
    : 0

  const PRIORITY_COLORS = {
    A: 'text-red-400 border-red-500',
    B: 'text-orange-400 border-orange-500',
    C: 'text-yellow-400 border-yellow-500',
    D: 'text-gray-400 border-gray-500',
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">

        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
            bg-[#0D1117] border border-[#C9A84C] rounded px-4 py-2">
            <p className="text-[#C9A84C] font-mono text-xs">{notification}</p>
          </div>
        )}

        {/* Back button */}
        <button onClick={() => navigate('/home')}
          className="text-gray-500 font-mono text-xs hover:text-[#C9A84C] 
          transition-colors flex items-center gap-2">
          ← BACK TO HOME
        </button>

        {/* Header */}
        <div className="border border-[#C9A84C] bg-[#0D1117] rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-[#E8E8E8] font-mono text-lg font-bold leading-tight flex-1">
              {syllabus.goal_name}
            </p>
            <div className={`border rounded px-2 py-1 font-mono text-xs font-bold flex-shrink-0 ${PRIORITY_COLORS[syllabus.priority || 'A']}`}>
              {syllabus.priority || 'A'}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="text-gray-500 font-mono text-xs border border-gray-700 px-2 py-0.5 rounded">
              {syllabus.domain || 'General'}
            </span>
            <span className="text-gray-500 font-mono text-xs border border-gray-700 px-2 py-0.5 rounded">
              {syllabus.duration_days} DAYS
            </span>
            <span className={`font-mono text-xs border px-2 py-0.5 rounded ${syllabus.status === 'completed'
                ? 'text-green-400 border-green-700'
                : syllabus.status === 'abandoned'
                  ? 'text-red-400 border-red-700'
                  : 'text-[#C9A84C] border-[#C9A84C]/50'
              }`}>
              {(syllabus.status || 'active').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-400 font-mono text-xs mb-2">
            DAY {completedCount} OF {totalSlices} COMPLETE
          </p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-[#C9A84C] h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-gray-600 font-mono text-xs mt-1">
            {progressPct}% COMPLETE
          </p>
          
          {/* Certificate Upload Button - Always visible for parent task */}
          <button
            onClick={handleParentTaskCertificateUpload}
            className="w-full mt-3 border border-dashed border-[#C9A84C] bg-[#C9A84C10] rounded p-2 flex items-center justify-center gap-2 hover:bg-[#C9A84C20] transition-colors"
          >
            <span className="text-lg">🏆</span>
            <span className="text-[#C9A84C] font-mono text-xs">UPLOAD CERTIFICATE</span>
          </button>
          
          {/* Completion Warning Popup */}
          {showCompletionWarning && (
            <div className="mt-2 bg-orange-500/10 border border-orange-500/50 rounded p-2 text-center">
              <p className="text-orange-400 font-mono text-xs">
                ⚠ COMPLETE THE TASK FIRST TO UPLOAD CERTIFICATE
              </p>
            </div>
          )}
        </div>

        {/* Slice Timeline */}
        <div>
          <p className="text-gray-500 font-mono text-xs mb-3">SLICE TIMELINE</p>
          <div className="space-y-2">
            {slices.map((slice, index) => {
              const isCompleted = slice.completed
              const isCurrent = index === currentIndex &&
                syllabus.status === 'active' && !isCompleted
              const isFuture = !isCompleted && !isCurrent

              return (
                <div key={index}
                  className={`border-l-4 rounded-r-lg p-3 bg-[#0D1117] ${isCompleted ? 'border-green-500 opacity-70'
                      : isCurrent ? 'border-[#C9A84C]'
                        : 'border-gray-800 opacity-50'
                    }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-xs font-bold ${isCompleted ? 'text-green-400'
                        : isCurrent ? 'text-[#C9A84C]'
                          : 'text-gray-600'
                      }`}>
                      {isCompleted ? '✓' : isCurrent ? '⚔' : '◦'} DAY {slice.day || index + 1}
                      {isCurrent && ' — TODAY'}
                    </span>
                    {slice.phase && (
                      <span className="text-gray-700 font-mono text-xs">
                        {slice.phase}
                      </span>
                    )}
                  </div>
                  <p className={`font-mono text-sm ${isCompleted
                      ? 'line-through text-gray-500'
                      : isCurrent
                        ? 'text-[#E8E8E8] font-bold'
                        : 'text-gray-600'
                    }`}>
                    {slice.title}
                  </p>
                  {isCurrent && slice.firstStep && (
                    <div className="mt-2 bg-[#0A0A0F] rounded p-2">
                      <p className="text-gray-500 font-mono text-xs mb-1">
                        FIRST STEP:
                      </p>
                      <p className="text-gray-400 font-mono text-xs">
                        {slice.firstStep}
                      </p>
                    </div>
                  )}
                  {isCompleted && slice.completedAt && (
                    <p className="text-green-700 font-mono text-xs mt-1">
                      COMPLETED {new Date(slice.completedAt).toLocaleDateString()}
                    </p>
                  )}
                  
                  {/* Certificate Upload Button - Only for completed slices */}
                  {isCompleted && (
                    <button
                      onClick={() => setShowCertificateUpload(true)}
                      className="mt-2 border border-dashed border-[#C9A84C] bg-[#C9A84C10] rounded p-2 flex items-center justify-center gap-2 hover:bg-[#C9A84C20] transition-colors w-full"
                    >
                      <span className="text-lg">🏆</span>
                      <span className="text-[#C9A84C] font-mono text-xs">UPLOAD CERTIFICATE</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Customize Plan */}
        <div className="border border-gray-800 bg-[#0D1117] rounded-xl overflow-hidden">
          <button
            onClick={() => setCustomizeOpen(!customizeOpen)}
            className="w-full flex items-center justify-between px-4 py-3
              hover:bg-gray-800/30 transition-colors">
            <p className="text-gray-400 font-mono text-xs font-bold">
              ⚙ CUSTOMIZE PLAN
            </p>
            <span className={`text-gray-500 transition-transform duration-200 ${customizeOpen ? 'rotate-180' : ''
              }`}>▼</span>
          </button>

          {customizeOpen && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-800">

              {/* Change Duration */}
              <div className="pt-4">
                <p className="text-gray-500 font-mono text-xs mb-2">
                  CHANGE DURATION
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    defaultValue={syllabus.duration_days}
                    className="w-24 bg-[#0A0A0F] border border-gray-600 rounded
                      px-3 py-2 text-sm text-[#E8E8E8] font-mono
                      focus:outline-none focus:border-[#C9A84C]"
                    onBlur={(e) => updateDuration(e.target.value)}
                  />
                  <span className="text-gray-500 font-mono text-xs">DAYS</span>
                </div>
                <p className="text-gray-700 font-mono text-xs mt-1">
                  Can be hours (0.5), days, or any number
                </p>
              </div>

              {/* Change Priority */}
              <div>
                <p className="text-gray-500 font-mono text-xs mb-2">
                  CHANGE PRIORITY
                </p>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map(p => (
                    <button key={p} onClick={() => changePriority(p)}
                      className={`border-2 rounded px-3 py-2 font-mono text-sm 
                        font-bold transition-all ${syllabus.priority === p
                          ? p === 'A' ? 'border-red-500 text-red-400 bg-red-500/10'
                            : p === 'B' ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                              : p === 'C' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                                : 'border-gray-500 text-gray-400 bg-gray-500/10'
                          : 'border-gray-700 text-gray-600 hover:border-gray-500'
                        }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rearrange future slices */}
              <div>
                <p className="text-gray-500 font-mono text-xs mb-2">
                  REARRANGE & EDIT FUTURE SLICES
                </p>
                <div className="space-y-2">
                  {editableSlices.map((slice, index) => {
                    if (slice.completed) return null
                    return (
                      <div key={index}
                        className="flex items-center gap-2 bg-[#0A0A0F] 
                          border border-gray-800 rounded p-2">
                        <span className="text-gray-600 font-mono text-xs w-8 flex-shrink-0">
                          D{slice.day || index + 1}
                        </span>
                        <input
                          type="text"
                          value={slice.title}
                          onChange={(e) => updateSliceTitle(index, e.target.value)}
                          className="flex-1 bg-transparent text-[#E8E8E8] font-mono 
                            text-xs focus:outline-none focus:text-[#C9A84C]"
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => moveSlice(index, 'up')}
                            className="text-gray-600 hover:text-[#C9A84C] font-mono text-xs px-1">
                            ↑
                          </button>
                          <button onClick={() => moveSlice(index, 'down')}
                            className="text-gray-600 hover:text-[#C9A84C] font-mono text-xs px-1">
                            ↓
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={saveSliceChanges} disabled={saving}
                  className="mt-3 w-full border border-[#C9A84C] text-[#C9A84C] 
                    font-mono text-xs py-2 rounded hover:bg-[#C9A84C] 
                    hover:text-black transition-colors disabled:opacity-50">
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>

              {/* Abandon Plan */}
              <div className="border-t border-gray-800 pt-4">
                {!showAbandonConfirm ? (
                  <button onClick={() => setShowAbandonConfirm(true)}
                    className="w-full border border-red-500/50 text-red-400 
                      font-mono text-xs py-2 rounded hover:bg-red-500/10 
                      transition-colors">
                    ABANDON THIS PLAN
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-400 font-mono text-xs text-center">
                      ARE YOU SURE? THIS CANNOT BE UNDONE.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={abandonPlan}
                        className="flex-1 bg-red-500/20 border border-red-500 
                          text-red-400 font-mono text-xs py-2 rounded">
                        CONFIRM ABANDON
                      </button>
                      <button onClick={() => setShowAbandonConfirm(false)}
                        className="flex-1 border border-gray-700 text-gray-500 
                          font-mono text-xs py-2 rounded">
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Certificate Upload Modal */}
        {showCertificateUpload && (
          <CertificateUploadModal
            isOpen={showCertificateUpload}
            onClose={() => setShowCertificateUpload(false)}
            userId={profile?.id}
            syllabus={syllabus}
          />
        )}

        {/* Diary Section */}
        <div className="border border-gray-800 bg-[#0D1117] rounded-xl p-4">
          <p className="text-gray-400 font-mono text-xs font-bold mb-3">
            ✎ FIELD NOTES
          </p>
          <div className="space-y-2 mb-3">
            {diaryEntries.length === 0 ? (
              <p className="text-gray-700 font-mono text-xs italic">
                No notes yet. Add your first reflection below.
              </p>
            ) : (
              diaryEntries.map(entry => (
                <div key={entry.id}
                  className="border border-gray-800 rounded p-3">
                  <p className="text-gray-400 font-mono text-xs leading-relaxed italic">
                    "{entry.content}"
                  </p>
                  <p className="text-gray-700 font-mono text-xs mt-1">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <textarea
            value={newDiaryEntry}
            onChange={e => setNewDiaryEntry(e.target.value)}
            placeholder="Add a field note for this plan..."
            rows={3}
            className="w-full bg-[#0A0A0F] border border-gray-700 rounded 
              px-3 py-2 text-sm text-[#E8E8E8] font-mono placeholder-gray-600 
              focus:outline-none focus:border-[#C9A84C] resize-none mb-2"
          />
          <button onClick={saveDiaryEntry}
            disabled={!newDiaryEntry.trim()}
            className="w-full border border-gray-700 hover:border-[#C9A84C] 
              text-gray-500 hover:text-[#C9A84C] font-mono text-xs py-2 
              rounded transition-colors disabled:opacity-40">
            SAVE NOTE
          </button>
        </div>

      </div>
    </AppShell>
  )
}
