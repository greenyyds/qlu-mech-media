import { AlertTriangle } from 'lucide-react'
import * as cloud from '../services/cloudService'

/**
 * 离线模式提示横幅
 * 云端不可用时显示原因与自动恢复说明；云端恢复后自动消失
 */
export default function OfflineNotice({ visible }) {
  if (!visible) return null
  return (
    <div className="border-b border-warning/25 bg-warning/10">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-2 md:px-8">
        <AlertTriangle size={14} className="shrink-0 text-warning" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[12.5px] text-warning">
          云端连接异常（{cloud.getCloudErrorHint()}）· 数据暂存本机 · 每 30 秒自动重试
        </p>
      </div>
    </div>
  )
}
