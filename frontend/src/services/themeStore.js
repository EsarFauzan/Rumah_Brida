// Penyimpanan tema global (light/dark) dengan persistensi localStorage.
// Pola listener sama dengan authStore: setTheme memberi tahu pelanggan lewat
// listener sederhana, hook useTheme membacanya dengan useSyncExternalStore.
const STORAGE_KEY = 'rumah-brida-theme'

let currentTheme = detectInitialTheme()
const listeners = new Set()

function detectInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch {
    // localStorage bisa saja diblokir (mode privat/iframe); abaikan.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function getTheme() {
  return currentTheme
}

export function setTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') {
    return
  }

  currentTheme = theme

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Gagal simpan tidak boleh menggagalkan pergantian tema.
  }

  document.documentElement.dataset.theme = theme
  notify()
}

export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
}

export function subscribeTheme(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

if (typeof document !== 'undefined' && !document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = currentTheme
}
