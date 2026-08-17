/**
 * 模块标题通用组件
 * @param {string}  eyebrow     眉题（可选，小号英文/短词）
 * @param {string}  title       主标题
 * @param {string}  description 副标题说明
 * @param {string}  align       'center' | 'left'
 */
export default function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignCls = align === 'left' ? 'text-left' : 'mx-auto text-center'
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && (
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[15px] leading-relaxed text-secondary md:text-base">
          {description}
        </p>
      )}
    </div>
  )
}
