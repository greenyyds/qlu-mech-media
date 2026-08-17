/**
 * 生成成品截图（docs/screenshots/v2/）
 * 运行：node scripts/capture-screens.mjs（需先 npm run preview）
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'node:fs'

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173/'
const OUT_DIR = decodeURIComponent(
  new URL('../docs/screenshots/v2/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
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

// 桌面端 · 浅色
await page.setViewport({ width: 1440, height: 900 })
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0' })
await revealAll()
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: `${OUT_DIR}/desktop-light-full.png`, fullPage: true })
await page.evaluate(() => window.scrollTo(0, 0))
await page.screenshot({ path: `${OUT_DIR}/desktop-light-hero.png` })

// 桌面端 · 深色
await page.evaluate(() => {
  // 直接切深色（点击切换按钮：system->light->dark 需两次，这里用 evaluate 设置 class）
  document.documentElement.classList.add('dark')
})
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: `${OUT_DIR}/desktop-dark-full.png`, fullPage: true })

// 移动端 · 浅色
await page.setViewport({ width: 375, height: 812 })
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0' })
await revealAll()
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: `${OUT_DIR}/mobile-light-full.png`, fullPage: true })

// 移动端 · 新闻工具区特写（生成前）
await page.evaluate(() => {
  document.getElementById('news')?.scrollIntoView()
})
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: `${OUT_DIR}/mobile-news-tool.png` })

await browser.close()
console.log(`截图已保存至 docs/screenshots/v2/`)
