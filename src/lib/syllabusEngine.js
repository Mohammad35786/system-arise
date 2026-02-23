export function sliceGoalIntoDays(goalName, durationDays, domain) {
  const slices = []

  let phases
  if (durationDays <= 3) {
    phases = [
      { name: 'Foundation', ratio: 0.34 },
      { name: 'Practice', ratio: 0.33 },
      { name: 'Consolidation', ratio: 0.33 }
    ]
  } else if (durationDays <= 7) {
    phases = [
      { name: 'Foundation', ratio: 0.28 },
      { name: 'Core Learning', ratio: 0.43 },
      { name: 'Application', ratio: 0.29 }
    ]
  } else if (durationDays <= 30) {
    phases = [
      { name: 'Foundation', ratio: 0.20 },
      { name: 'Core Learning', ratio: 0.35 },
      { name: 'Deep Practice', ratio: 0.30 },
      { name: 'Mastery', ratio: 0.15 }
    ]
  } else {
    phases = [
      { name: 'Foundation', ratio: 0.15 },
      { name: 'Core Learning', ratio: 0.30 },
      { name: 'Deep Practice', ratio: 0.30 },
      { name: 'Application', ratio: 0.15 },
      { name: 'Mastery', ratio: 0.10 }
    ]
  }

  let dayCounter = 1
  const phaseRanges = phases.map(phase => {
    const days = Math.max(1, Math.round(phase.ratio * durationDays))
    const range = { ...phase, startDay: dayCounter, days }
    dayCounter += days
    return range
  })

  for (let day = 1; day <= durationDays; day++) {
    const phase = phaseRanges.find(p => day >= p.startDay && day < p.startDay + p.days) || phaseRanges[phaseRanges.length - 1]
    const dayInPhase = day - phase.startDay + 1
    const isFirst = day === 1
    const isLast = day === durationDays
    const isMidpoint = day === Math.ceil(durationDays / 2)

    let title, description, firstStep, estimatedMinutes

    if (isFirst) {
      title = `Day ${day}: Begin ${goalName}`
      description = `${phase.name} phase. Set up your environment and understand the full scope of ${goalName}. Map what you know and what you need to learn.`
      firstStep = `Open a blank document and write what you already know about ${goalName} in 5 minutes.`
      estimatedMinutes = 45
    } else if (isLast) {
      title = `Day ${day}: Complete ${goalName}`
      description = `Final consolidation. Review everything covered. Identify gaps. Produce one tangible output that proves your progress.`
      firstStep = `List the 3 most important things you learned during this plan.`
      estimatedMinutes = 60
    } else if (isMidpoint) {
      title = `Day ${day}: Midpoint Review — ${goalName}`
      description = `Halfway checkpoint. Review progress, identify the hardest remaining section, and recalibrate your approach for the second half.`
      firstStep = `Score your progress from 1 to 10 and write one sentence on what is slowing you down.`
      estimatedMinutes = 30
    } else {
      title = `Day ${day}: ${phase.name} — ${goalName} (${dayInPhase}/${phase.days})`
      description = `${phase.name} phase, day ${dayInPhase} of ${phase.days}. Focus on deliberate practice in the core area of ${goalName}. No skipping ahead.`
      firstStep = `Open your materials from yesterday and spend the first 5 minutes reviewing before starting new content.`
      estimatedMinutes = durationDays <= 7 ? 60 : 45
    }

    slices.push({
      day,
      title,
      description,
      firstStep,
      estimatedMinutes,
      phase: phase.name,
      domain,
      completed: false,
      completedAt: null
    })
  }

  return slices
}

export function getCurrentSlice(syllabus) {
  if (!syllabus || !syllabus.slices) return null
  const slices = typeof syllabus.slices === 'string'
    ? JSON.parse(syllabus.slices)
    : syllabus.slices
  return slices[syllabus.current_slice_index] || null
}

export function getProgressPercent(syllabus) {
  if (!syllabus || !syllabus.slices) return 0
  const slices = typeof syllabus.slices === 'string'
    ? JSON.parse(syllabus.slices)
    : syllabus.slices
  const completed = slices.filter(s => s.completed).length
  return Math.round((completed / slices.length) * 100)
}

