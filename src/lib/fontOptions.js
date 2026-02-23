export const FONT_OPTIONS = [
    {
        id: 'default',
        label: 'SYSTEM MONO',
        desc: 'Default terminal font',
        family: 'ui-monospace, monospace',
        preview: 'C-RANK HUNTER',
    },
    {
        id: 'rajdhani',
        label: 'RAJDHANI',
        desc: 'Sharp military precision',
        family: "'Rajdhani', sans-serif",
        preview: 'C-RANK HUNTER',
    },
    {
        id: 'orbitron',
        label: 'ORBITRON',
        desc: 'Futuristic sci-fi power',
        family: "'Orbitron', sans-serif",
        preview: 'C-RANK HUNTER',
    },
    {
        id: 'exo2',
        label: 'EXO 2',
        desc: 'Clean modern aggression',
        family: "'Exo 2', sans-serif",
        preview: 'C-RANK HUNTER',
    },
    {
        id: 'bebas',
        label: 'BEBAS NEUE',
        desc: 'Bold poster dominance',
        family: "'Bebas Neue', cursive",
        preview: 'C-RANK HUNTER',
    },
    {
        id: 'sharetech',
        label: 'SHARE TECH',
        desc: 'Hacker terminal style',
        family: "'Share Tech Mono', monospace",
        preview: 'C-RANK HUNTER',
    },
]

export function getFontById(id) {
    return FONT_OPTIONS.find(f => f.id === id) || FONT_OPTIONS[0]
}

export function applyFont(fontId) {
    const font = getFontById(fontId)
    document.documentElement.style.setProperty(
        '--app-font', font.family
    )
    localStorage.setItem('arise_font', fontId)
}
