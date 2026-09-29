import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '../services/authStore'
import { isAdministrator, isSuperAdmin } from '../utils/auth'

/**
 * Membaca sesi login dari authStore agar seluruh komponen tetap sinkron.
 */
function useAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession)

  return {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token),
    isAdministrator: isAdministrator(session.user),
    isSuperAdmin: isSuperAdmin(session.user),
  }
}

export default useAuth
