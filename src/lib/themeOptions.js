export const ACCENT_OPTIONS = [
    {
        id: 'gold',
        label: 'SYSTEM GOLD',
        desc: 'Default — the original power',
        color: '#C9A84C',
        glow: '#C9A84C44',
    },
    {
        id: 'ice',
        label: 'ICE MONARCH',
        desc: 'Cold precision, frost clarity',
        color: '#7DD3FC',
        glow: '#7DD3FC44',
    },
    {
        id: 'flame',
        label: 'FLAME STRIKER',
        desc: 'Burn through every obstacle',
        color: '#F97316',
        glow: '#F9731644',
    },
    {
        id: 'shadow',
        label: 'SHADOW ARTS',
        desc: 'Move in silence, strike hard',
        color: '#A78BFA',
        glow: '#A78BFA44',
    },
    {
        id: 'blood',
        label: 'BLOOD OATH',
        desc: 'Forged in fire and sacrifice',
        color: '#EF4444',
        glow: '#EF444444',
    },
    {
        id: 'emerald',
        label: 'NATURE WARDEN',
        desc: 'Growth, discipline, endurance',
        color: '#4ADE80',
        glow: '#4ADE8044',
    },
]

export function getAccentLabel(colorHex) {
    const match = ACCENT_OPTIONS.find(a => a.color.toLowerCase() === colorHex?.toLowerCase())
    return match ? match.label : 'SYSTEM GOLD'
}
