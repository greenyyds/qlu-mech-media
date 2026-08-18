import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bug,
  Check,
  Lock,
  MessageCircle,
  Send,
  Users,
} from 'lucide-react'
import { feedbackConfig } from '../config/feedbackConfig'
import * as feedbackService from '../services/feedbackService'
import { formatRelativeTime, sha256 } from '../utils/date'
import { navigate } from '../utils/router'
import Reveal from './Reveal'

const PASS_KEY = 'qlu-mech-media:feedback-pass:v1'

/** 分类定义 */
const CATEGORIES = [
  {
    id: 'tech',
    label: '技术与设计问题',
    description: '网站功能异常、界面与体验问题、功能建议',
    Icon: Bug,
  },
  {
    id: 'daily',
    label: '工作与交际问题',
    description: '值班安排、任务协作、部门沟通中的问题',
    Icon: Users,
  },
]

/**
 * 意见反馈页（#/feedback 二级页面）
 * - 两大分类提交（匿名/实名）
 * - 公开列表（时间倒序 + 分类筛选）
 * - 预留密码保护：feedbackConfig.protected 为 true 时需密码进入
 */
export default function FeedbackPage() {
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    document.title = '意见反馈 · 机械工程学部全媒体工作台'
    return () => {
      document.title = '机械工程学部全媒体工作台'
    }
  }, [])

  // 密码保护（预留，当前 protected=false 不启用）
  useEffect(() => {
    if (!feedbackConfig.protected) {
      setPassed(true)
      return
    }
    try {
      setPassed(sessionStorage.getItem(PASS_KEY) === '1')
    } catch {
      setPassed(false)
    }
  }, [])

  if (!passed) return <PasswordGate onPass={() => setPassed(true)} />

  return (
    <main className="min-h-screen pb-16 pt-10 md:pb-24">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        {/* 头部 */}
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
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
            意见反馈
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-secondary">
            你的每一条反馈都会帮助全媒体部门变得更好。可选择匿名提交，也可留下姓名方便我们跟进。
          </p>
        </Reveal>

        {/* 提交区 */}
        <SubmitSection />

        {/* 公开列表 */}
        <FeedbackList />
      </div>
    </main>
  )
}

/* ============================================================
   密码门（预留：feedbackConfig.protected = true 时启用）
   ============================================================ */
function PasswordGate({ onPass }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setChecking(true)
    setError('')
    const hash = await sha256(value)
    if (hash === feedbackConfig.password) {
      try {
        sessionStorage.setItem(PASS_KEY, '1')
      } catch {
        /* 忽略 */
      }
      onPass()
    } else {
      setError('密码不正确')
    }
    setChecking(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Lock size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-ink">此页面需要密码访问</h1>
        <p className="mt-1.5 text-[13px] text-secondary">请输入访问密码</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="访问密码"
          autoFocus
          className="mt-4 w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
        />
        {error && <p role="alert" className="mt-2 text-[12.5px] text-danger-ink">{error}</p>}
        <button
          type="submit"
          disabled={checking || !value}
          className="mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          进入
        </button>
        <a href="#/" className="mt-4 block text-center text-[12.5px] text-tertiary hover:text-accent">
          返回首页
        </a>
      </form>
    </main>
  )
}

/* ============================================================
   提交区：分类选择 → 表单
   ============================================================ */
