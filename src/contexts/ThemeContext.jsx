import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check local storage or system preference
        if (localStorage.getItem('theme')) {
            return localStorage.getItem('theme');
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [isFestive, setIsFestive] = useState(() => {
        const stored = localStorage.getItem('isFestive');
        return stored !== null ? JSON.parse(stored) : true; // Default to true
    });

    useEffect(() => {
        localStorage.setItem('isFestive', JSON.stringify(isFestive));
    }, [isFestive]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // Handle festive mode class
        if (isFestive) {
            root.classList.add('festive');
        } else {
            root.classList.remove('festive');
        }

        localStorage.setItem('theme', theme);
    }, [theme, isFestive]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const toggleFestiveMode = () => {
        setIsFestive(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isFestive, toggleFestiveMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
