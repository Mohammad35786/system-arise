export const AVATARS = [
    { id: 1, emoji: '⚔️', name: 'SHADOW BLADE', class: 'Vanguard', color: '#C9A84C' },
    { id: 2, emoji: '🗡️', name: 'SILENT EDGE', class: 'Vanguard', color: '#C9A84C' },
    { id: 3, emoji: '🏹', name: 'PHANTOM BOW', class: 'Artisan', color: '#60A5FA' },
    { id: 4, emoji: '📖', name: 'ARCANE SAGE', class: 'Sage', color: '#A78BFA' },
    { id: 5, emoji: '🛡️', name: 'IRON WALL', class: 'Vanguard', color: '#C9A84C' },
    { id: 6, emoji: '⚡', name: 'STORM CALLER', class: 'Sage', color: '#A78BFA' },
    { id: 7, emoji: '🔥', name: 'FLAME STRIKER', class: 'Artisan', color: '#F97316' },
    { id: 8, emoji: '🌙', name: 'MOON STALKER', class: 'Artisan', color: '#60A5FA' },
    { id: 9, emoji: '💀', name: 'DEATH WALKER', class: 'Vanguard', color: '#EF4444' },
    { id: 10, emoji: '🌿', name: 'NATURE WARDEN', class: 'Sage', color: '#4ADE80' },
    { id: 11, emoji: '❄️', name: 'FROST MONARCH', class: 'Sage', color: '#7DD3FC' },
    { id: 12, emoji: '🐉', name: 'DRAGON HERALD', class: 'Architect', color: '#C9A84C' },
    { id: 13, emoji: '🦅', name: 'SKY HUNTER', class: 'Artisan', color: '#60A5FA' },
    { id: 14, emoji: '⚗️', name: 'ALCHEMIST', class: 'Architect', color: '#A78BFA' },
    { id: 15, emoji: '🗿', name: 'STONE GUARDIAN', class: 'Vanguard', color: '#6B7280' },
    { id: 16, emoji: '🌊', name: 'TIDE BREAKER', class: 'Artisan', color: '#22D3EE' },
    { id: 17, emoji: '🎯', name: 'VOID ARCHER', class: 'Artisan', color: '#F97316' },
    { id: 18, emoji: '🧿', name: 'MIND WEAVER', class: 'Sage', color: '#A78BFA' },
    { id: 19, emoji: '⚙️', name: 'IRON ARCHITECT', class: 'Architect', color: '#C9A84C' },
    { id: 20, emoji: '🌑', name: 'SHADOW MONARCH', class: 'Architect', color: '#ffffff' },
]

export function getAvatarById(id) {
    return AVATARS.find(a => a.id === Number(id)) || AVATARS[0]
}

export function getAvatarsByClass(className) {
    return AVATARS.filter(a => a.class === className)
}

export const AVATAR_CLASSES = ['Vanguard', 'Artisan', 'Sage', 'Architect']