function SubmitSection() {
  const [category, setCategory] = useState(null) // null | 'tech' | 'daily'
  const [form, setForm] = useState({ content: '', anonymous: true, name: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const submit = async (e) => {
    e.preventDefault()
    if (!category) return
    setSubmitting(true)
    setError('')
    try {
      await feedbackService.createFeedback({
        category,
        name: form.anonymous ? '' : form.name,
        content: form.content,
      })
      setForm({ content: '', anonymous: true, name: '' })
      setDone(true)
      setRefreshKey((k) => k + 1) // 通知列表刷新
      setTimeout(() => setDone(false), 2500)
    } catch (err) {
      setError(err?.message || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 分类选择卡片
  if (!category) {
    return (
      <Reveal delay={80}>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className="card-lift group rounded-3xl border border-line bg-surface p-6 text-left hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <c.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-ink">{c.label}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{c.description}</p>
            </button>
          ))}
        </div>
      </Reveal>
    )
  }

  const active = CATEGORIES.find((c) => c.id === category)

  return (
    <Reveal delay={80}>
      <form
        onSubmit={submit}
        className="mt-8 rounded-3xl border border-line bg-surface p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
            <active.Icon size={18} className="text-accent" aria-hidden="true" />
            {active.label}
          </h2>
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="text-[12.5px] font-medium text-tertiary transition-colors hover:text-accent"
          >
            切换分类
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            反馈内容 <span className="text-danger">*</span>
          </span>
          <textarea
            rows={4}
            maxLength={500}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="请描述你遇到的问题或建议，越具体越有帮助…"
            className="w-full resize-y rounded-2xl border border-line bg-page px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
          />
          <span className="mt-1 block text-right text-[11.5px] text-tertiary">
            {form.content.length}/500
          </span>
        </label>

        {/* 匿名 / 实名 */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-ink">匿名提交</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.anonymous}
              aria-label="匿名提交开关"
              onClick={() => setForm((f) => ({ ...f, anonymous: !f.anonymous }))}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                form.anonymous ? 'bg-accent' : 'bg-black/15 dark:bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                  form.anonymous ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {!form.anonymous && (
            <div className="flex items-center gap-2">
              <label htmlFor="fb-name" className="text-[13px] font-medium text-ink">
                姓名
              </label>
              <input
                id="fb-name"
                type="text"
                maxLength={20}
                required={!form.anonymous}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="你的姓名"
                className="w-40 rounded-full border border-line bg-page px-4 py-1.5 text-[13px] text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
              />
            </div>
          )}
        </div>

        {error && <p role="alert" className="mt-3 text-[13px] font-medium text-danger-ink">{error}</p>}

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <button
            type="submit"
            disabled={submitting || !form.content.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {done ? <Check size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
            {done ? '已提交，感谢反馈' : submitting ? '提交中…' : '提交反馈'}
          </button>
          {form.anonymous && (
            <span className="text-[12px] text-tertiary">将以「匿名」展示</span>
          )}
        </div>
      </form>
      <FeedbackList refreshKey={refreshKey} />
    </Reveal>
  )
}

/* ============================================================
   公开列表
   ============================================================ */
function FeedbackList({ refreshKey }) {
  const [items, setItems] = useState(null) // null = 加载中
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setItems(await feedbackService.listFeedbacks())
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const shown = items
    ? items.filter((f) => filter === 'all' || f.category === filter)
    : []

  return (
    <Reveal delay={120}>
      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
            <MessageCircle size={17} className="text-accent" aria-hidden="true" />
            全部反馈
            {items && <span className="text-[12px] font-normal text-tertiary">（{items.length} 条）</span>}
          </h2>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="反馈分类筛选">
            {[
              { id: 'all', label: '全部' },
              { id: 'tech', label: '技术/设计' },
              { id: 'daily', label: '工作/交际' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-accent text-white'
                    : 'border border-line bg-surface text-secondary hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {items === null && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-black/5 dark:bg-white/10" />
              ))}
            </div>
          )}
          {items !== null && shown.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line-strong p-8 text-center">
              <p className="text-[13.5px] text-tertiary">
                还没有{filter === 'all' ? '' : '该分类的'}反馈，来做第一个发声的人吧
              </p>
            </div>
          )}
          {shown.map((f) => {
            const cat = CATEGORIES.find((c) => c.id === f.category)
            return (
              <article key={f.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-secondary dark:bg-white/10">
                    <cat.Icon size={11} aria-hidden="true" />
                    {cat.label}
                  </span>
                  <span className="text-[12.5px] font-medium text-ink">
                    {f.name || '匿名'}
                  </span>
                  <span className="text-[11.5px] text-tertiary">
                    {formatRelativeTime(f.createdAt)}
                  </span>
                </div>
                <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                  {f.content}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </Reveal>
  )
}
