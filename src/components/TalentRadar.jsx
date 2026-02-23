import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Pentagon geometry helpers ─────────────────────────────────────────────────
const CENTER_X = 130
const CENTER_Y = 130
const MAX_RADIUS = 100

// Five axes: top, upper-right, lower-right, lower-left, upper-left
// Starting at -90° (top) and going clockwise in 72° increments
function getAxisAngle(index) {
  return (Math.PI * -0.5) + (index * (2 * Math.PI) / 5)
}

function polarToCartesian(radius, angleRad) {
  return {
    x: CENTER_X + radius * Math.cos(angleRad),
    y: CENTER_Y + radius * Math.sin(angleRad),
  }
}

function buildPentagonPoints(radius) {
  return Array.from({ length: 5 }, (_, i) => {
    const { x, y } = polarToCartesian(radius, getAxisAngle(i))
    return `${x},${y}`
  }).join(' ')
}

function buildStatPolygon(stats) {
  // stats: [strength, intelligence, agility, perception, stamina]
  return stats.map((val, i) => {
    const r = (Math.min(val, 100) / 100) * MAX_RADIUS
    const { x, y } = polarToCartesian(r, getAxisAngle(i))
    return `${x},${y}`
  }).join(' ')
}

// ── Label positioning ─────────────────────────────────────────────────────────
// Returns { x, y, textAnchor, valueX, valueY } for each axis label
function getLabelConfig(index, statValue) {
  const angle = getAxisAngle(index)
  const labelRadius = MAX_RADIUS + 22
  const { x, y } = polarToCartesian(labelRadius, angle)

  // Determine text-anchor based on horizontal position
  let textAnchor = 'middle'
  if (x < CENTER_X - 10) textAnchor = 'end'
  else if (x > CENTER_X + 10) textAnchor = 'start'

  // Value label sits just below the stat name
  return { x, y, textAnchor }
}

