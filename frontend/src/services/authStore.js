const STORAGE_KEY = 'rumah-brida-auth'

const readStoredSession = () => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }

    const parsed = JSON.parse(raw)
    if (typeof parsed?.token !== 'string' || !parsed.token) return { token: null, user: null }

    return { token: parsed.token, user: parsed.user ?? null }
  } catch {
    return { token: null, user: null }
  }
}

// Token disimpan di sessionStorage supaya sesi berakhir saat tab ditutup.
let session = readStoredSession()
const listeners = new Set()

const persist = () => {
  try {
    if (session.token) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Penyimpanan tidak tersedia (mode privat); sesi tetap berlaku di memori.
  }
}

const emit = () => {
  listeners.forEach((listener) => listener())
}

export const subscribeSession = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSession = () => session

export const getToken = () => session.token

export const setSession = (token, user) => {
  session = { token, user: user ?? null }
  persist()
  emit()
}

export const clearSession = () => {
  if (!session.token && !session.user) return

  session = { token: null, user: null }
  persist()
  emit()
}
