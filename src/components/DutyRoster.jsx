import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Check, Pencil, Plus, RotateCcw, Users, X } from 'lucide-react'
import * as dutyService from '../services/dutyService'
import { getWeekRange, toISODate } from '../utils/date'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'

/**
 * 本周值班表（可编辑）
 * 数据维护：页面上直接编辑（每天 ≤4 人），localStorage 持久化
 * 数据层：src/services/dutyService.js（可替换为后端接口）
 */
export default function DutyRoster() {
  const [days, setDays] = useState(null) // null = 加载中
  const [editing, setEditing] = useState(false)
  const todayISO = toISODate(new Date())

  const refresh = useCallback(async () => {
    setDays(await dutyService.listWeek())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addMember = async (iso, name) => {
    if (!name.trim()) return
    const day = days.find((d) => d.iso === iso)
    if (!day || day.members.length >= 4) return
    await dutyService.updateDay(iso, [...day.members, name.trim()])
    await refresh()
  }

  const removeMember = async (iso, name) => {
    const day = days.find((d) => d.iso === iso)
    if (!day) return
    await dutyService.updateDay(
      iso,
      day.members.filter((m) => m !== name),
    )
    await refresh()
  }

  const reset = async () => {
    await dutyService.resetToDefault()
    await refresh()
  }

  return (
    <section id="roster" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              align="left"
              eyebrow="Duty"
              title="本周值班表"
              description={editing ? '编辑模式：可增删每日值班成员，改动即时保存。' : '每日值班成员安排，点击「编辑」可修改。'}
            />
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-secondary">
                <CalendarDays size={14} aria-hidden="true" />
                {getWeekRange().label}
              </span>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="pressable inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Pencil size={14} aria-hidden="true" />
                  编辑
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={reset}
                    className="pressable inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-secondary transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    重置示例
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="pressable inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <Check size={14} aria-hidden="true" />
                    完成
                  </button>
                </>
              )}
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {days
            ? days.map((d, i) => (
                <Reveal key={d.iso} delay={i * 40} className="h-full">
                  <DayCard
                    day={d}
                    isToday={d.iso === todayISO}
                    editing={editing}
                    onAdd={addMember}
                    onRemove={removeMember}
                  />
                </Reveal>
              ))
            : // 加载骨架
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-3xl bg-black/5 dark:bg-white/10" />
              ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-5 flex items-center gap-1.5 text-[12px] text-tertiary">
            <Users size={13} aria-hidden="true" />
            数据保存在本机浏览器 · 每天最多 4 人 · 以部门群内正式排班为准
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/** 单日卡片（含编辑态） */
function DayCard({ day, isToday, editing, onAdd, onRemove }) {
  const [draft, setDraft] = useState('')

  const submit = (e) => {
    e.preventDefault()
    onAdd(day.iso, draft)
    setDraft('')
  }

  return (
    <div
      className={`flex h-full flex-col rounded-3xl border p-4 ${
        isToday ? 'border-accent/40 bg-accent/5' : 'border-line bg-surface'
      } ${editing ? 'border-dashed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[13px] font-semibold ${isToday ? 'text-accent' : 'text-ink'}`}>
          {day.weekday}
        </span>
        {isToday && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
            今天
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[11.5px] text-tertiary">{day.monthDay}</p>

      <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
        {day.members.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11.5px] font-medium text-ink dark:bg-white/10"
          >
            {m}
            {editing && (
              <button
                type="button"
                onClick={() => onRemove(day.iso, m)}
                aria-label={`移除 ${day.weekday} 值班成员 ${m}`}
                className="rounded-full p-0.5 text-tertiary transition-colors hover:text-danger-ink"
              >
                <X size={11} />
              </button>
            )}
          </span>
        ))}
        {editing && day.members.length < 4 && (
          <form onSubmit={submit} className="flex w-full items-center gap-1.5">
            <label className="sr-only" htmlFor={`roster-input-${day.iso}`}>
              添加 {day.weekday} 值班成员
            </label>
            <input
              id={`roster-input-${day.iso}`}
              type="text"
              value={draft}
              maxLength={10}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="添加成员"
              className="min-w-0 flex-1 rounded-full border border-dashed border-line-strong bg-transparent px-2.5 py-1 text-[11.5px] text-ink outline-none placeholder:text-tertiary focus:border-accent"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label={`确认添加 ${day.weekday} 值班成员`}
              className="rounded-full p-1 text-accent transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
