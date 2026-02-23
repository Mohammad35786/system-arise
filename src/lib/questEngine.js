// Frog Decision Engine — core scoring formula

export function calculateUrgency(deadline) {
    if (!deadline) return 1
    const now = new Date()
    const due = new Date(deadline)
    const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 0) return 10
    if (daysUntil <= 1) return 9
    if (daysUntil <= 3) return 7
    if (daysUntil <= 7) return 5
    if (daysUntil <= 14) return 3
    if (daysUntil <= 30) return 2
    return 1
  }
  
  export function calculateScore(task) {
    const impact = task.impact || 5
    const urgency = calculateUrgency(task.deadline)
    const alignment = task.goal_alignment || 5
    const energy = 3 // default mid energy match
    const fear = task.fear_flag ? 4 : 0 // fear BOOSTS score — avoidance = likely a Frog
    const penaltyBoost = task.penalty_tag ? 5 : 0 // carried forward tasks get extra urgency
  
    return (impact * 3) + (urgency * 2) + (alignment * 2) + (energy * 1) + (fear * 2) + penaltyBoost
  }
  
  export function buildQuestBoard(tasks) {
    if (!tasks || tasks.length === 0) return { frog: null, sideQuests: [] }
  
    // Score all tasks
    const scored = tasks
      .filter(t => !t.completed)
      .map(t => ({ ...t, score: calculateScore(t) }))
      .sort((a, b) => b.score - a.score)
  
    if (scored.length === 0) return { frog: null, sideQuests: [] }
  
    // Top scorer is the Frog
    const frog = { ...scored[0], is_frog: true }
  
    // Next up to 3 become side quests with ABCDE labels
    const labels = ['A', 'B', 'C']
    const sideQuests = scored.slice(1, 4).map((task, index) => ({
      ...task,
      abcde_label: labels[index] || 'C'
    }))
  
    return { frog, sideQuests }
  }
  
  export function calculateXP(completedBeforeNoon, isAllAQuests) {
    const baseXP = completedBeforeNoon ? 150 : 100
    const bonusXP = isAllAQuests ? 200 : 0
    return baseXP + bonusXP
  }