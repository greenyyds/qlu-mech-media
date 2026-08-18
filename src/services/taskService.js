/**
 * 任务数据服务 —— 数据层与 UI 完全分离
 *
 * ▍双模式存储（接口签名不变，UI 零改动）：
 *   1. 云端模式（推荐）：cloudConfig.envId 已配置 → 读写腾讯云 CloudBase，
 *      所有人共享同一份任务数据
 *   2. 本地模式：envId 为空 → localStorage（仅本机，与 v2 行为一致）
 *
 * ▍降级策略（保证任何情况下都能用）：
 *   - 云端读取失败 → 回退本地数据，标记 offline（UI 显示"离线模式"徽标）
 *   - 云端写入失败 → 回退本地写入，标记 offline（数据不丢失，云端恢复后自动切回）
 */
import * as cloud from './cloudService'
import { cloudConfig } from '../config/cloudConfig'
import { addDays, getWeekRange, toISODate } from '../utils/date'

const STORAGE_KEY = 'qlu-mech-media:tasks:v1'
const STATUSES = ['todo', 'in_progress', 'done']

/** 内存缓存（本地模式）；云端模式为最近一次全量读取 */
let cache = null
/** 当前数据状态：cloud | local | offline（供 UI 展示） */
let dataStatus = cloud.isCloudEnabled() ? 'cloud' : 'local'

export function getDataStatus() {
  return dataStatus
}

/* ---------------- 内部工具函数 ---------------- */

function clampProgress(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

function normalizeStatus(s) {
  return STATUSES.includes(s) ? s : 'todo'
}

/** 首次使用时的示例任务：日期相对本周动态计算（仅本地模式首次种子） */
function buildSeedTasks() {
  const { start } = getWeekRange()
  const now = Date.now()
  const day = (offset) => toISODate(addDays(start, offset))

  return [
    {
      id: 'seed-1', title: '公众号栏目改版方案', assignee: '张明', deadline: day(-1),
      tag: '运营', progress: 100, status: 'done', createdAt: now - 6 * 86400000,
    },
    {
      id: 'seed-2', title: '秋季纳新海报定稿', assignee: '陈思雨', deadline: day(-2),
      tag: '设计', progress: 100, status: 'done', createdAt: now - 5 * 86400000,
    },
    {
      id: 'seed-3', title: '秋季纳新宣传推文', assignee: '王小雨', deadline: day(4),
      tag: '推文', progress: 60, status: 'in_progress', createdAt: now - 2 * 86400000,
    },
    {
      id: 'seed-4', title: '校运动会开幕式拍摄安排', assignee: '李志强', deadline: day(5),
      tag: '拍摄', progress: 35, status: 'in_progress', createdAt: now - 1 * 86400000,
    },
    {
      id: 'seed-5', title: '学代会新闻稿初稿', assignee: '刘畅', deadline: day(7),
      tag: '文案', progress: 0, status: 'todo', createdAt: now,
    },
    {
      id: 'seed-6', title: '本周例会会议纪要整理', assignee: '张明', deadline: day(4),
      tag: '文案', progress: 0, status: 'todo', createdAt: now,
    },
  ]
}

/* ---------------- 本地存储实现 ---------------- */

function readLocal() {
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
  persistLocal()
  return cache
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.warn('[taskService] 写入本地任务数据失败', err)
  }
}

function clone(list) {
  return list.map((t) => ({ ...t }))
}

/* ---------------- 云端实现 ---------------- */

const CLOUD_TASKS = () => cloudConfig.collections.tasks

/** CloudBase 文档 → 业务任务对象 */
function docToTask(doc) {
  return {
    id: doc._id,
    title: doc.title || '',
    assignee: doc.assignee || '',
    deadline: doc.deadline || '',
    tag: doc.tag || '',
    progress: clampProgress(doc.progress),
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt || Date.now(),
  }
}

async function readCloud() {
  const docs = await cloud.queryAll(CLOUD_TASKS(), 'createdAt', 'desc')
  cache = docs.map(docToTask)
  return clone(cache)
}

