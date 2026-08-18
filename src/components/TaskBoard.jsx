import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import * as taskService from '../services/taskService'
import { TASK_COLUMNS } from '../data/taskConfig'
import { getWeekRange } from '../utils/date'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import TaskColumn from './TaskColumn'
import TaskModal from './TaskModal'
import DataStatusBadge from './DataStatusBadge'
import { useDataStatus } from '../hooks/useDataStatus'

/**
 * 任务规划模块：本周重点任务
 * - 看板三列：待办 / 进行中 / 已完成
 * - 支持添加、编辑、删除、跨列拖拽
 * - 数据统一走 services/taskService.js（云端共享 / 本地两种模式）
 * - 云端恢复后（cloud-recovered 事件）自动刷新数据并切回共享模式
 */
export default function TaskBoard() {
  const [tasks, setTasks] = useState(null) // null = 加载中
  const [draggingId, setDraggingId] = useState(null)
  const [overStatus, setOverStatus] = useState(null)
  const [modal, setModal] = useState(null) // null | { mode:'create' } | { mode:'edit', task }
  const dataStatus = useDataStatus()

  const weekRange = getWeekRange()

  useEffect(() => {
    let alive = true
    taskService.listTasks().then((list) => {
      if (alive) setTasks(list)
    })
    return () => {
      alive = false
    }
  }, [])

  const refresh = async () => {
    setTasks(await taskService.listTasks())
  }

  // 云端自动恢复后刷新数据
  useEffect(() => {
    const onRecovered = () => refresh()
    window.addEventListener('cloud-recovered', onRecovered)
    return () => window.removeEventListener('cloud-recovered', onRecovered)
  }, [])

  const handleCreate = async (data) => {
    await taskService.createTask(data)
    await refresh()
  }

  const handleUpdate = async (id, data) => {
    await taskService.updateTask(id, data)
    await refresh()
  }

  const handleDelete = async (id) => {
    await taskService.deleteTask(id)
    await refresh()
  }

  const handleDrop = async (status) => {
    const id = draggingId
    setDraggingId(null)
    setOverStatus(null)
    if (!id) return
    await taskService.moveTask(id, status)
    await refresh()
  }

  return (
    <section id="tasks" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        {/* 模块头 */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              align="left"
              eyebrow="Task Board"
              title="本周重点任务"
              description="拖动卡片调整状态，数据在所有成员之间共享。"
            />
            <div className="flex items-center gap-3">
              <DataStatusBadge status={dataStatus} />
              <span className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-secondary">
                {weekRange.label}
              </span>
              <button
                type="button"
                onClick={() => setModal({ mode: 'create' })}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-accent-hover"
              >
                <Plus size={16} aria-hidden="true" />
                添加任务
              </button>
            </div>
          </div>
        </Reveal>

        {/* 三列看板 */}
        <Reveal delay={80}>
          <div className="scroll-thin mt-8 flex snap-x gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {TASK_COLUMNS.map((col) => (
              <TaskColumn
                key={col.status}
                column={col}
                tasks={tasks ? tasks.filter((t) => t.status === col.status) : null}
                loading={tasks === null}
                draggingId={draggingId}
                overStatus={overStatus}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setOverStatus(col.status)
                }}
                onDragLeave={() =>
                  setOverStatus((s) => (s === col.status ? null : s))
                }
                onDrop={() => handleDrop(col.status)}
                onCardDragStart={(id) => setDraggingId(id)}
                onCardDragEnd={() => setDraggingId(null)}
                onEdit={(task) => setModal({ mode: 'edit', task })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </Reveal>
      </div>

      {/* 添加 / 编辑弹窗 */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            if (modal.mode === 'edit') await handleUpdate(modal.task.id, data)
            else await handleCreate(data)
            setModal(null)
          }}
        />
      )}
    </section>
  )
}
