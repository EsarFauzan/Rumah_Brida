import { Moon, Sun } from 'lucide-react'
import useTheme from '../hooks/useTheme'
import { setTheme } from '../services/themeStore'

export default function ThemeToggle() {
  const theme = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Sun className="theme-toggle-icon is-sun" size={17} strokeWidth={2.1} aria-hidden="true" />
      <Moon className="theme-toggle-icon is-moon" size={17} strokeWidth={2.1} aria-hidden="true" />
    </button>
  )
}
