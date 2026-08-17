import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { TASK_COLUMNS, TASK_TAG_SUGGESTIONS } from '../data/taskConfig'

/**
 * 任务表单弹窗（添加 / 编辑共用）
 * 键盘可访问：打开时聚焦首字段，ESC 关闭，关闭后焦点归还触发按钮
 */
export default function TaskModal({ mode, task, onClose, onSubmit }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(() =>
    task
      ? {
          title: task.title,
          assignee: task.assignee || '',
          deadline: task.deadline || '',
          tag: task.tag || '',
          progress: task.progress ?? 0,
          status: task.status || 'todo',
        }
      : { title: '', assignee: '', deadline: '', tag: '', progress: 0, status: 'todo' },
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // 打开时聚焦 + 锁定背景滚动 + ESC 关闭
  useEffect(() => {
    titleRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('请填写任务标题')
      titleRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        progress: Number(form.progress),
      })
    } catch (err) {
      setError(err?.message || '保存失败，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="task-modal-title" className="text-lg font-bold tracking-[-0.01em] text-ink">
            {isEdit ? '编辑任务' : '添加任务'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭弹窗"
            className="rounded-full p-1.5 text-tertiary transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 标题 */}
          <div>
            <label htmlFor="task-title" className="mb-1.5 block text-[13px] font-medium text-ink">
              任务标题 <span className="text-danger">*</span>
            </label>
            <input
              id="task-title"
              ref={titleRef}
              type="text"
              required
              maxLength={60}
              value={form.title}
              onChange={set('title')}
              placeholder="例如：秋季纳新宣传推文"
              className="w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 负责人 */}
            <div>
              <label htmlFor="task-assignee" className="mb-1.5 block text-[13px] font-medium text-ink">
                负责人
              </label>
              <input
                id="task-assignee"
                type="text"
                maxLength={20}
                value={form.assignee}
                onChange={set('assignee')}
                placeholder="姓名"
                className="w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
              />
            </div>
            {/* 截止日期 */}
            <div>
              <label htmlFor="task-deadline" className="mb-1.5 block text-[13px] font-medium text-ink">
                截止日期
              </label>
              <input
                id="task-deadline"
                type="date"
                value={form.deadline}
                onChange={set('deadline')}
                className="w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label htmlFor="task-tag" className="mb-1.5 block text-[13px] font-medium text-ink">
              标签
            </label>
            <input
              id="task-tag"
              type="text"
              list="task-tag-suggestions"
              maxLength={10}
              value={form.tag}
              onChange={set('tag')}
              placeholder="如：文案 / 拍摄 / 设计"
              className="w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-tertiary focus:border-accent"
            />
            <datalist id="task-tag-suggestions">
              {TASK_TAG_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* 进度 */}
          <div>
            <label htmlFor="task-progress" className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-ink">
              <span>进度</span>
              <span className="text-accent-ink">{form.progress}%</span>
            </label>
            <input
              id="task-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={set('progress')}
              className="w-full accent-[#0071e3]"
            />
          </div>

          {/* 状态 */}
          <div>
            <label htmlFor="task-status" className="mb-1.5 block text-[13px] font-medium text-ink">
              状态
            </label>
            <select
              id="task-status"
              value={form.status}
              onChange={set('status')}
              className="w-full appearance-none rounded-2xl border border-line bg-page px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
            >
              {TASK_COLUMNS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger-ink">
              {error}
            </p>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? '保存中…' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
