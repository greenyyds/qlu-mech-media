/**
 * 数据备份服务 —— 一键导出全部数据为 JSON 文件
 *
 * 用途：公开读写模式下防误删/防外部篡改的兜底手段；
 *       也可作为迁移数据（换 CloudBase 环境、换电脑）的载体。
 */
import * as taskService from './taskService'
import * as dutyService from './dutyService'
import * as feedbackService from './feedbackService'

export async function exportBackup() {
  const [tasks, roster, feedbacks] = await Promise.all([
    taskService.listTasks(),
    dutyService.listWeek(),
    feedbackService.listFeedbacks(),
  ])

  const data = {
    app: 'qlu-mech-media-workbench',
    version: 3,
    exportedAt: new Date().toISOString(),
    tasks,
    roster,
    feedbacks,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  a.href = url
  a.download = `qlu-mech-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
