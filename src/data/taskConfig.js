/**
 * 任务看板配置
 * 三列状态定义：圆点 / 进度条 / 百分比文字使用状态色；
 * 文字色使用加深版本（ink），保证 WCAG AA 对比度。
 */
export const TASK_COLUMNS = [
  { status: 'todo', label: '待办', dot: 'bg-tertiary', bar: '#86868b', ink: '#6e6e73' },
  { status: 'in_progress', label: '进行中', dot: 'bg-accent', bar: '#0071e3', ink: '#0a5cc2' },
  { status: 'done', label: '已完成', dot: 'bg-success', bar: '#34c759', ink: '#1e7e34' },
]

/** 标签输入建议（datalist） */
export const TASK_TAG_SUGGESTIONS = ['文案', '拍摄', '设计', '运营', '视频', '推文']
