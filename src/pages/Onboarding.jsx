import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Step map:
// 0 = Gate
// 1 = Display Name
// 2 = Avatar Selection
// 3 = System Gift Box

const AVATAR_CLASSES = [
  { id: 1, key: 'Vanguard', name: 'VANGUARD', emoji: '⚔️', domain: 'Health & Discipline' },
  { id: 2, key: 'Artisan', name: 'ARTISAN', emoji: '✦', domain: 'Creative & Expression' },
  { id: 3, key: 'Sage', name: 'SAGE', emoji: '◈', domain: 'Learning & Knowledge' },
  { id: 4, key: 'Architect', name: 'ARCHITECT', emoji: '⬡', domain: 'Logic & Systems' },
]

const GIFT_TITLE = 'The One Who Reaches'
const GIFT_XP = 100

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState(null)

  const selectedClass = AVATAR_CLASSES.find(c => c.id === selectedClassId) || null

  if (step === 0) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center cursor-pointer select-none"
        onClick={() => setStep(1)}
      >
        <div className="text-center px-8">
          <p className="text-[#C9A84C] font-mono text-2xl animate-pulse mb-4">
            A new Hunter has been detected.
          </p>
          <p className="text-gray-600 font-mono text-xs mb-10">
            The System is initializing your profile.
          </p>
          <p className="text-gray-700 font-mono text-xs animate-pulse">
            TAP ANYWHERE TO PROCEED
          </p>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <DisplayNameStep
        value={displayName}
        onChange={setDisplayName}
        onConfirmed={() => setStep(2)}
      />
    )
  }

  if (step === 2) {
    return (
      <AvatarStep
        selectedId={selectedClassId}
        onSelect={setSelectedClassId}
        onNext={() => setStep(3)}
      />
    )
  }

  return (
    <GiftBoxStep
      displayName={displayName}
      avatarClass={selectedClass}
      onComplete={async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { navigate('/'); return }

          const avatarId = selectedClass?.id || 1
          const avatarCategory = selectedClass?.key || 'Vanguard'

          await supabase.from('profiles').upsert({
            id: user.id,
            display_name: displayName.trim(),
            avatar_id: avatarId,
            avatar_category: avatarCategory,
            title: GIFT_TITLE,
            rank: 'E',
            xp: GIFT_XP,
            level: 1,
            streak: 0,
            onboarding_complete: true,
          }, { onConflict: 'id' })
        } catch (err) {
          console.error('Onboarding save error', err)
        } finally {
          navigate('/home')
        }
      }}
    />
  )
}

function DisplayNameStep({ value, onChange, onConfirmed }) {
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)
  const trimmed = value.trim()
  const canConfirm = trimmed.length >= 2

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus()
      setFocused(true)
    }, 500)
    return () => clearTimeout(t)
  }, [])

  function confirm() {
    if (!canConfirm || submitting) return
    setSubmitting(true)
    setTimeout(() => onConfirmed(), 600)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-72 h-72 rounded-full bg-[#C9A84C] transition-opacity duration-1000 ${
            focused ? 'opacity-15' : 'opacity-0'
          }`}
          style={{ filter: 'blur(90px)' }}
        />
      </div>

      <div className={`w-full max-w-sm text-center relative z-10 transition-all duration-500 ${
        submitting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <p className="text-[#C9A84C] font-mono text-xl mb-2">
          Hunter, identify yourself.
        </p>
        <p className="text-gray-500 font-mono text-xs mb-10">
          This name will appear on your Hunter Card.
        </p>

        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirm() }}
            onFocus={() => setFocused(true)}
            placeholder="ENTER NAME..."
            maxLength={20}
            className="w-full bg-transparent border-0 border-b border-gray-700 focus:border-[#C9A84C] text-[#E8E8E8] font-mono text-2xl text-center placeholder-gray-700 focus:outline-none pb-2 transition-colors"
          />
          <p className="text-gray-600 font-mono text-[11px] mt-2">
            {trimmed.length}/20 CHARACTERS
          </p>
        </div>

        <p
          className={`font-mono text-xs mb-6 transition-colors ${
            canConfirm ? 'text-[#C9A84C]' : 'text-gray-700'
          }`}
        >
          {trimmed.length === 0
            ? 'TYPE YOUR NAME ABOVE'
            : canConfirm
              ? `CONFIRMED AS: ${trimmed.toUpperCase()}`
              : 'MINIMUM 2 CHARACTERS'}
        </p>

        <button
          onClick={confirm}
          disabled={!canConfirm}
          className={`w-full font-mono font-bold py-3 rounded text-sm transition-all ${
            canConfirm
              ? 'bg-[#C9A84C] text-black hover:bg-[#B8973B]'
              : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
          }`}
        >
          {canConfirm ? `CONFIRM — ${trimmed.toUpperCase()}` : 'ENTER YOUR NAME TO PROCEED'}
        </button>
      </div>
    </div>
  )
}

