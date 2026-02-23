export function applyBackground(bgId) {
    const root = document.documentElement
    if (bgId === 'default') {
        root.style.setProperty('--bg-primary', '#080810')
        document.body.style.background = '#080810'
        document.body.style.backgroundImage = 'none'
    }
    if (bgId === 'navy') {
        root.style.setProperty('--bg-primary', '#0a0a1a')
        document.body.style.background = '#0a0a1a'
        document.body.style.backgroundImage = 'none'
    }
    if (bgId === 'gradient') {
        root.style.setProperty('--bg-primary', '#080810')
        document.body.style.background = '#080810'
        document.body.style.backgroundImage =
            'radial-gradient(ellipse at top, #0d0d2b 0%, #080810 60%)'
        document.body.style.backgroundAttachment = 'fixed'
    }
    localStorage.setItem('arise_bg', bgId)
}
