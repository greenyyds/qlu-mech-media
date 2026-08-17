/**
 * 冒烟测试（v2）：对生产构建做真实浏览器验证
 *
 * 覆盖：渲染 / 控制台报错 / 任务增删改 / 拖拽换列 / 持久化 /
 *       移动端 / 深色模式 / 值班表编辑 / 新闻工具校验 / PWA
 *
 * 前置：1) npm run build  2) npm run preview（默认端口 4173）
 * 运行：npm run smoke
 *
 * 说明：puppeteer-core 不内置浏览器，自动复用本机 Edge / Chrome
 * （Windows 常见安装路径），也可通过环境变量 CHROME_PATH 指定。
 * AI 真实调用不在自动化范围（会消耗额度），见 README 手动验收清单。
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173/'

/* ---------- 定位本机浏览器 ---------- */
function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ]
  return candidates.find((p) => existsSync(p))
}

/* ---------- 断言工具 ---------- */
let failures = 0
function check(name, ok) {
  if (ok) console.log(`  ✔ ${name}`)
  else {
    failures += 1
    console.error(`  ✘ ${name}`)
  }
}

const textExists = (page, text) =>
  page.evaluate((t) => document.body.innerText.includes(t), text)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------- 主流程 ---------- */
const browserPath = findBrowser()
if (!browserPath) {
  console.error('未找到 Edge/Chrome，请通过环境变量 CHROME_PATH 指定浏览器路径')
  process.exit(2)
}
console.log(`浏览器: ${browserPath}\n页面: ${PREVIEW_URL}\n`)

