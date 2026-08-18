import { ArrowRight, BookOpen } from 'lucide-react'
import Reveal from './Reveal'

/**
 * 首页"内部教程"入口卡片（Hero 后、常用链接前）
 */
export default function TutorialEntry() {
  return (
    <section className="px-5 pb-16 md:px-8 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <a
            href="#/tutorials"
            className="card-lift group flex items-center justify-between gap-4 rounded-[28px] border border-line bg-surface p-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] md:p-8"
          >
            <div className="flex min-w-0 items-center gap-4 md:gap-5">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <BookOpen size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink md:text-lg">
                  内部教程
                </h2>
                <p className="mt-1 truncate text-[13px] text-secondary md:text-[13.5px]">
                  摄影技术已上线 · 新闻与图像处理 / 摄像技术 / 新媒体运营筹备中
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors group-hover:bg-accent-hover">
              进入学习
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
