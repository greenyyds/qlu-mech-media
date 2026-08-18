/**
 * 数据存储状态徽标（云端共享 / 本机数据 / 离线模式）
 * 显示在任务看板与值班表头部，让使用者清楚数据当前存于何处
 */
export default function DataStatusBadge({ status }) {
  const map = {
    cloud: { text: '云端共享', dot: 'bg-success', cls: 'text-success-ink' },
    local: { text: '本机数据', dot: 'bg-tertiary', cls: 'text-secondary' },
    offline: { text: '离线模式', dot: 'bg-warning', cls: 'text-warning' },
  }
  const s = map[status] || map.local
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium ${s.cls}`}
      title={
        status === 'cloud'
          ? '数据已接入云端，所有成员共享'
          : status === 'offline'
            ? '云端暂时不可用，当前显示本机数据'
            : '数据仅保存在本机浏览器（未配置云端环境）'
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.text}
    </span>
  )
}
