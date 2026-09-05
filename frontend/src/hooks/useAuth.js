import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '../services/authStore'

/**
 * Membaca sesi login dari authStore agar seluruh komponen tetap sinkron.
 */
function useAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession)

  return {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token),
  }
}

export default useAuth
