import { useEffect, useState } from 'react'
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import Logo from './Logo'
import { useTheme } from '../hooks/useTheme'

/** 导航锚点配置 */
const NAV_LINKS = [
  { id: 'home', label: '首页' },
  { id: 'links', label: '链接', href: '#/links' },
  { id: 'news', label: '新闻工具' },
  { id: 'tasks', label: '任务规划' },
  { id: 'roster', label: '值班表' },
  { id: 'tutorials', label: '教程', href: '#/tutorials' },
  { id: 'feedback', label: '意见反馈', href: '#/feedback' },
  { id: 'about', label: '关于' },
]

/** 主题循环：系统 → 浅色 → 深色 */
const THEME_CYCLE = [
  { value: 'system', label: '跟随系统', Icon: Monitor },
  { value: 'light', label: '浅色模式', Icon: Sun },
  { value: 'dark', label: '深色模式', Icon: Moon },
]

/**
 * 顶部导航栏
 * - 毛玻璃：backdrop-filter blur(20px)，滚动后增强阴影
 * - 移动端折叠为汉堡菜单
 * - 右侧主题切换（系统/浅色/深色 循环）
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // 滚动后增强阴影
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ESC 关闭移动菜单
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const cycleTheme = () => {
    const idx = THEME_CYCLE.findIndex((t) => t.value === theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length].value)
  }

  const current = THEME_CYCLE.find((t) => t.value === theme) || THEME_CYCLE[0]
  const CurrentIcon = current.Icon

  return (
    <header
      className={`glass sticky top-0 z-50 border-b transition-shadow duration-300 ${
        scrolled
          ? 'border-line shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          : 'border-transparent'
      }`}
    >
      <nav
        aria-label="主导航"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8"
      >
        {/* 左侧：部门 Logo + 名称 */}
        <a
          href="#home"
          className="flex items-center gap-3"
          aria-label="机械工程学部全媒体，返回首页"
        >
          <Logo />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            机械工程学部全媒体
          </span>
        </a>

        <div className="flex items-center gap-1">
          {/* 桌面端锚点 */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href || `#${l.id}`}
                className="rounded-full px-4 py-2 text-sm text-secondary transition-colors duration-300 hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* 主题切换 */}
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`当前${current.label}，点击切换`}
            title={`当前${current.label}，点击切换`}
            className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <CurrentIcon size={18} aria-hidden="true" />
          </button>

          {/* 移动端汉堡按钮（44px 触控目标） */}
          <button
            type="button"
            className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* 移动端下拉菜单（grid-rows 动画：高度自适应内容，永不被固定高度截断） */}
      <div
        id="mobile-nav"
        className={`grid transition-[grid-template-rows,opacity] duration-300 md:hidden ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <nav aria-label="移动端导航" className="space-y-1 border-t border-line px-5 pb-5 pt-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href || `#${l.id}`}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-[15px] text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
