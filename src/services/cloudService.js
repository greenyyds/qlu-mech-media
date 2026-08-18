/**
 * CloudBase 服务封装 —— 统一的云端访问层
 *
 * ▍职责：SDK 初始化（幂等）、匿名登录、集合 CRUD、错误归一化
 * ▍本地模式：cloudConfig.envId 为空时，isCloudEnabled() 返回 false，
 *            所有云端方法抛出明确错误，调用方（各业务 service）据此降级
 * ▍性能：SDK 采用动态导入，仅在云端模式启用时才加载（本地模式首屏零开销）
 * ▍替换说明：如未来换用其他后端（如自建 API），仅需改本文件，
 *            各业务 service 与 UI 无感知。
 */
import { cloudConfig } from '../config/cloudConfig'

let app = null
let sdkPromise = null

/* ---------------- 数据状态管理（云端/本地/离线 + 订阅） ---------------- */

let dataStatus = isCloudEnabled() ? 'cloud' : 'local'
const listeners = new Set()

/** 当前数据状态：'cloud' | 'local' | 'offline' */
export function getDataStatus() {
  return dataStatus
}

/** 更新数据状态并通知订阅者（仅状态变化时触发） */
export function setDataStatus(next) {
  if (next === dataStatus) return
  dataStatus = next
  listeners.forEach((fn) => {
    try {
      fn(next)
    } catch (err) {
      console.warn('[cloudService] 状态订阅回调异常', err)
    }
  })
}

/** 订阅数据状态变化，返回取消订阅函数 */
export function onDataStatusChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* ---------------- 云端错误诊断（离线原因提示） ---------------- */

let lastCloudError = null

/** 记录最近一次云端错误（供 UI 展示离线原因） */
export function setLastCloudError(err) {
  lastCloudError = err
}

/** 把错误转成人话提示（离线横幅展示） */
export function getCloudErrorHint() {
  const msg = String(
    lastCloudError?.message || lastCloudError?.msg || lastCloudError || '',
  )
  if (/匿名登录|AnonymousLogin|登录方式未开启/.test(msg)) {
    return '云端未开启匿名登录（需在控制台配置）'
  }
  if (/collection not exists|集合不存在|Env not found/.test(msg)) {
    return '云端数据集合缺失（需在控制台创建）'
  }
  if (/CORS|Access to fetch|安全域名|tcloudbasegateway/i.test(msg) || /Failed to fetch/i.test(msg)) {
    return '网络不通或 Web 安全域名未配置'
  }
  return '网络暂时不可用'
}

/** 是否已配置云端环境 */
export function isCloudEnabled() {
  return Boolean(cloudConfig.envId)
}

/** 动态加载 SDK（懒加载，仅云端模式触发） */
function loadSDK() {
  if (!sdkPromise) {
    sdkPromise = import('@cloudbase/js-sdk')
  }
  return sdkPromise
}

async function getApp() {
  if (!isCloudEnabled()) {
    throw new Error('云端环境未配置（本地模式）')
  }
  if (!app) {
    const mod = await loadSDK()
    // SDK 为 CommonJS 打包，动态导入时初始化方法在 default 上
    const cloudbase = mod.default || mod
    app = cloudbase.init({ env: cloudConfig.envId })
  }
  return app
}

/** 匿名登录（幂等，已登录直接返回） */
export async function ensureAuth() {
  const a = await getApp()
  const auth = a.auth({ persistence: 'local' })
  const state = await auth.getLoginState()
  if (!state) {
    await auth.signInAnonymously()
  }
  return auth
}

/** 获取数据库实例（需先 ensureAuth） */
export async function getDb() {
  const a = await getApp()
  return a.database()
}

/** 查询集合全部文档（按字段排序） */
export async function queryAll(collection, orderField = 'createdAt', order = 'desc') {
  await ensureAuth()
  const db = await getDb()
  const res = await db
    .collection(collection)
    .orderBy(orderField, order)
    .limit(1000)
    .get()
  return res.data || []
}

/** 按条件查询单条 */
export async function queryOne(collection, where) {
  await ensureAuth()
  const db = await getDb()
  const res = await db.collection(collection).where(where).limit(1).get()
  return (res.data && res.data[0]) || null
}

/** 新增文档，返回文档 id */
export async function addDoc(collection, data) {
  await ensureAuth()
  const db = await getDb()
  const res = await db.collection(collection).add(data)
  return res.id
}

/** 更新文档（局部字段合并） */
export async function updateDoc(collection, id, data) {
  await ensureAuth()
  const db = await getDb()
  await db.collection(collection).doc(id).update(data)
}

/** 删除文档 */
export async function removeDoc(collection, id) {
  await ensureAuth()
  const db = await getDb()
  await db.collection(collection).doc(id).remove()
}
