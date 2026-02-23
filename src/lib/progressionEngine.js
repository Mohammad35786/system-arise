export function getTodayTarget(habit) {
  if (!habit?.progression_enabled) return null
  if (!habit.progression_start_date) return null
  if (habit.progression_start_value == null) return null
  if (habit.progression_target_value == null) return null
  if (!habit.progression_days) return null

  const startDate = new Date(habit.progression_start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)

  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  const currentDay = daysPassed + 1

  if (currentDay >= habit.progression_days) return Math.round(habit.progression_target_value)
  if (currentDay <= 0) return Math.round(habit.progression_start_value)

  const totalIncrease = habit.progression_target_value - habit.progression_start_value
  const dailyIncrement = totalIncrease / habit.progression_days
  const todayValue = habit.progression_start_value + (dailyIncrement * (currentDay - 1))
  return Math.round(todayValue)
}

export function getTomorrowTarget(habit) {
  if (!habit?.progression_enabled) return null
  if (!habit.progression_start_date) return null
  if (habit.progression_start_value == null) return null
  if (habit.progression_target_value == null) return null
  if (!habit.progression_days) return null

  const startDate = new Date(habit.progression_start_date)
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)
  startDate.setHours(0, 0, 0, 0)

  const daysPassed = Math.floor((tomorrow - startDate) / (1000 * 60 * 60 * 24))
  const tomorrowDay = daysPassed + 1

  if (tomorrowDay >= habit.progression_days) return Math.round(habit.progression_target_value)
  if (tomorrowDay <= 0) return Math.round(habit.progression_start_value)

  const totalIncrease = habit.progression_target_value - habit.progression_start_value
  const dailyIncrement = totalIncrease / habit.progression_days
  const tomorrowValue = habit.progression_start_value + (dailyIncrement * (tomorrowDay - 1))
  return Math.round(tomorrowValue)
}

export function getCurrentDay(habit) {
  if (!habit?.progression_start_date) return 1
  const startDate = new Date(habit.progression_start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(daysPassed + 1, habit.progression_days || 1))
}

export function getProgressPercent(habit) {
  const currentDay = getCurrentDay(habit)
  const totalDays = habit?.progression_days || 1
  return Math.round((currentDay / totalDays) * 100)
}

export function isProgressionComplete(habit) {
  if (!habit?.progression_enabled) return false
  const currentDay = getCurrentDay(habit)
  return currentDay >= (habit.progression_days || 1)
}
