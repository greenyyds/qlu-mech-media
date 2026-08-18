/**
 * 值班表数据服务 —— 数据层与 UI 分离
 *
 * ▍双模式存储（接口签名不变）：
 *   1. 云端模式：CloudBase `roster` 集合，每周一份文档（weekStart 为键），
 *      所有人共享同一份排班
 *   2. 本地模式：localStorage（默认数据来自 src/data/roster.js）
 *
 * ▍云端读取失败降级本地并标记 offline。
 */
import * as cloud from './cloudService'
import { cloudConfig } from '../config/cloudConfig'
import { buildRosterWeek } from '../data/roster'
import { getWeekRange, toISODate } from '../utils/date'

const STORAGE_KEY = 'qlu-mech-media:roster:v1'
const MAX_MEMBERS_PER_DAY = 4

let cache = null
let dataStatus = cloud.isCloudEnabled() ? 'cloud' : 'local'

export function getDataStatus() {
  return dataStatus
}

/* ---------------- 本地实现 ---------------- */

function readLocal() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === 7 && parsed.every((d) => d?.iso)) {
        cache = parsed
        return cache
      }
    }
  } catch (err) {
    console.warn('[dutyService] 读取值班数据失败，将使用示例数据', err)
  }
  cache = buildRosterWeek()
  persistLocal()
  return cache
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.warn('[dutyService] 写入值班数据失败', err)
  }
}

function clone(list) {
  return list.map((d) => ({ ...d, members: [...d.members] }))
}

function cleanMembers(members) {
  return (Array.isArray(members) ? members : [])
    .map((m) => String(m ?? '').trim())
    .filter(Boolean)
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .slice(0, MAX_MEMBERS_PER_DAY)
}

/* ---------------- 云端实现 ---------------- */

function currentWeekStart() {
  return toISODate(getWeekRange().start)
}

async function getCloudDoc() {
  const weekStart = currentWeekStart()
  const doc = await cloud.queryOne(cloudConfig.collections.roster, { weekStart })
  if (doc) {
    return { id: doc._id, weekStart: doc.weekStart, days: doc.days || [] }
  }
  return null
}

async function ensureCloudDoc() {
  const existing = await getCloudDoc()
  if (existing) return existing
  // 首次编辑：以默认示例数据创建本周文档
  const days = buildRosterWeek()
  const id = await cloud.addDoc(cloudConfig.collections.roster, {
    weekStart: currentWeekStart(),
    days,
  })
  return { id, weekStart: currentWeekStart(), days }
}

/* ---------------- 对外接口 ---------------- */

/** 获取本周值班安排（云端无数据时返回默认示例，不落库） */
export async function listWeek() {
  if (!cloud.isCloudEnabled()) {
    dataStatus = 'local'
    return clone(readLocal())
  }
  try {
    const doc = await getCloudDoc()
    dataStatus = 'cloud'
    if (doc && doc.days && doc.days.length === 7) return clone(doc.days)
    return buildRosterWeek()
  } catch (err) {
    console.warn('[dutyService] 云端读取失败，降级本地数据', err)
    dataStatus = 'offline'
    return clone(readLocal())
  }
}

/** 更新某天值班成员（iso: YYYY-MM-DD） */
export async function updateDay(iso, members) {
  const cleaned = cleanMembers(members)

  const localUpdate = () => {
    const days = readLocal()
    const day = days.find((d) => d.iso === iso)
    if (!day) throw new Error(`日期不存在：${iso}`)
    day.members = cleaned
    persistLocal()
  }

  if (!cloud.isCloudEnabled()) {
    dataStatus = 'local'
    return localUpdate()
  }

  try {
    const doc = await ensureCloudDoc()
    const days = [...(doc.days && doc.days.length === 7 ? doc.days : buildRosterWeek())]
    const idx = days.findIndex((d) => d.iso === iso)
    if (idx === -1) throw new Error(`日期不存在：${iso}`)
    days[idx] = { ...days[idx], members: cleaned }
    await cloud.updateDoc(cloudConfig.collections.roster, doc.id, { days })
    dataStatus = 'cloud'
  } catch (err) {
    console.warn('[dutyService] 云端写入失败，已降级本地存储', err)
    dataStatus = 'offline'
    localUpdate()
  }
}

/** 重置为示例数据 */
export async function resetToDefault() {
  if (!cloud.isCloudEnabled()) {
    cache = buildRosterWeek()
    persistLocal()
    return
  }
  try {
    const doc = await getCloudDoc()
    if (doc) {
      await cloud.removeDoc(cloudConfig.collections.roster, doc.id)
    }
    dataStatus = 'cloud'
  } catch (err) {
    console.warn('[dutyService] 云端重置失败，降级本地重置', err)
    dataStatus = 'offline'
  }
  // 无论云端是否成功，重置本地缓存，避免降级路径读到旧数据
  cache = buildRosterWeek()
  persistLocal()
}
