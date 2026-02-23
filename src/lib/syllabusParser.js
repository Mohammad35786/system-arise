// Parse pasted text into units array
// Rules:
// - Each non-empty line that is NOT indented = a unit name
// - Lines starting with spaces, tabs, -, *, or • = subtopics of previous unit
// - Empty line between paragraphs separates units
// - If no structure detected, split by newlines into separate units
export function parseInputToUnits(rawText) {
    if (!rawText || !rawText.trim()) return []

    const lines = rawText.split('\n')
    const units = []
    let currentUnit = null

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Skip empty lines, push current unit
        if (!trimmed) {
            if (currentUnit) {
                units.push(currentUnit)
                currentUnit = null
            }
            continue
        }

        // Check if this is a subtopic (indented or starts with bullet)
        const isSubtopic =
            line.startsWith('  ') ||
            line.startsWith('\t') ||
            trimmed.startsWith('-') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('•') ||
            trimmed.startsWith('>')

        if (isSubtopic && currentUnit) {
            // Add as subtopic, remove bullet characters
            const subtopicText = trimmed.replace(/^[-*•>]\s*/, '').trim()
            if (subtopicText) currentUnit.subtopics.push(subtopicText)
        } else {
            // New unit
            if (currentUnit) units.push(currentUnit)
            currentUnit = {
                name: trimmed,
                subtopics: [],
            }
        }
    }

    // Push last unit
    if (currentUnit) units.push(currentUnit)

    return units
}

// Distribute units across days as evenly as possible
export function distributeUnitsAcrossDays(units, durationDays, isManualMode = false) {
    if (!units.length || !durationDays) return []

    const days = []

    // Strictly respect the manual mode flag
    const isManual = isManualMode

    if (isManual) {
        for (let day = 1; day <= durationDays; day++) {
            const dayUnits = units.filter(u => Number(u.assignedDay) === day)
            const subtopicsFlat = dayUnits.flatMap(u => u.subtopics || []).slice(0, 3)

            days.push({
                day,
                units: dayUnits,
                title: dayUnits.length > 0
                    ? `Day ${day}: ${dayUnits.map(u => u.name).join(' + ')}`
                    : `Day ${day}: Review and consolidation`,
                description: dayUnits.length > 0
                    ? `Cover ${dayUnits.length} unit${dayUnits.length > 1 ? 's' : ''}: ${dayUnits.map(u => u.name).join(', ')}.${subtopicsFlat.length > 0 ? ' Key subtopics: ' + subtopicsFlat.join(', ') + '.' : ''}`
                    : 'Review all previous material. Fill gaps. Test yourself.',
                firstStep: dayUnits.length > 0
                    ? `Open your materials for "${dayUnits[0].name}" and read the overview first.`
                    : 'Review your notes from all previous days.',
                estimatedMinutes: Math.min(30 * Math.max(dayUnits.length, 1) + 15, 180),
                phase: day <= Math.ceil(durationDays * 0.3) ? 'Foundation'
                    : day <= Math.ceil(durationDays * 0.7) ? 'Core Study'
                        : 'Consolidation',
                completed: false,
                completedAt: null,
            })
        }
    } else {
        // Auto-distribution logic
        const totalUnits = units.length
        const basePerDay = Math.floor(totalUnits / durationDays)
        const remainder = totalUnits % durationDays
        let unitIndex = 0

        for (let day = 1; day <= durationDays; day++) {
            const unitsForDay = basePerDay + (day <= remainder ? 1 : 0)
            const dayUnits = units.slice(unitIndex, unitIndex + unitsForDay)
            unitIndex += unitsForDay

            const subtopicsFlat = dayUnits.flatMap(u => u.subtopics || []).slice(0, 3)

            days.push({
                day,
                units: dayUnits,
                title: dayUnits.length > 0
                    ? `Day ${day}: ${dayUnits.map(u => u.name).join(' + ')}`
                    : `Day ${day}: Review and consolidation`,
                description: dayUnits.length > 0
                    ? `Cover ${dayUnits.length} unit${dayUnits.length > 1 ? 's' : ''}: ${dayUnits.map(u => u.name).join(', ')}.${subtopicsFlat.length > 0 ? ' Key subtopics: ' + subtopicsFlat.join(', ') + '.' : ''}`
                    : 'Review all previous material. Fill gaps. Test yourself.',
                firstStep: dayUnits.length > 0
                    ? `Open your materials for "${dayUnits[0].name}" and read the overview first.`
                    : 'Review your notes from all previous days.',
                estimatedMinutes: Math.min(30 * Math.max(unitsForDay, 1) + 15, 180),
                phase: day <= Math.ceil(durationDays * 0.3) ? 'Foundation'
                    : day <= Math.ceil(durationDays * 0.7) ? 'Core Study'
                        : 'Consolidation',
                completed: false,
                completedAt: null,
            })
        }
    }

    return days
}

// Preview distribution before saving
export function previewDistribution(units, durationDays, isManualMode = false) {
    const days = distributeUnitsAcrossDays(units, durationDays, isManualMode)
    return days.map(d => ({
        day: d.day,
        unitCount: d.units.length,
        unitNames: d.units.map(u => u.name),
        estimatedMinutes: d.estimatedMinutes,
    }))
}
