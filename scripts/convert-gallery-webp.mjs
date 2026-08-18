/**
 * 风采图片 WebP 转换（一次性工具，可复用）
 * 原图 src/assets/gallery/*.jpg → 1280px 宽 WebP（q75），删除 jpg
 * 运行：node scripts/convert-gallery-webp.mjs
 */
import sharp from 'sharp'
import { readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const GALLERY_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'gallery')
const WIDTH = 1280
const QUALITY = 75

const files = readdirSync(GALLERY_DIR).filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'))
let totalBefore = 0
let totalAfter = 0

for (const f of files) {
  const src = join(GALLERY_DIR, f)
  const out = join(GALLERY_DIR, f.replace(/\.jpe?g$/i, '.webp'))
  totalBefore += statSync(src).size
  await sharp(src)
    .resize(WIDTH, null, { withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  const after = statSync(out).size
  totalAfter += after
  rmSync(src)
  console.log(`${f} -> ${f.replace(/\.jpe?g$/i, '.webp')}  ${(after / 1024).toFixed(0)} KB`)
}

console.log(`\n合计：${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB（节省 ${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}%）`)
