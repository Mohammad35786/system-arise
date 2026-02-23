export const RANK_THRESHOLDS = {
    E: { min: 0, max: 499, next: 'D' },
    D: { min: 500, max: 1499, next: 'C' },
    C: { min: 1500, max: 3499, next: 'B' },
    B: { min: 3500, max: 7499, next: 'A' },
    A: { min: 7500, max: 14999, next: 'S' },
    S: { min: 15000, max: Infinity, next: null },
}

export function getRankFromXP(xp) {
    for (const [rank, threshold] of Object.entries(RANK_THRESHOLDS)) {
        if (xp >= threshold.min && xp <= threshold.max) return rank
    }
    return 'S'
}

export function getLevelFromXP(xp) {
    return Math.floor(xp / 100) + 1
}

export function getProgressToNextRank(xp, rank) {
    const threshold = RANK_THRESHOLDS[rank]
    if (!threshold || !threshold.next) return 100
    const rangeSize = threshold.max - threshold.min + 1
    const progress = xp - threshold.min
    return Math.min(Math.round((progress / rangeSize) * 100), 100)
}

export function checkRankUp(oldXP, newXP) {
    const oldRank = getRankFromXP(oldXP)
    const newRank = getRankFromXP(newXP)
    if (oldRank !== newRank) return newRank
    return null
}
