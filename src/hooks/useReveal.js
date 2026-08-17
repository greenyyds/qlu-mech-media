import { useEffect, useRef } from 'react'

/**
 * 滚动进入视口时淡入上移动效（IntersectionObserver 实现）
 * - 尊重 prefers-reduced-motion：直接显示
 * - 只触发一次，避免重复动画
 */
export function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}
