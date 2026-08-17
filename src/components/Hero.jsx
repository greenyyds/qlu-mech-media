import { ArrowRight, Sparkles } from 'lucide-react'
import Reveal from './Reveal'

/**
 * Hero 区
 * 大标题 + 副标题 + 主行动按钮；背景为极简抽象光斑（无素材时的优雅占位）
 */
export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pb-16 pt-20 md:pb-24 md:pt-28">
      {/* 背景装饰：柔和低饱和光斑，aria-hidden 忽略 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,0.10),transparent)]" />
        <div className="absolute -left-24 top-44 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(52,199,89,0.06),transparent)]" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,0.07),transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-secondary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            全媒体部门 · 内部工作台
          </span>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-ink md:text-6xl md:leading-[1.08]">
            机械工程学部全媒体工作台
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-secondary md:text-lg">
            聚合常用入口、本周任务规划与新闻初稿工具——打开即用，让每一次创作更专注。
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#tasks"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-accent-hover"
            >
              进入任务规划
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a
              href="#news"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Sparkles size={17} className="text-accent" aria-hidden="true" />
              打开新闻工具
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
