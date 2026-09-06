import { useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import useTheme from '../hooks/useTheme'
import { setTheme } from '../services/themeStore'

const RIPPLE_MS = 600
const RIPPLE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

export default function ThemeToggle() {
  const theme = useTheme()
  const buttonRef = useRef(null)

  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  const rippleFromButton = (root) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

    root.animate(
      [
        { clipPath: `circle(0% at ${x}px ${y}px)` },
        { clipPath: `circle(150% at ${x}px ${y}px)` },
      ],
      { duration: RIPPLE_MS, easing: RIPPLE_EASING, pseudoElement: '::view-transition-new(root)' },
    )
  }

  const applyTheme = () => {
    const supportsViewTransition = typeof document.startViewTransition === 'function'
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!supportsViewTransition || prefersReducedMotion) {
      setTheme(nextTheme)
      return
    }

    document.startViewTransition(() => {
      setTheme(nextTheme)
    })
      .ready.then(() => rippleFromButton(document.documentElement))
    return
  }

  const handleClick = () => {
    applyTheme()
  }

  return (
    <button
      ref={buttonRef}
      className="theme-toggle"
      type="button"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      onClick={handleClick}
    >
      <Sun className="theme-toggle-icon is-sun" size={17} strokeWidth={2.1} aria-hidden="true" />
      <Moon className="theme-toggle-icon is-moon" size={17} strokeWidth={2.1} aria-hidden="true" />
    </button>
  )
}
