import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Copy,
  FileText,
  History,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import {
  getDefaultOptions,
  newsToolOptions,
} from '../data/newsToolConfig'
import * as newsService from '../services/newsService'
import { aiConfig, aiModels } from '../config/aiConfig'
import Reveal from './Reveal'
import Toggle from './Toggle'

/**
 * 新闻初稿生成工具 —— 已接入智谱 GLM 双模型（快速/深度，均免费）
 *
 * 扩展方式：
 *  - 新增选项：编辑 src/data/newsToolConfig.js（控件随配置自动渲染）
 *  - 更换/新增模型：编辑 src/config/aiConfig.js（aiModels）
 *  - 生成逻辑：src/services/newsService.js
 */
export default function NewsTool() {
  return (
    <NewsProvider>
      <NewsToolSection />
    </NewsProvider>
  )
}

const NewsCtx = createContext(null)
const useNews = () => useContext(NewsCtx)

function NewsToolSection() {
  const { modelMode } = useNews()
  const activeModel = aiModels[modelMode] || aiModels[aiConfig.defaultMode]
  return (
    <section id="news" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="rounded-[28px] bg-gradient-to-b from-night-soft to-night p-6 md:p-10">
            {/* 模块头 */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
                  <Sparkles size={14} aria-hidden="true" />
                  AI 能力 · 已接入
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">
                  新闻初稿生成工具
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
                  填写事件要点，AI 自动生成新闻初稿。生成内容请人工核对事实后再发布。
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                已接入 {activeModel.model} · 免费
              </span>
            </div>

            {/* 左右两栏：选项编辑 / 预览输出 */}
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <OptionPanel />
              <PreviewPanel />
            </div>

            <HistoryStrip />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   左右两栏共享的状态（NewsProvider 提升管理）
   ============================================================ */

function NewsProvider({ children }) {
  // 表单状态（选项值）
  const [form, setForm] = useState(getDefaultOptions)
  // 模型模式：'quick' | 'deep'（默认取 aiConfig.defaultMode）
  const [modelMode, setModelMode] = useState(aiConfig.defaultMode)
  // 生成状态机：idle | generating | done | error
  const [status, setStatus] = useState('idle')
  const [raw, setRaw] = useState('') // 流式累计原文
  const [draft, setDraft] = useState(null) // 结构化草稿
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const abortRef = useRef(null)

  const refreshHistory = () => setHistory(newsService.listHistory())
  useEffect(refreshHistory, [])

  const setField = (id, value) => setForm((f) => ({ ...f, [id]: value }))

  const canGenerate = form.theme.trim() !== '' && status !== 'generating'

  /** 开始生成（流式） */
  const generate = async () => {
    if (!form.theme.trim() || status === 'generating') return
    const options = { ...form }
    const mode = modelMode
    setStatus('generating')
    setRaw('')
    setDraft(null)
    setError('')

    const ac = new AbortController()
    abortRef.current = ac
    let text = ''
    try {
      for await (const chunk of newsService.streamDraft(options, ac.signal, mode)) {
        text += chunk
        setRaw(text)
      }
      const parsed = newsService.parseDraft(text)
      setDraft(parsed)
      setStatus('done')
      if (parsed) {
        newsService.saveHistory({ options, raw: text, draft: parsed, mode })
        refreshHistory()
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        // 用户主动停止：保留已生成部分
        setDraft(newsService.parseDraft(text))
        setStatus('done')
      } else {
        setError(err?.message || '生成失败，请重试')
        setStatus('error')
      }
    }
  }

  const stop = () => abortRef.current?.abort()

  const reset = () => {
    setStatus('idle')
    setRaw('')
    setDraft(null)
    setError('')
  }

  /** 查看历史记录 */
  const viewHistory = (entry) => {
    setDraft(entry.draft || newsService.parseDraft(entry.raw))
    setRaw(entry.raw)
    setStatus('done')
    setError('')
    if (entry.mode && aiModels[entry.mode]) setModelMode(entry.mode)
  }

  const clearHistory = () => {
    newsService.clearHistory()
    refreshHistory()
  }

  const value = {
    form,
    setField,
    modelMode,
    setModelMode,
    status,
    raw,
    draft,
    error,
    history,
    canGenerate,
    generate,
    stop,
    reset,
    viewHistory,
    clearHistory,
  }
  return <NewsCtx.Provider value={value}>{children}</NewsCtx.Provider>
}

/* ============================================================
   左栏：选项编辑区
   ============================================================ */
function OptionPanel() {
  const { form, setField, status, canGenerate, generate, stop, modelMode, setModelMode } =
    useNews()
  const busy = status === 'generating'

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">选项编辑</h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">
          {newsToolOptions.length} 项配置
        </span>
      </div>

      {/* 模型模式选择（v4：快速/深度双模式） */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-white/80">模型模式</span>
          <span className="text-[11.5px] text-white/40">
            {aiModels[modelMode]?.model}
          </span>
        </div>
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="模型模式选择">
          {Object.values(aiModels).map((m) => {
            const active = modelMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => setModelMode(m.id)}
                className={`pressable flex-1 rounded-xl px-3 py-2 text-left transition-colors duration-300 disabled:cursor-not-allowed ${
                  active
                    ? 'bg-accent text-white'
                    : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className="block text-[13px] font-semibold">{m.label}</span>
                <span className={`mt-0.5 block text-[11px] ${active ? 'text-white/80' : 'text-white/40'}`}>
                  {m.note}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {newsToolOptions.map((opt) => (
          <OptionField
            key={opt.id}
            opt={opt}
            value={form[opt.id]}
            disabled={busy}
            onChange={(v) => setField(opt.id, v)}
          />
        ))}
      </div>

      {/* 生成 / 停止 */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          aria-disabled={!canGenerate}
          className={`pressable inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-white transition-colors duration-300 ${
            canGenerate
              ? 'bg-accent hover:bg-accent-hover'
              : 'cursor-not-allowed bg-accent opacity-40'
          }`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
          {busy ? '生成中…' : '生成初稿'}
        </button>
        {busy && (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            <Square size={12} aria-hidden="true" />
            停止
          </button>
        )}
        {!canGenerate && !busy && (
          <span className="text-[12.5px] text-white/40">请先填写「事件要点与背景」</span>
        )}
      </div>
    </div>
  )
}

/** 单个选项控件（随配置类型自动渲染） */
function OptionField({ opt, value, disabled, onChange }) {
  const label = (
    <span className="mb-1.5 block text-[13px] font-medium text-white/80">
      {opt.label}
      {opt.required && <span className="ml-0.5 text-danger">*</span>}
    </span>
  )
  const hint = opt.hint && (
    <span className="mt-1.5 block text-[11.5px] leading-relaxed text-white/35">{opt.hint}</span>
  )

  if (opt.type === 'select') {
    return (
      <label className="block">
        {label}
        <div className="relative">
          <select
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {opt.options.map((o) => (
              <option key={o} value={o} className="bg-night-soft text-white">
                {o}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" aria-hidden="true" />
        </div>
        {hint}
      </label>
    )
  }

  if (opt.type === 'textarea') {
    return (
      <label className="block">
        {label}
        <textarea
          rows={4}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opt.placeholder}
          className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] leading-relaxed text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
        {hint}
      </label>
    )
  }

  if (opt.type === 'text') {
    return (
      <label className="block">
        {label}
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opt.placeholder}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
        {hint}
      </label>
    )
  }

  if (opt.type === 'date') {
    return (
      <label className="block">
        {label}
        <input
          type="date"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white outline-none transition-colors [color-scheme:dark] focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
        {hint}
      </label>
    )
  }

  if (opt.type === 'chips') {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={opt.label}>
          {opt.options.map((o) => {
            const active = value === o
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange(o)}
                className={`pressable rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${
                  active
                    ? 'bg-accent text-white'
                    : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                } disabled:cursor-not-allowed`}
              >
                {o}
              </button>
            )
          })}
        </div>
        {hint}
      </div>
    )
  }

  if (opt.type === 'url-list') {
    const urls = Array.isArray(value) ? value : []
    return (
      <div>
        {label}
        <div className="space-y-2">
          {urls.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                disabled={disabled}
                value={u}
                onChange={(e) => {
                  const next = [...urls]
                  next[i] = e.target.value
                  onChange(next)
                }}
                placeholder={opt.placeholder}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent disabled:opacity-60"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                aria-label={`删除第 ${i + 1} 条参考链接`}
                className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {urls.length < opt.max && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([...urls, ''])}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-white/20 px-3.5 py-1.5 text-[12.5px] text-white/50 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            <Plus size={13} aria-hidden="true" />
            添加链接（{urls.length}/{opt.max}）
          </button>
        )}
        {hint}
      </div>
    )
  }

  if (opt.type === 'switch') {
    const on = Boolean(value)
    return (
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/80">{opt.label}</span>
        <div className={disabled ? 'opacity-60' : ''}>
          <Toggle checked={on} onChange={onChange} label={`${opt.label}开关`} />
        </div>
      </div>
    )
  }

  return null
}

/* ============================================================
   右栏：预览 / 输出区
   ============================================================ */
function PreviewPanel() {
  const { status, raw, draft, error, generate, reset, modelMode } = useNews()

  const copy = async () => {
    const text = draft ? newsService.draftToText(draft) : raw
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 降级：textarea + execCommand
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">预览 · 输出</h3>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 flex-1 rounded-2xl bg-white p-5 dark:bg-[#1c1c1e]">
        {/* 生成中：原文打字机展示 */}
        {status === 'generating' && (
          <div aria-live="polite" className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
            {raw || '正在思考…'}
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" aria-hidden="true" />
          </div>
        )}

        {/* 完成：结构化草稿 */}
        {status === 'done' && draft && <DraftView />}

        {/* 完成但解析失败：原文展示 */}
        {status === 'done' && !draft && (
          <div>
            <p className="text-[12px] font-medium text-tertiary">模型返回了非结构化内容，原样展示：</p>
            <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{raw}</p>
          </div>
        )}

        {/* 出错 */}
        {status === 'error' && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <p className="text-[13px] font-medium text-danger-ink">{error}</p>
            <button
              type="button"
              onClick={generate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <RefreshCw size={14} aria-hidden="true" />
              重试
            </button>
          </div>
        )}

        {/* 空闲：占位骨架 */}
        {status === 'idle' && (
          <div>
            <div className="h-5 w-3/4 rounded-md bg-ink/10" />
            <div className="mt-2 h-3 w-1/2 rounded-md bg-ink/5" />
            <div className="mt-6 space-y-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 rounded-md bg-ink/5" style={{ width: `${100 - i * 9}%` }} />
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-tertiary">
              <FileText size={13} aria-hidden="true" />
              生成后将在此展示：标题 / 摘要 / 导语 / 正文
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {(status === 'done' || status === 'error') && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="pressable inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Copy size={14} aria-hidden="true" />
            复制全文
          </button>
          <button
            type="button"
            onClick={generate}
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={14} aria-hidden="true" />
            重新生成
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white"
          >
            <RotateCcw size={14} aria-hidden="true" />
            清空
          </button>
        </div>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-white/35">
        当前模型：{aiModels[modelMode]?.model}（{aiModels[modelMode]?.label}模式）· 生成内容请人工核对姓名、数字等事实后再发布
      </p>
    </div>
  )
}

/** 生成状态徽标 */
function StatusBadge({ status }) {
  const map = {
    idle: { text: '待生成', cls: 'bg-white/10 text-white/50' },
    generating: { text: '生成中', cls: 'bg-accent/20 text-accent' },
    done: { text: '已完成', cls: 'bg-success/20 text-success' },
    error: { text: '失败', cls: 'bg-danger/20 text-danger' },
  }
  const s = map[status]
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${s.cls}`}>{s.text}</span>
}

/** 结构化草稿展示 */
function DraftView() {
  const { draft } = useNews()
  if (!draft) return null
  return (
    <article className="text-ink">
      {/* 标题 */}
      <h4 className="text-[17px] font-bold leading-snug tracking-[-0.01em]">
        {draft.title}
      </h4>
      {/* 摘要 */}
      {draft.abstract && (
        <p className="mt-3 rounded-xl border-l-[3px] border-accent bg-ink/5 px-3 py-2 text-[12.5px] leading-relaxed text-secondary">
          <span className="font-semibold text-accent-ink">摘要：</span>
          {draft.abstract}
        </p>
      )}
      {/* 导语 */}
      {draft.lead && (
        <p className="mt-3 text-[13.5px] font-medium leading-relaxed">{draft.lead}</p>
      )}
      {/* 正文 */}
      <div className="mt-3 space-y-3">
        {draft.paragraphs.map((p, i) => (
          <p key={i} className="text-[13.5px] leading-relaxed text-secondary">
            {p}
          </p>
        ))}
      </div>
    </article>
  )
}

/* ============================================================
   最近生成历史
   ============================================================ */
function HistoryStrip() {
  const { history, viewHistory, clearHistory } = useNews()
  if (!history.length) return null
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70">
          <History size={14} aria-hidden="true" />
          最近生成
        </h4>
        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-white/40 transition-colors hover:text-white"
        >
          <Trash2 size={12} aria-hidden="true" />
          清空记录
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {history.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => viewHistory(h)}
            className="max-w-full rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-left text-[12px] text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            <span className="block max-w-[260px] truncate">
              {h.draft?.title || h.raw?.slice(0, 40) || '（未命名草稿）'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
