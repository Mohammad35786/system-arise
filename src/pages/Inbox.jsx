import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { supabase } from '../lib/supabase'
import { requestNotificationPermission } from '../lib/notificationEngine'

const TYPE_CONFIG = {
  xp: { icon: '⚡', color: '#C9A84C', border: 'border-[#C9A84C]', label: 'XP' },
  reward: { icon: '◆', color: '#A78BFA', border: 'border-purple-500', label: 'REWARD' },
  rank_up: { icon: '▲', color: '#C9A84C', border: 'border-[#C9A84C]', label: 'RANK UP' },
  streak: { icon: '🔥', color: '#F97316', border: 'border-orange-500', label: 'STREAK' },
  system: { icon: '◈', color: '#C9A84C', border: 'border-[#C9A84C]', label: 'SYSTEM' },
  penalty: { icon: '⚠', color: '#EF4444', border: 'border-red-500', label: 'ALERT' },
  reminder: { icon: '◗', color: '#60A5FA', border: 'border-blue-400', label: 'REMINDER' },
}

const FILTER_TABS = ['ALL', 'UNREAD', 'XP', 'SYSTEM', 'ALERTS']

function relativeTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function Inbox() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [notifPermission, setNotifPermission] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dismissingId, setDismissingId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const [{ data: profileData }, { data: notifData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('inbox_notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (profileData) setProfile(profileData)
      if (notifData) setNotifications(notifData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData()
    if (!('Notification' in window)) {
      setNotifPermission('unsupported')
    } else {
      setNotifPermission(Notification.permission)
    }
  }, [loadData])

  async function handleEnableNotifications() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifPermission(result)
  }

  async function markRead(id) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    await supabase.from('inbox_notifications').update({ read: true }).eq('id', id)
  }

  async function dismiss(id) {
    setDismissingId(id)
    await supabase.from('inbox_notifications').update({ dismissed: true }).eq('id', id)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
      setDismissingId(null)
    }, 300)
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase
      .from('inbox_notifications')
      .update({ read: true })
      .in('id', unreadIds)
  }

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read
    if (filter === 'XP') return n.type === 'xp' || n.type === 'rank_up' || n.type === 'reward'
    if (filter === 'SYSTEM') return n.type === 'system' || n.type === 'streak'
    if (filter === 'ALERTS') return n.type === 'penalty' || n.type === 'reminder'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <p className="text-[#C9A84C] font-mono text-xs animate-pulse">OPENING INBOX...</p>
      </div>
    )
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3 pb-8">
        {/* Header */}
        <div className="border border-gray-800 bg-[#0D1117] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[#C9A84C] font-mono text-xs font-bold">INBOX</p>
                {unreadCount > 0 && (
                  <span className="bg-[#C9A84C] text-black font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-gray-600 font-mono text-xs mt-1">System notifications and activity alerts.</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="border border-gray-700 text-gray-400 font-mono text-[11px] px-3 py-1.5 rounded hover:border-gray-500 transition-colors"
              >
                MARK ALL READ
              </button>
            )}
          </div>
        </div>

        {/* Browser notification status bar */}
        <div className={`border-l-4 bg-[#0D1117] rounded p-3 flex items-center justify-between gap-3 ${notifPermission === 'granted' ? 'border-green-500' :
          notifPermission === 'denied' ? 'border-red-500' :
            notifPermission === 'unsupported' ? 'border-gray-500' :
              'border-[#C9A84C]'
          }`}>
          <div>
            <p className={`font-mono text-xs font-bold ${notifPermission === 'granted' ? 'text-green-500' :
              notifPermission === 'denied' ? 'text-red-500' :
                notifPermission === 'unsupported' ? 'text-gray-500' :
                  'text-[#C9A84C]'
              }`}>
              {notifPermission === 'granted' && '◉ NOTIFICATIONS ALLOWED'}
              {notifPermission === 'denied' && '✕ NOTIFICATIONS BLOCKED'}
              {notifPermission === 'default' && '◯ NOTIFICATIONS OFF'}
              {notifPermission === 'unsupported' && '— NOTIFICATIONS UNSUPPORTED'}
            </p>
            <p className="text-gray-600 font-mono text-[10px] mt-0.5">
              {notifPermission === 'granted' && 'Browser notifications are active.'}
              {notifPermission === 'denied' && 'Enable in your browser settings to receive reminders.'}
              {notifPermission === 'default' && 'Tap ENABLE to receive reminders.'}
              {notifPermission === 'unsupported' && 'Notifications not supported on this device.'}
            </p>
          </div>
          {notifPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              className="border border-[#C9A84C] text-[#C9A84C] font-mono text-[11px] px-3 py-1.5 rounded flex-shrink-0 hover:bg-[#C9A84C]/10 transition-colors"
            >
              ENABLE NOTIFICATIONS
            </button>
          )}
          {notifPermission === 'granted' && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="border border-gray-700 text-gray-400 font-mono text-[10px] px-2 py-1 rounded hover:border-gray-500 transition-colors"
            >
              CHANGE
            </button>
          )}
        </div>

        {/* Permission Instructions */}
        {
          ((notifPermission === 'granted' && showSettings) || notifPermission === 'denied') && (
            <div className={`rounded-lg p-4 font-mono text-xs border bg-[#0D1117] animate-[fadeIn_0.3s_ease-out] relative ${notifPermission === 'denied' ? 'border-red-500 text-red-400' : 'border-gray-700 text-gray-400'
              }`}>
              {notifPermission === 'granted' && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-white"
                >✕</button>
              )}
              <p className="font-bold mb-2">
                {notifPermission === 'denied' ? 'TO ENABLE NOTIFICATIONS:' : 'TO DISABLE NOTIFICATIONS:'}
              </p>
              {notifPermission === 'denied' ? (
                <p className="leading-relaxed">
                  Click the lock icon in your browser address bar and set Notifications to Allow, then refresh the page.
                </p>
              ) : (
                <ul className="space-y-2 leading-relaxed">
                  <li><span className="font-bold text-gray-300">Chrome:</span> Click the lock icon in the address bar → Notifications → Block</li>
                  <li><span className="font-bold text-gray-300">Firefox:</span> Click the lock icon → Connection secure → More info → Permissions → Notifications</li>
                  <li><span className="font-bold text-gray-300">Safari:</span> Settings → Websites → Notifications → find this site → Deny</li>
                </ul>
              )}
            </div>
          )
        }

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-shrink-0 border font-mono text-[11px] px-3 py-1.5 rounded transition-all ${filter === tab
                ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                : 'border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-2 h-2 rounded-full bg-[#C9A84C] mb-4 animate-pulse" />
              <p className="text-[#C9A84C] font-mono text-xs font-bold">ALL CLEAR.</p>
              <p className="text-gray-600 font-mono text-xs mt-1">THE SYSTEM IS WATCHING.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                const isDismissing = dismissingId === n.id
                return (
                  <div
                    key={n.id}
                    className={`border-l-2 border border-gray-800 bg-[#0D1117] rounded-r overflow-hidden transition-all duration-300 ${isDismissing ? 'opacity-0 max-h-0' : 'opacity-100 max-h-96'
                      }`}
                    style={{ borderLeftColor: cfg.color }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[#E8E8E8] font-mono text-xs font-bold">{n.title}</p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C9A84C' }} />
                            )}
                            <span className="text-gray-600 font-mono text-[10px]">{cfg.label}</span>
                          </div>
                          {n.body && (
                            <p className="text-gray-500 font-mono text-[11px] mt-1 leading-relaxed">{n.body}</p>
                          )}
                          <p className="text-gray-700 font-mono text-[10px] mt-2">
                            {relativeTime(n.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="border border-gray-700 text-gray-400 font-mono text-[10px] px-2 py-1 rounded hover:border-gray-500"
                          >
                            MARK READ
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="border border-gray-800 text-gray-600 font-mono text-[10px] px-2 py-1 rounded hover:border-red-500/50 hover:text-red-400"
                        >
                          DISMISS ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div >
    </AppShell >
  )
}
