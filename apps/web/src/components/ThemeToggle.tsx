"use client";

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'commitcrew-theme';

function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const activeTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        setTheme(activeTheme);
        setMounted(true);
    }, []);

    function toggleTheme() {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        setTheme(nextTheme);
    }

    const isDark = mounted && theme === 'dark';

    return (
        <button
            type="button"
            aria-label={isDark ? 'Use light mode' : 'Use dark mode'}
            title={isDark ? 'Use light mode' : 'Use dark mode'}
            onClick={toggleTheme}
            className="clubhouse-button h-10 w-10 px-0"
        >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
    );
}
