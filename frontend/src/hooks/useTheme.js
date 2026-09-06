import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme } from '../services/themeStore'

export default function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme, getTheme)
}