const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--disable-quic'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // 收集页面错误与控制台错误
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`)
  })

  console.log('[1] 页面渲染与核心模块')
  await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0', timeout: 30000 })
  for (const t of [
    '机械工程学部全媒体工作台',
    '常用链接',
    '新闻初稿生成工具',
    '本周重点任务',
    '本周值班表',
    '事件要点与背景',
  ]) {
    check(`包含「${t}」`, await textExists(page, t))
  }
  for (const id of ['home', 'links', 'news', 'tasks', 'roster', 'about']) {
    check(`锚点区块 #${id} 存在`, (await page.$(`#${id}`)) !== null)
  }
  const badLinks = await page.$$eval('a[target="_blank"]', (as) =>
    as.filter((a) => !a.rel.includes('noopener')).map((a) => a.href),
  )
  check('外链均带 rel="noopener"（共 ' + (await page.$$('a[target="_blank"]')).length + ' 个）', badLinks.length === 0)

  console.log('\n[2] 预置任务')
  for (const t of ['秋季纳新宣传推文', '学代会新闻稿初稿', '公众号栏目改版方案']) {
    check(`预置任务「${t}」已渲染`, await textExists(page, t))
  }

  console.log('\n[3] 添加任务')
  await page.click('button::-p-text(添加任务)')
  await page.waitForSelector('#task-title')
  await page.type('#task-title', '冒烟测试任务')
  await page.type('#task-assignee', '测试员')
  await page.type('#task-tag', '测试')
  await page.select('#task-status', 'in_progress')
  await page.click('button::-p-text(保存)')
  await sleep(400)
  check('新任务出现在页面', await textExists(page, '冒烟测试任务'))

  console.log('\n[4] 刷新后持久化')
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后任务仍在（localStorage 持久化）', await textExists(page, '冒烟测试任务'))

  console.log('\n[5] 编辑任务（改状态为已完成）')
  await page.click('[aria-label="编辑任务：冒烟测试任务"]')
  await page.waitForSelector('#task-status')
  await page.select('#task-status', 'done')
  await page.click('button::-p-text(保存)')
  await sleep(400)
  const inDone = await page.evaluate(() =>
    document.querySelector('[aria-label="已完成列"]').innerText.includes('冒烟测试任务'),
  )
  check('任务移动到「已完成」列', inDone)
  const doneProgress100 = await page.evaluate(() => {
    const bar = document.querySelector('[aria-label="已完成列"] [role="progressbar"]')
    return bar ? bar.getAttribute('aria-valuenow') === '100' : false
  })
  check('移入完成后进度自动置为 100%', doneProgress100)

  console.log('\n[6] 拖拽任务换列（已完成 → 待办）')
  const dragResult = await page.evaluate(async () => {
    const col = document.querySelector('[aria-label="待办列"]')
    const cards = [...document.querySelectorAll('[aria-label="已完成列"] [draggable="true"]')]
    const card = cards.find((c) => c.innerText.includes('冒烟测试任务'))
    if (!card || !col) return { ok: false, reason: '未找到卡片或目标列' }
    const dt = new DataTransfer()
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 120))
    col.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 60))
    col.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 150))
    return { ok: true }
  })
  if (dragResult.ok) {
    await sleep(300)
    const inTodo = await page.evaluate(() =>
      document.querySelector('[aria-label="待办列"]').innerText.includes('冒烟测试任务'),
    )
    const leftDone = await page.evaluate(() =>
      document.querySelector('[aria-label="已完成列"]').innerText.includes('冒烟测试任务'),
    )
    check('拖拽后任务出现在「待办」列', inTodo)
    check('拖拽后任务离开「已完成」列', !leftDone)
  } else {
    check(`拖拽执行（${dragResult.reason}）`, false)
  }

  console.log('\n[7] 删除任务（两步确认）')
  await page.click('[aria-label="删除任务：冒烟测试任务"]')
  await page.click('[aria-label="确认删除任务：冒烟测试任务"]')
  await sleep(400)
  check('任务已删除', !(await textExists(page, '冒烟测试任务')))

  console.log('\n[8] 深色模式')
  const themeBtn = 'button[aria-label^="当前"]'
  await page.click(themeBtn)
  await page.click(themeBtn) // system -> light -> dark
  await sleep(600) // 等待背景色过渡完成
  const darkApplied = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  )
  check('点击两次后启用深色模式（.dark class）', darkApplied)
  const darkBg = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)',
  )
  check('深色模式下页面背景为 #000', darkBg)
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后主题保持深色（localStorage）', await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  ))

  console.log('\n[9] 值班表编辑')
  await page.click('button::-p-text(编辑)')
  const rosterInput = 'input[placeholder="添加成员"]'
  await page.waitForSelector(rosterInput)
  await page.type(rosterInput, '测试值班员')
  await page.keyboard.press('Enter')
  await sleep(400)
  check('新增值班成员成功', await textExists(page, '测试值班员'))
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后值班表数据保持（localStorage）', await textExists(page, '测试值班员'))
  await page.click('button::-p-text(编辑)')
  await page.click('button::-p-text(重置示例)')
  await sleep(400)
  check('重置示例后恢复默认数据', !(await textExists(page, '测试值班员')))

  console.log('\n[10] 新闻工具（必填校验）')
  const genBtn = await page.$('button::-p-text(生成初稿)')
  const disabledBefore = await page.evaluate(
    (el) => el.disabled || el.getAttribute('aria-disabled') === 'true',
    genBtn,
  )
  check('未填写要点时生成按钮禁用', disabledBefore)
  const themeArea = await page.$('textarea[placeholder^="描述新闻事件"]')
  await themeArea.type('机械工程学部举办新生开学典礼，校领导出席。')
  await sleep(200)
  const disabledAfter = await page.evaluate(
    (el) => el.disabled || el.getAttribute('aria-disabled') === 'true',
    await page.$('button::-p-text(生成初稿)'),
  )
  check('填写要点后生成按钮可用', !disabledAfter)

  console.log('\n[11] PWA')
  check('manifest 已注册', (await page.$('link[rel="manifest"]')) !== null)
  try {
    await page.evaluate(() => navigator.serviceWorker.ready, { timeout: 5000 })
    check('Service Worker 已注册', true)
  } catch {
    check('Service Worker 已注册', false)
  }

  console.log('\n[12] 移动端：无横向滚动')
  await page.setViewport({ width: 375, height: 812 })
  await page.reload({ waitUntil: 'networkidle0' })
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  check('375px 视口下页面无横向滚动', noHScroll)
  const burger = await page.$('button[aria-label="打开菜单"]')
  check('移动端汉堡菜单存在', burger !== null)

  console.log('\n[13] 控制台与运行时错误')
  check(`无 pageerror / console.error（共 ${pageErrors.length} 条）`, pageErrors.length === 0)
  if (pageErrors.length) {
    for (const e of pageErrors) console.error(`    - ${e}`)
  }
} finally {
  await browser.close()
}

console.log('')
if (failures > 0) {
  console.error(`冒烟测试未通过：${failures} 项失败`)
  process.exit(1)
} else {
  console.log('冒烟测试全部通过 ✔')
  process.exit(0)
}
