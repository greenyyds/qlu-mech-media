import Logo from './Logo'
import uniLogo from '../assets/uni-logo-blue.png'

/** 页脚快速导航 */
const NAV = [
  { id: 'home', label: '首页' },
  { id: 'links', label: '媒体链接' },
  { id: 'news', label: '新闻工具' },
  { id: 'tasks', label: '任务规划' },
  { id: 'roster', label: '值班表' },
]

/**
 * 页脚（含"关于"锚点）
 * 版权信息、学部名称、简洁链接，保持极简
 */
export default function Footer() {
  const year = new Date().getFullYear()

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
                  <a href={`#${l.id}`} className="text-[13.5px] text-secondary transition-colors hover:text-accent">
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
              <li>建议反馈：联系部门技术组</li>
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

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-[12.5px] text-tertiary md:flex-row md:items-center">
          <p>© {year} 齐鲁工业大学机械工程学部全媒体 · 内部工具</p>
          <p>任务数据仅保存在本机浏览器，不上传服务器</p>
        </div>
      </div>
    </footer>
  )
}
