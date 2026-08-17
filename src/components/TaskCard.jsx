import { useEffect, useState } from 'react'
import { Calendar, GripVertical, Pencil, Trash2, User } from 'lucide-react'
import { formatDeadline, isOverdue } from '../utils/date'

/**
 * 任务卡片
 * - 可拖拽（HTML5 Drag & Drop）；键盘用户可通过"编辑"修改状态
 * - 删除为两步确认（点击后 3 秒内再次点击确认），避免误删
 */
export default function TaskCard({ task, column, dragging, onDragStart, onDragEnd, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const overdue = task.status !== 'done' && isOverdue(task.deadline)

  // 确认状态 3 秒后自动复位
  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Firefox 需要设置 data 才能启动拖拽
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      title="拖动卡片可移动到其他列"
      className={`group card-lift cursor-grab rounded-2xl border border-line bg-surface p-4 shadow-sm active:cursor-grabbing ${
        dragging ? 'opacity-50' : ''
      }`}
    >
      {/* 标题 + 操作按钮 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1">
          <GripVertical
            size={14}
            className="mt-1 shrink-0 text-tertiary/50"
            aria-hidden="true"
          />
          <h4 className="text-[15px] font-medium leading-snug text-ink">{task.title}</h4>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-200 focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`编辑任务：${task.title}`}
            className="rounded-lg p-1.5 text-tertiary transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
            aria-label={
              confirming ? `确认删除任务：${task.title}` : `删除任务：${task.title}`
            }
            className={`rounded-lg p-1.5 transition-colors ${
              confirming
                ? 'bg-danger/10 text-danger-ink'
                : 'text-tertiary hover:bg-black/5 hover:text-danger-ink dark:hover:bg-white/10'
            }`}
          >
            {confirming ? (
              <span className="px-1 text-[11px] font-medium">确认?</span>
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* 负责人 / 截止日期 */}
      <div className="mt-3 space-y-1.5 text-[12.5px] text-secondary">
        {task.assignee && (
          <p className="flex items-center gap-1.5">
            <User size={13} className="text-tertiary" aria-hidden="true" />
            {task.assignee}
          </p>
        )}
        {task.deadline && (
          <p className={`flex items-center gap-1.5 ${overdue ? 'text-danger-ink' : ''}`}>
            <Calendar size={13} className="text-tertiary" aria-hidden="true" />
            {formatDeadline(task.deadline)}
            {overdue && <span className="text-[11px] font-medium">已逾期</span>}
          </p>
        )}
      </div>

      {/* 标签 */}
      {task.tag && (
        <span className="mt-3 inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-[11.5px] font-medium text-secondary dark:bg-white/10">
          {task.tag}
        </span>
      )}

      {/* 进度条 */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-tertiary">进度</span>
          <span className="font-medium" style={{ color: column.ink }}>
            {task.progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={task.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${task.title} 进度 ${task.progress}%`}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${task.progress}%`, backgroundColor: column.bar }}
          />
        </div>
      </div>
    </div>
  )
}
