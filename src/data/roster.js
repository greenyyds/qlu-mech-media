/**
 * 值班表示例数据（纯展示模块）
 *
 * 修改值班安排：直接编辑本文件 buildRosterWeek() 中的 plan 数组。
 * 接入真实排班后：将 buildRosterWeek 改为请求后端接口并保持返回结构不变即可。
 */
import { addDays, getWeekRange, toISODate } from '../utils/date'

export const rosterNote = '示例数据 · 以部门群内正式排班为准'

/** 生成本周（周一 ~ 周日）值班安排 */
export function buildRosterWeek() {
  const { start } = getWeekRange()
  // 周一 ~ 周日，每天 1~2 名值班成员（示例）
  const plan = [
    ['张明'],
    ['王小雨'],
    ['李志强'],
    ['陈思雨'],
    ['刘畅'],
    ['张明', '李志强'],
    ['王小雨', '陈思雨'],
  ]
  const weekdays = '一二三四五六日'

  return plan.map((members, i) => {
    const date = addDays(start, i)
    return {
      iso: toISODate(date),
      weekday: `周${weekdays[i]}`,
      monthDay: `${date.getMonth() + 1}月${date.getDate()}日`,
      members,
    }
  })
}
