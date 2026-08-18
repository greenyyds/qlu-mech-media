import { useEffect, useState } from 'react'

/**
 * 极简 hash 路由
 *
 * 约定：以 "#/" 开头的 hash 是"二级页面路由"（如 #/feedback），
 *       其他 hash（#home、#tasks…）是主页内的锚点，不影响路由。
 */
export function parseRoute() {
  const h = window.location.hash
  return h.startsWith('#/') ? h.slice(1) : '/'
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

/** 跳转到路由页面（home 传 '/'） */
export function navigate(route) {
  window.location.hash = `#${route}`
}
