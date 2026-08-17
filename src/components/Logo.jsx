import { useState } from 'react'
import deptLogo from '../assets/dept-logo.webp'

/**
 * 部门徽标
 * - 优先显示本地素材 src/assets/dept-logo.webp
 * - 素材缺失 / 加载失败时回退为蓝色"机"字占位，保证页面不破相
 */
export default function Logo({ className = 'h-9 w-9' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex select-none items-center justify-center rounded-xl bg-accent text-[15px] font-bold text-white ${className}`}
      >
        机
      </span>
    )
  }

  return (
    <img
      src={deptLogo}
      alt="机械工程学部徽标"
      loading="eager"
      className={`${className} rounded-xl object-contain ring-1 ring-line`}
      onError={() => setFailed(true)}
    />
  )
}
