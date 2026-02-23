import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('arise_theme') || 'dark'
    })

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'light') {
            root.classList.add('theme-light')
            root.classList.remove('theme-dark')
        } else {
            root.classList.add('theme-dark')
            root.classList.remove('theme-light')
        }
        localStorage.setItem('arise_theme', theme)
    }, [theme])

    const setTheme = (newTheme) => {
        if (newTheme === 'dark' || newTheme === 'light') {
            setThemeState(newTheme)
        }
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
