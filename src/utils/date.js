/**
 * 日期工具函数（纯函数，无副作用）
 * 提供本周范围计算与中文日期格式化
 */

function pad(n) {
  return String(n).padStart(2, '0')
}

/** Date -> 'YYYY-MM-DD'（本地时区） */
export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 日期偏移 n 天（返回新 Date） */
export function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** 归一到当天零点 */
export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * 计算本周（周一 ~ 周日）范围
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function getWeekRange(ref = new Date()) {
  const d = startOfDay(ref)
  const day = d.getDay() // 0=周日, 1=周一 ...
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = addDays(d, diffToMonday)
  const end = addDays(start, 6)
  return { start, end, label: formatRange(start, end) }
}

/** '8月17日' */
export function formatMonthDay(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** '8月17日 - 8月23日'（跨年时带年份） */
export function formatRange(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear()
  if (sameYear) return `${formatMonthDay(start)} - ${formatMonthDay(end)}`
  return `${start.getFullYear()}年${formatMonthDay(start)} - ${end.getFullYear()}年${formatMonthDay(end)}`
}

/** '2025-08-23' -> '8月23日'（跨年时带年份）；空值返回 '未设置' */
export function formatDeadline(iso) {
  if (!iso) return '未设置'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const base = formatMonthDay(d)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() ? base : `${d.getFullYear()}年${base}`
}

/** 是否已逾期（按当天零点比较；未设置截止日期视为未逾期） */
export function isOverdue(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return startOfDay(d) < startOfDay(new Date())
}
