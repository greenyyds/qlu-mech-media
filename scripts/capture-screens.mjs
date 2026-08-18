/**
 * 生成成品截图（docs/screenshots/v3/）
 * 运行：node scripts/capture-screens.mjs（需先 npm run preview）
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'node:fs'

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173/'
const OUT_DIR = decodeURIComponent(
  new URL('../docs/screenshots/v3/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
)

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]
  return candidates.find((p) => existsSync(p))
}

mkdirSync(OUT_DIR, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--disable-quic'],
})
const page = await browser.newPage()

const revealAll = () =>
  page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'))
  })

// 桌面端 · 首页（含风采轮播）
await page.setViewport({ width: 1440, height: 900 })
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0' })
await revealAll()
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: `${OUT_DIR}/desktop-home-full.png`, fullPage: true })

// 桌面端 · 轮播特写
await page.evaluate(() => {
  document.querySelector('[aria-roledescription="轮播"]')?.scrollIntoView()
})
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: `${OUT_DIR}/desktop-gallery.png` })

// 反馈页
await page.evaluate(() => {
  window.location.hash = '#/feedback'
})
await new Promise((r) => setTimeout(r, 800))
await revealAll()
await page.screenshot({ path: `${OUT_DIR}/desktop-feedback.png` })

// 移动端 · 首页
await page.evaluate(() => {
  window.location.hash = '#/'
})
await page.setViewport({ width: 375, height: 812 })
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0' })
await revealAll()
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: `${OUT_DIR}/mobile-home-full.png`, fullPage: true })

await browser.close()
console.log('截图已保存至 docs/screenshots/v3/')
