/**
 * 值班表数据服务 —— 数据层与 UI 分离
 *
 * ▍当前实现：localStorage 持久化（默认数据来自 src/data/roster.js）
 * ▍替换方式：接入真实排班时，将内部实现改为请求后端接口，
 *            保持方法名与 Promise 签名不变，UI 组件零改动。
 */
import { buildRosterWeek } from '../data/roster'

const STORAGE_KEY = 'qlu-mech-media:roster:v1'
const MAX_MEMBERS_PER_DAY = 4

/** 内存缓存 */
let cache = null

function read() {
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
  persist()
  return cache
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.warn('[dutyService] 写入值班数据失败', err)
  }
}

function clone(list) {
  return list.map((d) => ({ ...d, members: [...d.members] }))
}

/* ---------------- 对外接口 ---------------- */

/** 获取本周值班安排（副本） */
export async function listWeek() {
  return clone(read())
}

/** 更新某天的值班成员（iso 为 YYYY-MM-DD；成员去空、去重、限 4 人） */
export async function updateDay(iso, members) {
  const days = read()
  const day = days.find((d) => d.iso === iso)
  if (!day) throw new Error(`日期不存在：${iso}`)
  const cleaned = (Array.isArray(members) ? members : [])
    .map((m) => String(m ?? '').trim())
    .filter(Boolean)
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .slice(0, MAX_MEMBERS_PER_DAY)
  day.members = cleaned
  persist()
}

/** 重置为示例数据 */
export async function resetToDefault() {
  cache = buildRosterWeek()
  persist()
}
