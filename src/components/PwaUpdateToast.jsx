import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * PWA 更新提示
 * - 新版本发布后，Service Worker 检测到更新时显示提示条
 * - 点击「刷新」立即应用新版本；「稍后」关闭提示
 */
export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('[PWA] Service Worker 注册失败', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2">
      <div
        role="status"
        className="glass flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
      >
        <p className="text-[13px] font-medium text-ink">发现新版本，刷新后生效</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="rounded-full px-3 py-1.5 text-[12.5px] text-secondary transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            稍后
          </button>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            刷新
          </button>
        </div>
      </div>
    </div>
  )
}
