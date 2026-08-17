import { ArrowUpRight, Building2, Clapperboard, Globe, MessageCircle, Sparkles } from 'lucide-react'
import { linkGroups } from '../data/links'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'

/** 图标映射：data/links.js 中的 icon 键 -> lucide 组件 */
const ICONS = {
  Globe,
  Building2,
  MessageCircle,
  Clapperboard,
  Sparkles,
}

/**
 * 常用链接模块
 * 两个分组：媒体链接（校官网 / 学部官网 / 公众号）、工具链接（剪映 / DeepSeek）
 * 数据维护入口：src/data/links.js
 */
export default function QuickLinks() {
  return (
    <section id="links" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="Quick Links"
            title="常用链接"
            description="官方渠道与日常创作工具，点击卡片在新窗口打开。"
          />
        </Reveal>

        <div className="mt-12 space-y-12">
          {linkGroups.map((group, gi) => (
            <div key={group.id}>
              <Reveal>
                <div className="mb-5 flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                    {group.title}
                  </h3>
                  <span className="text-[13px] text-tertiary">{group.description}</span>
                </div>
              </Reveal>

              <div
                className={`grid gap-4 ${
                  group.links.length > 2
                    ? 'sm:grid-cols-2 lg:grid-cols-3'
                    : 'sm:grid-cols-2'
                }`}
              >
                {group.links.map((link, i) => (
                  <LinkCard key={link.name} link={link} delay={(gi * 3 + i) * 60} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 单张链接卡片；url 缺失时渲染"待配置"占位，避免死链接 */
function LinkCard({ link, delay }) {
  const Icon = ICONS[link.icon] || Globe

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${link.tint}`}
        >
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <ArrowUpRight
          size={18}
          className="text-tertiary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
      <h4 className="mt-4 text-[17px] font-semibold text-ink">{link.name}</h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{link.desc}</p>
    </>
  )

  return (
    <Reveal delay={delay} className="h-full">
      {link.url ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.name}，新窗口打开`}
          className="card-lift group block h-full rounded-3xl border border-line bg-surface p-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
        >
          {body}
        </a>
      ) : (
        <div className="block h-full rounded-3xl border border-dashed border-line-strong bg-surface p-6 opacity-70">
          {body}
          <p className="mt-3 text-xs text-tertiary">链接待确认，请在 src/data/links.js 补充</p>
        </div>
      )}
    </Reveal>
  )
}
