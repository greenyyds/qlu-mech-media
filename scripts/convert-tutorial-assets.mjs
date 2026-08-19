/**
 * 摄影教程素材转换工具（WebP 压缩）
 * 原图：素材/摄影教程/图片素材/{相机,会议,学生活动}/
 * 输出：src/assets/tutorials/*.webp
 * 运行：node scripts/convert-tutorial-assets.mjs
 */
import sharp from 'sharp'
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, '素材', '摄影教程', '图片素材')
const OUT_DIR = join(ROOT, 'src', 'assets', 'tutorials')

// 每类素材的输出文件名与最大宽度
const PLAN = [
  { dir: '相机', out: 'camera.webp', width: 800 },
  { dir: '会议', out: 'meeting.webp', width: 1280 },
  { dir: '学生活动', out: 'activity.webp', width: 1280 },
]

// 新闻与图像处理教程素材（手机操作截图，竖屏）
const NEWS_PLAN = [
  { dir: '公众号页面截图', out: 'gongzhonghao.webp', width: 640 },
  { dir: '醒图智能抠图', out: 'retouch-ai.webp', width: 640 },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const p of PLAN) {
  const dir = join(SRC_DIR, p.dir)
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f))
  if (!files.length) {
    console.log(`⚠️ ${p.dir} 目录无图片，跳过`)
    continue
  }
  const src = join(dir, files[0])
  const out = join(OUT_DIR, p.out)
  const before = statSync(src).size
  await sharp(src)
    .resize(p.width, null, { withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out)
  const after = statSync(out).size
  console.log(`${p.dir} -> ${p.out}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`)
}

// 新闻与图像处理教程素材（子目录结构：素材/新闻与图像处理教程/<dir>/）
const NEWS_SRC = join(ROOT, '素材', '新闻与图像处理教程')
for (const p of NEWS_PLAN) {
  const dir = join(NEWS_SRC, p.dir)
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f))
  if (!files.length) {
    console.log(`⚠️ ${p.dir} 目录无图片，跳过`)
    continue
  }
  const src = join(dir, files[0])
  const out = join(OUT_DIR, p.out)
  const before = statSync(src).size
  await sharp(src)
    .resize(p.width, null, { withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out)
  const after = statSync(out).size
  console.log(`${p.dir} -> ${p.out}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`)
}
