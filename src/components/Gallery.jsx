import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { gallerySlides } from '../data/gallery'
import Reveal from './Reveal'

const AUTO_MS = 5000 // 自动播放间隔

/**
 * 风采展示：全宽自动轮播（参考宇树官网克制大图风格）
 * - 自动播放 + 左右箭头 + 圆点指示 + 悬停暂停
 * - 键盘左右方向键切换；prefers-reduced-motion 时关闭自动播放
 * - 图片底部渐变遮罩 + 标题与拍摄日期
 * 素材维护入口：src/data/gallery.js
 */
export default function Gallery() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchX, setTouchX] = useState(null)
  const count = gallerySlides.length

  // 自动播放（悬停暂停 / 减少动效时关闭）
  useEffect(() => {
    if (paused || count <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS)
    return () => clearInterval(t)
  }, [paused, count])

  const prev = () => setIndex((i) => (i - 1 + count) % count)
  const next = () => setIndex((i) => (i + 1) % count)

  // 键盘操作
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  // 移动端触摸滑动
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX)
  const onTouchEnd = (e) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 48) {
      if (dx > 0) prev()
      else next()
    }
    setTouchX(null)
  }

  return (
    <section aria-label="风采展示" className="px-5 pb-16 md:px-8 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div
            role="region"
            aria-roledescription="轮播"
            aria-label="机械工程学部风采展示"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="group relative h-[340px] overflow-hidden rounded-[28px] bg-night focus-visible:outline-2 focus-visible:outline-accent sm:h-[420px] md:h-[560px]"
          >
            {/* 滑动轨道 */}
            <div
              className="flex h-full transition-transform duration-500"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {gallerySlides.map((slide, i) => (
                <figure
                  key={i}
                  role="group"
                  aria-roledescription="幻灯片"
                  aria-label={`第 ${i + 1} 张，共 ${count} 张：${slide.alt}`}
                  aria-hidden={i !== index}
                  className="relative h-full w-full shrink-0"
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                  {/* 底部渐变遮罩 + 说明文字 */}
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-6 pb-6 pt-20 text-white md:px-10 md:pb-8">
                    <p className="text-[15px] font-semibold tracking-[-0.01em] md:text-lg">
                      {slide.title}
                    </p>
                    <p className="mt-1 text-[12px] text-white/70 md:text-[13px]">{slide.date}</p>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* 左右箭头 */}
            <button
              type="button"
              onClick={prev}
              aria-label="上一张"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 hover:bg-white/30 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="下一张"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 hover:bg-white/30 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>

            {/* 圆点指示 */}
            <div className="absolute bottom-4 right-6 flex items-center gap-2 md:bottom-6 md:right-10">
              {gallerySlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`切换到第 ${i + 1} 张`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
