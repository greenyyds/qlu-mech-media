import { useState } from 'react'
import { ChevronRight, Megaphone, X } from 'lucide-react'

const STORAGE_KEY = 'qlu-mech-media:notice-dismissed:v1'

/**
 * 公告横幅（自主添加模块①）
 * - 可关闭，关闭状态保存在本机（localStorage），下次打开不再显示
 * - 修改公告内容只需改 NOTICE_TEXT / NOTICE_LINK
 */
const NOTICE_TEXT = '公告：本周值班表已更新，请各成员及时查看。'
const NOTICE_LINK = { label: '查看值班表', href: '#roster' }

export default function NoticeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* 忽略隐私模式等写入失败 */
    }
    setDismissed(true)
  }

  return (
    <div className="relative z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 md:px-8">
        <Megaphone size={15} className="shrink-0 text-accent" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[13px] text-secondary">{NOTICE_TEXT}</p>
        <a
          href={NOTICE_LINK.href}
          className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-accent transition-opacity hover:opacity-80"
        >
          {NOTICE_LINK.label}
          <ChevronRight size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭公告"
          className="shrink-0 rounded-full p-1 text-tertiary transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
