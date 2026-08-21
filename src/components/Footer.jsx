import { useState } from 'react'
import { Check, Download } from 'lucide-react'
import Logo from './Logo'
import uniLogo from '../assets/uni-logo-blue.png'
import { exportBackup } from '../services/backupService'

/** 页脚快速导航 */
const NAV = [
  { id: 'home', label: '首页' },
  { id: 'links', label: '链接', href: '#/links' },
  { id: 'news', label: '新闻工具' },
  { id: 'tasks', label: '任务规划' },
  { id: 'roster', label: '值班表' },
  { id: 'tutorials', label: '教程', href: '#/tutorials' },
  { id: 'feedback', label: '意见反馈', href: '#/feedback' },
]

/**
 * 页脚（含"关于"锚点）
 * 版权信息、学部名称、简洁链接、数据备份导出
 */
export default function Footer() {
  const year = new Date().getFullYear()
  const [backedUp, setBackedUp] = useState(false)

  const handleBackup = async () => {
    await exportBackup()
    setBackedUp(true)
    setTimeout(() => setBackedUp(false), 2500)
  }

  return (
    <footer id="about" className="scroll-mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* 关于全媒体 */}
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <span className="text-[15px] font-semibold text-ink">机械工程学部全媒体</span>
            </div>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-secondary">
              齐鲁工业大学机械工程学部全媒体部门，负责学部新闻宣传、新媒体运营与品牌内容创作。
              本工作台为部门内部工具，整合常用入口、任务规划与新闻创作能力。
            </p>
          </div>

          {/* 快速导航 */}
          <nav aria-label="页脚导航">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-tertiary">
              快速导航
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.href || `#${l.id}`}
                    className="text-[13.5px] text-secondary transition-colors hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* 关于与联系 */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-tertiary">
              关于与联系
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-secondary">
              <li>
                <a href="#about" className="transition-colors hover:text-accent">
                  关于全媒体
                </a>
              </li>
              <li>联系方式：详见部门群公告</li>
              <li>
                <a href="#/feedback" className="transition-colors hover:text-accent">
                  建议反馈：意见反馈页
                </a>
              </li>
            </ul>
            {/* 校 LOGO（横版透明 PNG，已压缩） */}
            <img
              src={uniLogo}
              alt="齐鲁工业大学（山东省科学院）LOGO"
              loading="lazy"
              className="mt-6 h-8 w-auto opacity-90"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-[12.5px] text-tertiary md:flex-row md:items-center">
          <p>© {year} 齐鲁工业大学机械工程学部全媒体 · 内部工具</p>
          <div className="flex items-center gap-4">
            <p>数据云端共享 · 请勿外传链接</p>
            <button
              type="button"
              onClick={handleBackup}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-secondary transition-colors hover:text-accent"
            >
              {backedUp ? (
                <>
                  <Check size={13} aria-hidden="true" />
                  已导出
                </>
              ) : (
                <>
                  <Download size={13} aria-hidden="true" />
                  导出数据备份
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
