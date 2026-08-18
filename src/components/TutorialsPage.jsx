import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, Camera, Clock, PenTool, Smartphone, Video } from 'lucide-react'
import { tutorialCategories } from '../data/tutorials'
import { navigate } from '../utils/router'
import Reveal from './Reveal'

/** 板块图标映射 */
const ICONS = { Camera, PenTool, Video, Smartphone }

/**
 * 内部教程中心（#/tutorials）
 * 四板块入口：摄影技术（已上线），其余"暂未开通，敬请期待"
 */
export default function TutorialsPage() {
  useEffect(() => {
    document.title = '内部教程 · 机械工程学部全媒体工作台'
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
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">内部教程</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-secondary">
            部门技能成长库：从摄影到运营，把经验沉淀成可传承的教程。
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tutorialCategories.map((cat, i) => {
            const Icon = ICONS[cat.icon] || Camera
            return (
              <Reveal key={cat.id} delay={i * 60}>
                {cat.available ? (
                  <a
                    href={cat.href}
                    className="card-lift group block h-full rounded-3xl border border-line bg-surface p-6 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
                  >
                    <CardBody cat={cat} Icon={Icon} available />
                  </a>
                ) : (
                  <div className="block h-full rounded-3xl border border-dashed border-line-strong bg-surface p-6 opacity-75">
                    <CardBody cat={cat} Icon={Icon} available={false} />
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[12px] font-medium text-tertiary dark:bg-white/10">
                      <Clock size={12} aria-hidden="true" />
                      暂未开通，敬请期待
                    </p>
                  </div>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function CardBody({ cat, Icon, available }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        {available && (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success-ink">
            已上线
          </span>
        )}
      </div>
      <h2 className="mt-4 text-[17px] font-semibold text-ink">{cat.title}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{cat.desc}</p>
      {available && (
        <p className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-accent">
          开始学习
          <ArrowRight size={14} aria-hidden="true" />
        </p>
      )}
    </>
  )
}
