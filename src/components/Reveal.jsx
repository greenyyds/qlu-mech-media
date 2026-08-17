import { useReveal } from '../hooks/useReveal'

/**
 * 通用淡入容器：进入视口时向上淡入
 * @param {number} delay 延迟毫秒数，用于错峰入场
 */
export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
