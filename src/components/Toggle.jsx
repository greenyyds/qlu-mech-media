/**
 * 胶囊开关（Switch）共用组件
 *
 * v4 重构：用 flex 两端对齐 + 内边距替代 translate 位移，
 * 圆点始终在轨道内（p-0.5 约束），彻底消除越界/方向问题。
 */
export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
        checked ? 'justify-end bg-accent' : 'justify-start bg-black/15 dark:bg-white/20'
      }`}
    >
      <span className="h-6 w-6 rounded-full bg-white shadow transition-transform duration-300" />
    </button>
  )
}
