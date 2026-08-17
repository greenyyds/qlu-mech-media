import TaskCard from './TaskCard'

/**
 * 看板单列（待办 / 进行中 / 已完成）
 * 拖拽逻辑：列容器接收 drop；卡片拖起时由父级记录 draggingId
 */
export default function TaskColumn({
  column,
  tasks,
  loading,
  draggingId,
  overStatus,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onCardDragEnd,
  onEdit,
  onDelete,
}) {
  const isOver = overStatus === column.status

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={`${column.label}列`}
      className={`flex min-h-[300px] w-[280px] shrink-0 snap-start flex-col rounded-3xl border p-4 transition-colors duration-300 sm:w-[300px] md:w-auto ${
        isOver ? 'border-accent/50 bg-accent/5' : 'border-line bg-surface/60'
      }`}
    >
      {/* 列头 */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <span className={`h-2 w-2 rounded-full ${column.dot}`} aria-hidden="true" />
          {column.label}
        </h3>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[12px] font-medium text-secondary dark:bg-white/10">
          {tasks ? tasks.length : '–'}
        </span>
      </div>

      {/* 任务卡片 */}
      <div className="mt-3 flex flex-1 flex-col gap-3">
        {loading && <ColumnSkeleton />}

        {!loading &&
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              column={column}
              dragging={draggingId === task.id}
              onDragStart={() => onCardDragStart(task.id)}
              onDragEnd={onCardDragEnd}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
            />
          ))}

        {!loading && tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line-strong p-6">
            <p className="text-[13px] text-tertiary">暂无任务，可将卡片拖至此处</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 加载骨架 */
function ColumnSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-28 rounded-2xl bg-black/5 dark:bg-white/10" />
      ))}
    </div>
  )
}
