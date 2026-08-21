import { useEffect } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Clapperboard,
  Globe,
  Image,
  MessageCircle,
  Newspaper,
  Sparkles,
} from 'lucide-react'
import { linkGroups } from '../data/links'
import { navigate } from '../utils/router'
import Reveal from './Reveal'

/** 图标映射：data/links.js 中的 icon 键 -> lucide 组件 */
const ICONS = {
  Globe,
  Building2,
  MessageCircle,
  Clapperboard,
  Sparkles,
  Image,
  Newspaper,
}

/**
 * 链接二级页（#/links，v4.3）
 * 原首页"常用链接"模块迁移至此：媒体链接 + 工具链接
 * 数据维护入口：src/data/links.js
 */
export default function LinksPage() {
  useEffect(() => {
    document.title = '链接 · 机械工程学部全媒体工作台'
    return () => {
      document.title = '机械工程学部全媒体工作台'
    }
  }, [])

  return (
    <main className="min-h-screen pb-16 pt-10 md:pb-24">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <Reveal>
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              navigate('/')
            }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-opacity hover:opacity-80"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            返回首页
          </a>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">链接</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-secondary">
            官方渠道与日常创作工具，点击卡片在新窗口打开。
          </p>
        </Reveal>

        <div className="mt-8 space-y-12">
          {linkGroups.map((group, gi) => (
            <div key={group.id}>
              <Reveal>
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                    {group.title}
                  </h2>
                  <span className="text-[13px] text-tertiary">{group.description}</span>
                </div>
              </Reveal>

              <div
                className={`grid gap-4 ${
                  group.links.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
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
    </main>
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
      <h3 className="mt-4 text-[17px] font-semibold text-ink">{link.name}</h3>
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
