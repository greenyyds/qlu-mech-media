/**
 * AI 新闻生成端到端测试（真实调用智谱 API，消耗少量免费额度）
 *
 * 运行：node scripts/ai-e2e-test.mjs（需先 npm run preview）
 * 前置：src/config/aiConfig.js 中配置了有效 Key
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173/'

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

const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--disable-quic'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000 })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
})

console.log('打开页面…')
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0', timeout: 30000 })

// 填写选项
console.log('填写「事件要点与背景」…')
const themeArea = await page.$('textarea[placeholder^="描述新闻事件"]')
await themeArea.type(
  '机械工程学部于今日在长清校区举办 2026 级新生开学典礼，学部领导与新生代表出席并发言，典礼结束后开展了专业导学活动。',
)
await page.type('input[placeholder="如：齐鲁工业大学（长清校区）艺体中心"]', '齐鲁工业大学（长清校区）艺体中心')
const selects = await page.$$('select')
await selects[0].select('院系动态') // 新闻类型（选项面板第一个下拉）
await page.type('input[placeholder="希望突出的关键词，逗号分隔，可留空"]', '开学典礼,新生,机械工程学部')

console.log('点击生成初稿（流式）…')
await page.click('button::-p-text(生成初稿)')

// 等待生成完成（状态徽标变为「已完成」）
let done = false
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 500))
  const badge = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) =>
      ['待生成', '生成中', '已完成', '失败'].includes(s.textContent.trim()),
    )
    return el ? el.textContent.trim() : ''
  })
  if (badge === '已完成') {
    done = true
    break
  }
  if (badge === '失败') break
}
if (!done) {
  const badge = await page.evaluate(() =>
    [...document.querySelectorAll('span')]
      .map((s) => s.textContent.trim())
      .find((t) => ['待生成', '生成中', '已完成', '失败'].includes(t)),
  )
  console.error(`生成未完成（状态：${badge || '未知'}），可能已超时或报错`)
  console.error(errors)
  await browser.close()
  process.exit(1)
}

// 提取草稿内容
const draftText = await page.evaluate(() => {
  const article = document.querySelector('article')
  return article ? article.innerText : ''
})
console.log('\n================ 生成的新闻初稿 ================')
console.log(draftText)
console.log('================================================')

const ok =
  draftText.length > 100 &&
  /【|——|，|。/.test(draftText) &&
  errors.length === 0

console.log(`\n草稿字数：${draftText.length}`)
console.log(`控制台错误：${errors.length} 条`)
console.log(ok ? '\nAI 端到端测试通过 ✔' : '\nAI 端到端测试失败 ✘')
if (errors.length) console.error(errors)
await browser.close()
process.exit(ok ? 0 : 1)
