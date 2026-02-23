export const REWARD_POOL = [
    { id: 'xp_50', type: 'XP', value: 50, label: '+50 BONUS XP', rarity: 'COMMON', color: '#C9A84C' },
    { id: 'xp_100', type: 'XP', value: 100, label: '+100 BONUS XP', rarity: 'UNCOMMON', color: '#C9A84C' },
    { id: 'xp_200', type: 'XP', value: 200, label: '+200 BONUS XP', rarity: 'RARE', color: '#60A5FA' },
    { id: 'xp_500', type: 'XP', value: 500, label: '+500 BONUS XP', rarity: 'LEGENDARY', color: '#C084FC' },
    { id: 'streak_3', type: 'STREAK', value: 3, label: '+3 STREAK BONUS', rarity: 'UNCOMMON', color: '#F97316' },
    { id: 'streak_7', type: 'STREAK', value: 7, label: '+7 STREAK BONUS', rarity: 'RARE', color: '#F97316' },
    { id: 'avatar_shadow', type: 'AVATAR', value: 'shadow', label: 'SHADOW FORM UNLOCKED', rarity: 'RARE', color: '#A78BFA' },
    { id: 'avatar_flame', type: 'AVATAR', value: 'flame', label: 'FLAME AURA UNLOCKED', rarity: 'RARE', color: '#F97316' },
    { id: 'avatar_ice', type: 'AVATAR', value: 'ice', label: 'ICE FORM UNLOCKED', rarity: 'UNCOMMON', color: '#7DD3FC' },
    { id: 'avatar_gold', type: 'AVATAR', value: 'gold', label: 'GOLD SOVEREIGN UNLOCKED', rarity: 'LEGENDARY', color: '#C9A84C' },
    // Certificate upload rewards
    { id: 'xp_bonus_300', type: 'XP_BONUS', value: 300, label: 'XP SURGE', rarity: 'RARE', color: '#60A5FA', description: '+300 XP awarded' },
    { id: 'xp_bonus_500', type: 'XP_BONUS', value: 500, label: 'KNOWLEDGE CRYSTAL', rarity: 'LEGENDARY', color: '#C084FC', description: '+500 XP awarded' },
    { id: 'streak_boost_5', type: 'STREAK_BOOST', value: 5, label: 'STREAK SURGE', rarity: 'RARE', color: '#F97316', description: '+5 Streak days' },
    { id: 'avatar_crown', type: 'AVATAR', value: 'crown', label: 'CROWN UNLOCKED', rarity: 'LEGENDARY', color: '#C9A84C', description: 'New avatar accessory' },
    { id: 'quote_1', type: 'QUOTE', rarity: 'COMMON', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { id: 'quote_2', type: 'QUOTE', rarity: 'COMMON', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { id: 'quote_3', type: 'QUOTE', rarity: 'COMMON', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
    { id: 'quote_4', type: 'QUOTE', rarity: 'UNCOMMON', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
    { id: 'quote_5', type: 'QUOTE', rarity: 'UNCOMMON', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
    { id: 'quote_6', type: 'QUOTE', rarity: 'RARE', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
    { id: 'quote_7', type: 'QUOTE', rarity: 'RARE', color: '#9CA3AF', label: 'WISDOM RECEIVED', quote: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
    { id: 'quote_8', type: 'QUOTE', rarity: 'LEGENDARY', color: '#C9A84C', label: 'LEGENDARY WISDOM', quote: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius' },
    { id: 'quote_9', type: 'QUOTE', rarity: 'LEGENDARY', color: '#C9A84C', label: 'LEGENDARY WISDOM', quote: 'First say to yourself what you would be, then do what you have to do.', author: 'Epictetus' },
    { id: 'quote_10', type: 'QUOTE', rarity: 'LEGENDARY', color: '#C9A84C', label: 'LEGENDARY WISDOM', quote: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
]

export const RARITY_CONFIG = {
    COMMON: { label: 'COMMON', color: '#9CA3AF', glow: '0 0 10px #9CA3AF33', bg: 'rgba(156,163,175,0.05)' },
    UNCOMMON: { label: 'UNCOMMON', color: '#4ADE80', glow: '0 0 20px #4ADE8044', bg: 'rgba(74,222,128,0.05)' },
    RARE: { label: 'RARE', color: '#60A5FA', glow: '0 0 30px #60A5FA66', bg: 'rgba(96,165,250,0.08)' },
    LEGENDARY: { label: 'LEGENDARY', color: '#C9A84C', glow: '0 0 50px #C9A84C88', bg: 'rgba(201,168,76,0.10)' },
}

export function rollReward() {
    const weights = { COMMON: 50, UNCOMMON: 30, RARE: 15, LEGENDARY: 5 }
    const pool = REWARD_POOL.map(r => ({ ...r, weight: weights[r.rarity] }))
    const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0)
    let random = Math.random() * totalWeight
    for (const reward of pool) {
        random -= reward.weight
        if (random <= 0) return reward
    }
    return pool[0]
}
