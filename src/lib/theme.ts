import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

/** Keeps the `.dark` class on <html> in sync with settings.theme,
 *  following the OS preference while theme is 'system'. */
export function useThemeEffect(): void {
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])
}
