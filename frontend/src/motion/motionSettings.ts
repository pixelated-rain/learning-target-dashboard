import { useEffect, useState } from 'react'

export type MotionPreference = 'system' | 'full' | 'reduced'

const STORAGE_KEY = 'learning-target-dashboard:motion-preference'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function storedPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'system'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'full' || stored === 'reduced' ? stored : 'system'
}

function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function useMotionPreference() {
  const [preference, setPreferenceState] = useState<MotionPreference>(storedPreference)
  const [systemReduced, setSystemReduced] = useState(systemPrefersReducedMotion)

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const updateSystemPreference = () => setSystemReduced(mediaQuery.matches)

    updateSystemPreference()
    mediaQuery.addEventListener('change', updateSystemPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateSystemPreference)
    }
  }, [])

  function setPreference(nextPreference: MotionPreference) {
    setPreferenceState(nextPreference)

    if (nextPreference === 'system') {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, nextPreference)
    }
  }

  const reducedMotion =
    preference === 'reduced' ||
    (preference === 'system' && systemReduced)

  return {
    preference,
    setPreference,
    reducedMotion,
  }
}