function AvatarStep({ selectedId, onSelect, onNext }) {
  const canNext = !!selectedId

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col px-6 py-8">
      <div className="max-w-lg mx-auto flex-1 flex flex-col">
        <div className="mb-6 text-center">
          <p className="text-[#C9A84C] font-mono text-xs tracking-[0.25em] mb-2">
            SYSTEM CONFIG
          </p>
          <p className="text-[#C9A84C] font-mono text-sm font-bold mb-1">
            CHOOSE YOUR HUNTER CLASS
          </p>
          <p className="text-gray-500 font-mono text-xs">
            Your avatar reflects your path. It will evolve as you grow.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {AVATAR_CLASSES.map(cls => {
            const selected = cls.id === selectedId
            const ringColor =
              cls.key === 'Vanguard' ? 'ring-[#C9A84C]' :
              cls.key === 'Artisan' ? 'ring-[#C084FC]' :
              cls.key === 'Sage' ? 'ring-[#60A5FA]' :
              'ring-[#4ADE80]'

            const bgColor =
              cls.key === 'Vanguard' ? 'bg-[#C9A84C]/10' :
              cls.key === 'Artisan' ? 'bg-[#C084FC]/10' :
              cls.key === 'Sage' ? 'bg-[#60A5FA]/10' :
              'bg-[#4ADE80]/10'

            return (
              <button
                key={cls.id}
                onClick={() => onSelect(cls.id)}
                className={`border rounded-lg px-3 py-4 flex flex-col items-center text-center transition-all duration-200 ${
                  selected
                    ? `${bgColor} border-transparent shadow-[0_0_25px_rgba(0,0,0,0.8)] ring-2 ${ringColor}`
                    : 'bg-[#0D1117] border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{cls.emoji}</div>
                <div className="text-[#E8E8E8] font-mono text-xs font-bold mb-1">
                  {cls.name}
                </div>
                <div className="text-gray-500 font-mono text-[10px]">
                  {cls.domain}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-auto">
          <button
            onClick={onNext}
            disabled={!canNext}
            className={`w-full font-mono font-bold py-3 rounded text-sm transition-all ${
              canNext
                ? 'bg-[#C9A84C] text-black hover:bg-[#B8973B]'
                : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
            }`}
          >
            {canNext ? 'CONFIRM CLASS' : 'SELECT A CLASS TO CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GiftBoxStep({ displayName, avatarClass, onComplete }) {
  const [phase, setPhase] = useState(0)
  const [xpValue, setXpValue] = useState(0)
  const [canTapToContinue, setCanTapToContinue] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 3800),
      setTimeout(() => setPhase(5), 4500),
      setTimeout(() => setPhase(6), 5200),
      setTimeout(() => {
        setPhase(7)
        setCanTapToContinue(true)
      }, 6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase < 5) return
    let frame
    const start = performance.now()
    const duration = 600

    const loop = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = t * (2 - t)
      setXpValue(Math.round(GIFT_XP * eased))
      if (t < 1) {
        frame = requestAnimationFrame(loop)
      }
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  function handleTap() {
    if (!canTapToContinue) return
    onComplete()
  }

  const titleName = displayName ? displayName.toUpperCase() : 'HUNTER'
  const classLabel = avatarClass?.name || 'RECRUIT'

  return (
    <div
      className="min-h-screen bg-black text-[#E8E8E8] font-mono relative overflow-hidden"
      onClick={handleTap}
    >
      <div className="absolute inset-6 border border-[#C9A84C]/10 pointer-events-none" />
      {phase >= 2 && (
        <div className="absolute inset-6 pointer-events-none">
          <div
            className="absolute inset-0 border border-[#C9A84C]/40 rounded-sm"
            style={{ boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}
          />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 h-12 flex items-center justify-center">
          {phase >= 1 && (
            <TypewriterLine text="SYSTEM DETECTED A NEW RECRUIT" delay={0} />
          )}
        </div>

        <div className="mb-6">
          <div
            className={`w-32 h-32 border-2 border-[#C9A84C] rounded-lg flex items-center justify-center mx-auto transition-all duration-400 ${
              phase >= 3 ? 'opacity-100 scale-100 shadow-[0_0_35px_#C9A84C55]' : 'opacity-0 scale-75'
            } ${phase >= 4 ? 'bg-[#C9A84C]/20' : ''}`}
          >
            <span className="text-4xl text-[#C9A84C]">✦</span>
          </div>
        </div>

        <div className="mb-4">
          {phase >= 4 && (
            <p className="text-[#C9A84C] font-mono text-xs tracking-[0.3em]">
              NEW RECRUIT SUPPORT PACKAGE
            </p>
          )}
        </div>

        <div className="mb-4 h-10 flex items-center justify-center">
          {phase >= 5 && (
            <p className="text-[#C9A84C] font-mono text-3xl">
              +{xpValue} XP
            </p>
          )}
        </div>

        <div className="space-y-1 mb-6">
          {phase >= 6 && (
            <>
              <p className="text-gray-500 font-mono text-xs tracking-[0.25em]">
                TITLE UNLOCKED
              </p>
              <p className="text-[#C9A84C] font-mono text-sm italic">
                "{GIFT_TITLE}"
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          {phase >= 7 && (
            <p className="text-gray-600 font-mono text-xs animate-pulse">
              TAP TO CONTINUE, {titleName} · {classLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TypewriterLine({ text, delay = 0 }) {
  const [visibleChars, setVisibleChars] = useState(0)

  useEffect(() => {
    let frame
    const start = performance.now() + delay
    const total = text.length
    const duration = 1400

    const loop = (now) => {
      if (now < start) {
        frame = requestAnimationFrame(loop)
        return
      }
      const t = Math.min((now - start) / duration, 1)
      const chars = Math.floor(total * t)
      setVisibleChars(chars)
      if (t < 1) {
        frame = requestAnimationFrame(loop)
      }
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [text, delay])

  const content = text.slice(0, visibleChars)
  const showCursor = visibleChars < text.length

  return (
    <p className="text-[#C9A84C] font-mono text-xs tracking-[0.25em]">
      {content}
      {showCursor && <span className="animate-pulse">▌</span>}
    </p>
  )
}

