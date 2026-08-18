/**
 * 意见反馈数据服务 —— 数据层与 UI 分离
 *
 * ▍双模式存储：
 *   1. 云端模式：CloudBase `feedback` 集合（所有人共享）
 *   2. 本地模式：localStorage
 *
 * 字段：category（'tech' 技术/设计 | 'daily' 工作/交际）、
 *       name（空串 = 匿名）、content、createdAt
 */
import * as cloud from './cloudService'
import { cloudConfig } from '../config/cloudConfig'

const STORAGE_KEY = 'qlu-mech-media:feedback:v1'
const MAX_CONTENT = 500
export const FEEDBACK_CATEGORIES = ['tech', 'daily']


export function getDataStatus() {
  return cloud.getDataStatus()
}

/* ---------------- 本地实现 ---------------- */

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('[feedbackService] 读取本地反馈失败', err)
  }
  return []
}

function writeLocal(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.warn('[feedbackService] 写入本地反馈失败', err)
  }
}

/* ---------------- 校验 ---------------- */

function validateFeedback({ category, name, content }) {
  if (!FEEDBACK_CATEGORIES.includes(category)) throw new Error('请选择反馈分类')
  const text = String(content ?? '').trim()
  if (!text) throw new Error('反馈内容不能为空')
  if (text.length > MAX_CONTENT) throw new Error(`反馈内容不能超过 ${MAX_CONTENT} 字`)
  return { category, name: String(name ?? '').trim(), content: text, createdAt: Date.now() }
}

/* ---------------- 对外接口 ---------------- */

/** 全部反馈（按时间倒序） */
export async function listFeedbacks() {
  if (!cloud.isCloudEnabled()) {
    cloud.setDataStatus('local')
    return readLocal()
  }
  try {
    const docs = await cloud.queryAll(cloudConfig.collections.feedback, 'createdAt', 'desc')
    cloud.setDataStatus('cloud')
    return docs.map((d) => ({
      id: d._id,
      category: d.category,
      name: d.name || '',
      content: d.content || '',
      createdAt: d.createdAt || Date.now(),
    }))
  } catch (err) {
    console.warn('[feedbackService] 云端读取失败，降级本地数据', err)
    cloud.setDataStatus('offline')
    return readLocal()
  }
}

/** 提交一条反馈 */
export async function createFeedback(input = {}) {
  const feedback = validateFeedback(input)

  const localCreate = () => {
    const list = readLocal()
    const entry = { id: `f-${Date.now()}`, ...feedback }
    list.unshift(entry)
    writeLocal(list)
    return entry
  }

  if (!cloud.isCloudEnabled()) {
    cloud.setDataStatus('local')
    return localCreate()
  }

  try {
    const id = await cloud.addDoc(cloudConfig.collections.feedback, feedback)
    cloud.setDataStatus('cloud')
    return { id, ...feedback }
  } catch (err) {
    console.warn('[feedbackService] 云端写入失败，已降级本地存储', err)
    cloud.setDataStatus('offline')
    return localCreate()
  }
}
