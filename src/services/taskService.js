/**
 * 任务数据服务 —— 数据层与 UI 完全分离
 *
 * ▍当前实现：localStorage 本地持久化 + 内存缓存
 * ▍替换方式：后续接入后端时，仅需将各方法内部实现改为网络请求，
 *            保持「方法名 + Promise 签名」不变，UI 组件零改动。
 *
 * 可选替换方案示例：
 *  - REST API：listTasks -> GET /api/tasks；createTask -> POST /api/tasks ...
 *  - 云数据库：如 Supabase / Firebase，直接调用其 SDK
 *  - JSON 文件：改为 import 静态 JSON（只读）或配合构建脚本写入
 *
 * 组件请勿直接操作 localStorage，一律通过本服务访问。
 */
import { addDays, getWeekRange, toISODate } from '../utils/date'

const STORAGE_KEY = 'qlu-mech-media:tasks:v1'
const STATUSES = ['todo', 'in_progress', 'done']

/** 内存缓存：首次加载后驻留，减少 localStorage 读写；刷新页面后重建 */
let cache = null

/* ---------------- 内部工具函数（私有） ---------------- */

function clampProgress(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

function normalizeStatus(s) {
  return STATUSES.includes(s) ? s : 'todo'
}

/** 首次使用时的示例任务：日期相对本周动态计算，保证演示效果常新 */
function buildSeedTasks() {
  const { start } = getWeekRange()
  const now = Date.now()
  const day = (offset) => toISODate(addDays(start, offset))

  return [
    {
      id: 'seed-1',
      title: '公众号栏目改版方案',
      assignee: '张明',
      deadline: day(-1),
      tag: '运营',
      progress: 100,
      status: 'done',
      createdAt: now - 6 * 86400000,
    },
    {
      id: 'seed-2',
      title: '秋季纳新海报定稿',
      assignee: '陈思雨',
      deadline: day(-2),
      tag: '设计',
      progress: 100,
      status: 'done',
      createdAt: now - 5 * 86400000,
    },
    {
      id: 'seed-3',
      title: '秋季纳新宣传推文',
      assignee: '王小雨',
      deadline: day(4),
      tag: '推文',
      progress: 60,
      status: 'in_progress',
      createdAt: now - 2 * 86400000,
    },
    {
      id: 'seed-4',
      title: '校运动会开幕式拍摄安排',
      assignee: '李志强',
      deadline: day(5),
      tag: '拍摄',
      progress: 35,
      status: 'in_progress',
      createdAt: now - 1 * 86400000,
    },
    {
      id: 'seed-5',
      title: '学代会新闻稿初稿',
      assignee: '刘畅',
      deadline: day(7),
      tag: '文案',
      progress: 0,
      status: 'todo',
      createdAt: now,
    },
    {
      id: 'seed-6',
      title: '本周例会会议纪要整理',
      assignee: '张明',
      deadline: day(4),
      tag: '文案',
      progress: 0,
      status: 'todo',
      createdAt: now,
    },
  ]
}

function read() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw)
      if (Array.isArray(cache)) return cache
    }
  } catch (err) {
    console.warn('[taskService] 读取本地任务数据失败，将使用示例数据', err)
  }
  cache = buildSeedTasks()
  persist()
  return cache
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.warn('[taskService] 写入本地任务数据失败', err)
  }
}

function clone(list) {
  return list.map((t) => ({ ...t }))
}

/* ---------------- 对外接口（供 UI 调用） ---------------- */

/** 获取全部任务（返回副本，防止外部直接改动缓存） */
export async function listTasks() {
  return clone(read())
}

/** 新建任务；标题必填 */
export async function createTask(input = {}) {
  const title = String(input.title ?? '').trim()
  if (!title) throw new Error('任务标题不能为空')

  const task = {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    assignee: String(input.assignee ?? '').trim(),
    deadline: input.deadline || '',
    tag: String(input.tag ?? '').trim(),
    progress: clampProgress(input.progress),
    status: normalizeStatus(input.status),
    createdAt: Date.now(),
  }
  read().push(task)
  persist()
  return { ...task }
}

/** 更新任务（局部更新：传哪些字段改哪些字段） */
export async function updateTask(id, patch = {}) {
  const tasks = read()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error(`任务不存在：${id}`)

  const prev = tasks[idx]
  const next = { ...prev, ...patch, id: prev.id }
  const title = String(next.title ?? '').trim()
  if (!title) throw new Error('任务标题不能为空')

  next.title = title
  next.assignee = String(next.assignee ?? '').trim()
  next.tag = String(next.tag ?? '').trim()
  next.progress = clampProgress(patch.progress ?? prev.progress)
  next.status = normalizeStatus(patch.status ?? prev.status)

  tasks[idx] = next
  persist()
  return { ...next }
}

/** 删除任务 */
export async function deleteTask(id) {
  cache = read().filter((t) => t.id !== id)
  persist()
}

/** 将任务移动到某列（跨列拖拽时调用）；移到"已完成"自动将进度置为 100 */
export async function moveTask(id, status) {
  const s = normalizeStatus(status)
  const task = read().find((t) => t.id === id)
  if (!task) return
  return updateTask(id, s === 'done' ? { status: s, progress: 100 } : { status: s })
}

/** 重置为示例数据（调试用） */
export async function resetTasks() {
  cache = buildSeedTasks()
  persist()
}
