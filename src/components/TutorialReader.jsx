import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Lightbulb } from 'lucide-react'
import { navigate } from '../utils/router'
import Reveal from './Reveal'

/**
 * 通用教程阅读器（分步引导式）
 *
 * 各板块教程页共用：章节进度条 + 翻页 + 键盘 + 章节跳转 + 图文/表格/提示渲染。
 * 传入 tutorial 数据（见 src/data/tutorials.js）即可生成完整教程页。
 */
export default function TutorialReader({ tutorial, backHref = '#/tutorials' }) {
  const chapters = tutorial.chapters
  const [index, setIndex] = useState(0)
  const total = chapters.length
  const chapter = chapters[index]

  useEffect(() => {
    document.title = `${tutorial.title} · 内部教程`
    return () => {
      document.title = '机械工程学部全媒体工作台'
    }
  }, [tutorial.title])

  // 键盘翻页
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, total - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  const prev = () => setIndex((i) => Math.max(i - 1, 0))
  const next = () => setIndex((i) => Math.min(i + 1, total - 1))

  return (
    <main className="min-h-screen pb-16 pt-10 md:pb-24">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        {/* 顶部导航 */}
        <Reveal>
          <a
            href={backHref}
            onClick={(e) => {
              e.preventDefault()
              navigate(backHref.slice(1))
            }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-opacity hover:opacity-80"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            返回教程中心
          </a>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
            {tutorial.title}
          </h1>
          <p className="mt-2 text-[14px] text-secondary">{tutorial.subtitle}</p>
        </Reveal>

        {/* 章节进度条 */}
        <Reveal delay={60}>
          <div className="mt-6 rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between text-[12.5px] text-tertiary">
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} aria-hidden="true" />
                第 {index + 1} / {total} 章
              </span>
              <span>{chapter.title}</span>
            </div>
            <div
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
              role="progressbar"
              aria-valuenow={((index + 1) / total) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="教程阅读进度"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
            {/* 章节圆点 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chapters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`跳转到第 ${i + 1} 章：${c.title}`}
                  aria-current={i === index}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                    i === index
                      ? 'bg-accent text-white'
                      : i < index
                        ? 'bg-success/10 text-success-ink'
                        : 'bg-black/5 text-tertiary dark:bg-white/10'
                  }`}
                >
                  {i < index && <Check size={11} className="mr-0.5 inline" aria-hidden="true" />}
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 章节内容 */}
        <Reveal delay={100} key={chapter.id}>
          <article className="mt-5 rounded-3xl border border-line bg-surface p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-[-0.01em] text-ink md:text-2xl">
              {chapter.title}
            </h2>
            {chapter.intro && (
              <p className="mt-2 text-[14px] leading-relaxed text-secondary">{chapter.intro}</p>
            )}

            {/* 小节 */}
            <div className="mt-5 space-y-6">
              {chapter.sections?.map((sec, si) => (
                <section key={si}>
                  {sec.title && (
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {sec.title}
                    </h3>
                  )}
                  <ul className="mt-3 space-y-2.5">
                    {sec.points.map((p, pi) => (
                      <li key={pi} className="flex gap-2.5 text-[14px] leading-relaxed text-secondary">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-tertiary" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {sec.image && (
                    <figure className="mt-4 overflow-hidden rounded-2xl border border-line">
                      <img
                        src={sec.image}
                        alt={`${sec.title || chapter.title}配图`}
                        loading="lazy"
                        className="h-auto w-full object-cover"
                      />
                    </figure>
                  )}
                </section>
              ))}

              {/* 参数/格式速查表 */}
              {chapter.table && (
                <div className="scroll-thin overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-[13px]">
                    <thead>
                      <tr>
                        {chapter.table.head.map((h, i) => (
                          <th
                            key={i}
                            className="border-b border-line bg-black/5 px-3 py-2.5 text-left font-semibold text-ink dark:bg-white/10"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chapter.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`border-b border-line px-3 py-2.5 text-secondary ${
                                ci === 0 ? 'font-medium text-ink' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 实战提示 */}
            {chapter.tips?.map((tip, ti) => (
              <div
                key={ti}
                className="mt-6 flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4"
              >
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <p className="text-[13.5px] leading-relaxed text-accent-ink">
                  <span className="font-semibold">实战提示：</span>
                  {tip}
                </p>
              </div>
            ))}
          </article>
        </Reveal>

        {/* 翻页按钮 */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-black/5 disabled:opacity-35 dark:hover:bg-white/10"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            上一章
          </button>
          <span className="text-[12px] text-tertiary">支持键盘 ← → 翻页</span>
          {index < total - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              下一章
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <a
              href={backHref}
              onClick={(e) => {
                e.preventDefault()
                navigate(backHref.slice(1))
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              完成学习
              <Check size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
