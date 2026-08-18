/**
 * 云端共享端到端验证（真实 CloudBase）
 * 场景：浏览器 A 添加任务 → 浏览器 B（隔离上下文）刷新可见 → A 删除 → B 可见消失
 * 前置：1) npm run build（含正确 envId） 2) npm run preview
 * 运行：node scripts/cloud-share-test.mjs
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173/'
const TEST_TITLE = '云端共享验证任务-' + Date.now().toString().slice(-6)

const exe = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--disable-quic'],
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const check = (name, ok) => {
  if (ok) console.log(`  ✔ ${name}`)
  else {
    failures += 1
    console.error(`  ✘ ${name}`)
  }
}

// 浏览器 A（正常上下文）
const pageA = await browser.newPage()
await pageA.setViewport({ width: 1280, height: 900 })
// 浏览器 B（隔离上下文，模拟另一台设备）
const ctxB = await browser.createBrowserContext()
const pageB = await ctxB.newPage()
await pageB.setViewport({ width: 1280, height: 900 })

const errs = []
for (const [tag, p] of [['A', pageA], ['B', pageB]]) {
  p.on('pageerror', (e) => errs.push(`${tag}: ${e.message}`))
  p.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('[CloudBase') && !m.text().includes('400 (Bad Request)')) {
      errs.push(`${tag}: ${m.text()}`)
    }
  })
}

console.log('[1] 两端加载页面')
await pageA.goto(PREVIEW_URL, { waitUntil: 'networkidle0', timeout: 30000 })
await pageB.goto(PREVIEW_URL, { waitUntil: 'networkidle0', timeout: 30000 })

const badgeA = await pageA.evaluate(() => {
  const el = [...document.querySelectorAll('span[title*="云端"], span[title*="本机浏览器"], span[title*="离线"]')][0]
  return el ? el.textContent.trim() : '无'
})
check(`A 端数据状态徽标：${badgeA}`, badgeA.includes('云端共享'))
const badgeB = await pageB.evaluate(() => {
  const el = [...document.querySelectorAll('span[title*="云端"], span[title*="本机浏览器"], span[title*="离线"]')][0]
  return el ? el.textContent.trim() : '无'
})
check(`B 端数据状态徽标：${badgeB}`, badgeB.includes('云端共享'))

console.log('[2] A 端添加任务')
await pageA.click('button::-p-text(添加任务)')
await pageA.waitForSelector('#task-title')
await pageA.type('#task-title', TEST_TITLE)
await pageA.type('#task-assignee', '共享测试')
await pageA.click('button::-p-text(保存)')
await sleep(1200)
const inA = await pageA.evaluate((t) => document.body.innerText.includes(t), TEST_TITLE)
check(`A 端任务已添加`, inA)

console.log('[3] B 端刷新查看（共享核心验证）')
await pageB.reload({ waitUntil: 'networkidle0' })
await sleep(800)
const inB = await pageB.evaluate((t) => document.body.innerText.includes(t), TEST_TITLE)
check(`B 端刷新后看到 A 添加的任务 ✔ 共享生效`, inB)

console.log('[4] A 端删除任务（清理）')
const delBtn = await pageA.$(`[aria-label="删除任务：${TEST_TITLE}"]`)
if (delBtn) {
  await delBtn.click()
  const confirmBtn = await pageA.$(`[aria-label="确认删除任务：${TEST_TITLE}"]`)
  if (confirmBtn) await confirmBtn.click()
}
await sleep(1200)
const goneA = await pageA.evaluate((t) => !document.body.innerText.includes(t), TEST_TITLE)
check('A 端任务已删除', goneA)

console.log('[5] B 端再次刷新（删除同步验证）')
await pageB.reload({ waitUntil: 'networkidle0' })
await sleep(800)
const goneB = await pageB.evaluate((t) => !document.body.innerText.includes(t), TEST_TITLE)
check('B 端刷新后任务消失（删除同步）', goneB)

console.log('[6] 控制台错误')
check(`无异常错误（共 ${errs.length} 条）`, errs.length === 0)
if (errs.length) for (const e of errs.slice(0, 5)) console.error(`    - ${e}`)

await ctxB.close()
await browser.close()
console.log(failures ? `\n共享验证未通过：${failures} 项失败` : '\n云端共享验证全部通过 ✔')
process.exit(failures ? 1 : 0)
