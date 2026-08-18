import { useEffect, useState } from 'react'
import * as cloud from '../services/cloudService'

/**
 * 数据状态订阅 Hook（云端共享 / 本机数据 / 离线模式）
 * 状态由 cloudService 统一管理，云端恢复后自动更新（无需刷新页面）
 */
export function useDataStatus() {
  const [status, setStatus] = useState(cloud.getDataStatus())

  useEffect(() => cloud.onDataStatusChange(setStatus), [])

  return status
}
