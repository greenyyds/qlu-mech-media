import { useEffect, useState } from 'react'

const STORAGE_KEY = 'qlu-mech-media:theme:v1'

function getStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

/**
 * 主题管理：system（跟随系统）/ light / dark 三态
 * - .dark class 挂在 <html> 上（Tailwind class 策略）
 * - 选择持久化到 localStorage；跟随系统时监听系统变化
 * - 同步 <meta name="theme-color">（移动端状态栏配色）
 */
export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  // 监听系统主题变化（仅在 system 模式下生效）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // 应用主题
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemDark)
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* 忽略隐私模式 */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isDark ? '#000000' : '#f5f5f7')
  }, [theme, systemDark])

  return { theme, setTheme, isDark: theme === 'dark' || (theme === 'system' && systemDark) }
}