/**
 * 云端写入包装：云端可用时写云端；失败时降级本地并标记 offline
 * @param {() => Promise<any>} cloudFn 云端写入实现
 * @param {() => any} localFn 本地写入实现（降级路径）
 */
async function writeCloudOrLocal(cloudFn, localFn) {
  if (!cloud.isCloudEnabled()) {
    dataStatus = 'local'
    return localFn()
  }
  try {
    const result = await cloudFn()
    dataStatus = 'cloud'
    return result
  } catch (err) {
    console.warn('[taskService] 云端写入失败，已降级本地存储', err)
    dataStatus = 'offline'
    return localFn()
  }
}

/* ---------------- 对外接口（签名不变） ---------------- */

/** 获取全部任务（云端优先，失败降级本地并标记 offline） */
export async function listTasks() {
  if (!cloud.isCloudEnabled()) {
    dataStatus = 'local'
    return clone(readLocal())
  }
  try {
    const tasks = await readCloud()
    dataStatus = 'cloud'
    return tasks
  } catch (err) {
    console.warn('[taskService] 云端读取失败，降级本地数据', err)
    dataStatus = 'offline'
    return clone(readLocal())
  }
}

/** 新建任务；标题必填 */
export async function createTask(input = {}) {
  const title = String(input.title ?? '').trim()
  if (!title) throw new Error('任务标题不能为空')

  const localCreate = () => {
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
    readLocal().push(task)
    persistLocal()
    return { ...task }
  }

  return writeCloudOrLocal(
    async () => {
      const id = await cloud.addDoc(CLOUD_TASKS(), {
        title,
        assignee: String(input.assignee ?? '').trim(),
        deadline: input.deadline || '',
        tag: String(input.tag ?? '').trim(),
        progress: clampProgress(input.progress),
        status: normalizeStatus(input.status),
        createdAt: Date.now(),
      })
      return { id, title, ...input }
    },
    localCreate,
  )
}

/** 更新任务（局部更新） */
export async function updateTask(id, patch = {}) {
  const title = String(patch.title ?? '').trim()
  if (patch.title !== undefined && !title) throw new Error('任务标题不能为空')

  const localUpdate = () => {
    const tasks = readLocal()
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx === -1) return undefined // 本地无此任务（云端数据），忽略
    const prev = tasks[idx]
    const next = { ...prev, ...patch, id: prev.id }
    if (patch.title !== undefined) next.title = title
    next.assignee = String(next.assignee ?? '').trim()
    next.tag = String(next.tag ?? '').trim()
    next.progress = clampProgress(patch.progress ?? prev.progress)
    next.status = normalizeStatus(patch.status ?? prev.status)
    tasks[idx] = next
    persistLocal()
    return { ...next }
  }

  return writeCloudOrLocal(
    async () => {
      await cloud.updateDoc(CLOUD_TASKS(), id, {
        ...(patch.title !== undefined ? { title } : {}),
        ...(patch.assignee !== undefined ? { assignee: String(patch.assignee ?? '').trim() } : {}),
        ...(patch.deadline !== undefined ? { deadline: patch.deadline || '' } : {}),
        ...(patch.tag !== undefined ? { tag: String(patch.tag ?? '').trim() } : {}),
        ...(patch.progress !== undefined ? { progress: clampProgress(patch.progress) } : {}),
        ...(patch.status !== undefined ? { status: normalizeStatus(patch.status) } : {}),
      })
    },
    localUpdate,
  )
}

/** 删除任务 */
export async function deleteTask(id) {
  const localDelete = () => {
    cache = readLocal().filter((t) => t.id !== id)
    persistLocal()
  }
  return writeCloudOrLocal(
    async () => cloud.removeDoc(CLOUD_TASKS(), id),
    localDelete,
  )
}

/** 移动任务到某列；移到"已完成"自动进度 100 */
export async function moveTask(id, status) {
  const s = normalizeStatus(status)
  const patch = s === 'done' ? { status: s, progress: 100 } : { status: s }
  return updateTask(id, patch)
}

/** 重置为示例数据（仅本地模式；云端模式请直接在页面上清理） */
export async function resetTasks() {
  if (!cloud.isCloudEnabled()) {
    cache = buildSeedTasks()
    persistLocal()
  }
}
