export function checkForPenalties(tasks) {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const incompleteFrogs = tasks.filter(task => {
        if (task.completed) return false
        if (!task.created_at) return false
        if (task.penalty_tag) return false
        const created = new Date(task.created_at)
        return created < startOfToday
    })

    return incompleteFrogs
}

export function calculatePenaltyXP(task) {
    return 75
}

export async function applyPenalties(incompleteTasks, profile, supabase) {
    if (incompleteTasks.length === 0) return 0
    let totalXPLost = 0
    for (const task of incompleteTasks) {
        await supabase.from('tasks').update({
            penalty_tag: true,
            carried_forward: true,
        }).eq('id', task.id)
        totalXPLost += 75
    }
    const newXP = Math.max(0, (profile.xp || 0) - totalXPLost)
    await supabase.from('profiles').update({ xp: newXP }).eq('id', profile.id)
    return totalXPLost
}