const STAT_NAMES = ['STRENGTH', 'INTELLIGENCE', 'AGILITY', 'PERCEPTION', 'STAMINA']

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchStats(userId) {
  // STRENGTH — Consistency (daily_habits streak average)
  let strength = 0
  try {
    const { data, error } = await supabase
      .from('daily_habits')
      .select('streak')
      .eq('user_id', userId)
    if (error) throw error
    if (data && data.length > 0) {
      const total = data.reduce((sum, row) => sum + (row.streak || 0), 0)
      strength = Math.min(Math.round(total / data.length), 100)
    }
  } catch (err) {
    console.error('TalentRadar STRENGTH error:', err)
  }

  // INTELLIGENCE — Learning (syllabuses + certificates)
  let intelligence = 0
  try {
    const [syllabusRes, certRes] = await Promise.all([
      supabase
        .from('syllabuses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])
    if (syllabusRes.error) throw syllabusRes.error
    if (certRes.error) throw certRes.error
    const completedSyllabuses = syllabusRes.count || 0
    const certificates = certRes.count || 0
    intelligence = Math.min((completedSyllabuses * 10) + (certificates * 15), 100)
  } catch (err) {
    console.error('TalentRadar INTELLIGENCE error:', err)
  }

  // AGILITY — Speed (activity_log frog_complete or before-noon completions)
  let agility = 0
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('type, created_at, metadata')
      .eq('user_id', userId)
    if (error) throw error
    if (data && data.length > 0) {
      // Total task-completion rows
      const completionTypes = ['task_complete', 'frog_complete', 'habit_complete', 'quest_complete']
      const totalCompletions = data.filter(row =>
        completionTypes.includes(row.type) || row.type?.includes('complete')
      ).length

      if (totalCompletions > 0) {
        const beforeNoonCount = data.filter(row => {
          if (row.type === 'frog_complete') return true
          if (row.created_at) {
            const hour = new Date(row.created_at).getHours()
            return hour < 12
          }
          return false
        }).length
        agility = Math.min(Math.round((beforeNoonCount / totalCompletions) * 100), 100)
      }
    }
  } catch (err) {
    console.error('TalentRadar AGILITY error:', err)
  }

  // PERCEPTION — Focus (timer minutes from activity_log)
  let perception = 0
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('type, metadata')
      .eq('user_id', userId)
    if (error) throw error
    if (data && data.length > 0) {
      let totalMinutes = 0
      data.forEach(row => {
        if (row.type === 'timer_complete') {
          // Try to extract minutes from metadata
          const meta = row.metadata
          if (meta && typeof meta === 'object') {
            const mins = meta.minutes ?? meta.duration_minutes ?? meta.timer_minutes ?? null
            if (typeof mins === 'number') totalMinutes += mins
          }
        } else if (row.metadata && typeof row.metadata === 'object') {
          const meta = row.metadata
          const mins = meta.minutes ?? meta.duration_minutes ?? meta.timer_minutes ?? null
          if (typeof mins === 'number') totalMinutes += mins
        }
      })
      perception = Math.min(Math.round(totalMinutes), 100)
    }
  } catch (err) {
    console.error('TalentRadar PERCEPTION error:', err)
  }

  // STAMINA — Volume (completed tasks count)
  let stamina = 0
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
    if (error) throw error
    stamina = Math.min(count || 0, 100)
  } catch (err) {
    console.error('TalentRadar STAMINA error:', err)
  }

  return [strength, intelligence, agility, perception, stamina]
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TalentRadar() {
  const [stats, setStats] = useState([0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const result = await fetchStats(user.id)
        if (!cancelled) setStats(result)
      } catch (err) {
        console.error('TalentRadar load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const statPolygonPoints = buildStatPolygon(stats)

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <div
        className="border border-[#C9A84C] bg-[#0D1117] rounded p-4"
        style={{ background: '#0D1117' }}
      >
        {/* Section header: [ TALENT MATRIX ] */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px" style={{ background: '#C9A84C', opacity: 0.5 }} />
          <span className="font-mono text-sm whitespace-nowrap" style={{ color: '#C9A84C' }}>
            [ TALENT MATRIX ]
          </span>
          <div className="flex-1 h-px" style={{ background: '#C9A84C', opacity: 0.5 }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-mono text-xs animate-pulse" style={{ color: '#C9A84C' }}>
              SCANNING TALENT DATA...
            </p>
          </div>
        ) : (
          <>
            {/* SVG Pentagon Radar Chart */}
            <div className="flex justify-center">
              <svg
                width="260"
                height="260"
                viewBox="0 0 260 260"
                style={{ display: 'block' }}
              >
                {/* Background grid pentagons at 33%, 66%, 100% */}
                {[0.33, 0.66, 1.0].map((scale) => (
                  <polygon
                    key={scale}
                    points={buildPentagonPoints(MAX_RADIUS * scale)}
                    fill="none"
                    stroke="#1A1A2E"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Axis lines from center to each vertex */}
                {Array.from({ length: 5 }, (_, i) => {
                  const { x, y } = polarToCartesian(MAX_RADIUS, getAxisAngle(i))
                  return (
                    <line
                      key={i}
                      x1={CENTER_X}
                      y1={CENTER_Y}
                      x2={x}
                      y2={y}
                      stroke="#1A1A2E"
                      strokeWidth="1"
                    />
                  )
                })}

                {/* Stat polygon */}
                <polygon
                  points={statPolygonPoints}
                  fill="rgba(201, 168, 76, 0.25)"
                  stroke="#C9A84C"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Vertex dots */}
                {Array.from({ length: 5 }, (_, i) => {
                  const { x, y } = polarToCartesian(MAX_RADIUS, getAxisAngle(i))
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#C9A84C"
                    />
                  )
                })}

                {/* Axis labels + stat values */}
                {STAT_NAMES.map((name, i) => {
                  const { x, y, textAnchor } = getLabelConfig(i, stats[i])
                  return (
                    <g key={name}>
                      <text
                        x={x}
                        y={y - 4}
                        textAnchor={textAnchor}
                        fill="white"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {name}
                      </text>
                      <text
                        x={x}
                        y={y + 8}
                        textAnchor={textAnchor}
                        fill="#C9A84C"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {stats[i]}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Stat Legend */}
            <div className="mt-4 space-y-2">
              {STAT_NAMES.map((name, i) => (
                <div key={name} className="flex items-center gap-2">
                  {/* Stat name */}
                  <span
                    className="font-mono text-xs text-white w-24 shrink-0"
                    style={{ minWidth: '6rem' }}
                  >
                    {name}
                  </span>

                  {/* Progress bar */}
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: '6px', background: '#1A1A2E' }}
                  >
                    <div
                      style={{
                        height: '6px',
                        width: `${stats[i]}%`,
                        background: '#C9A84C',
                        borderRadius: '9999px',
                        transition: 'width 0.7s ease',
                      }}
                    />
                  </div>

                  {/* Numeric value */}
                  <span
                    className="font-mono text-xs w-8 text-right shrink-0"
                    style={{ color: '#C9A84C' }}
                  >
                    {stats[i]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
