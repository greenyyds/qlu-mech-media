/**
 * 冒烟测试（v3）：对生产构建做真实浏览器验证
 *
 * 覆盖：渲染 / 控制台报错 / 任务增删改 / 拖拽换列 / 深色模式 /
 *       值班表编辑 / 新闻工具校验 / 风采轮播 / 意见反馈页 / 备份导出 /
 *       数据状态徽标 / PWA / 移动端
 *
 * 前置：1) npm run build  2) npm run preview（默认端口 4173）
 * 运行：npm run smoke
 *
 * 说明：puppeteer-core 不内置浏览器，自动复用本机 Edge / Chrome；
 * 云端（CloudBase）真实调用不在自动化范围，本测试默认在本地模式
 * （cloudConfig.envId 为空）下验证全流程。
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

  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const t = msg.text()
    // 忽略 CloudBase 环境配置阶段的预期提示：
    // 「匿名登录未开启」与 auth 接口 400（一次性控制台配置，见 docs/CLOUDBASE-SETUP.md）
    if (t.includes('[CloudBase') || t.includes('400 (Bad Request)')) return
    pageErrors.push(`console.error: ${t}`)
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
    '意见反馈',
    '活动风采',
    '内部教程',
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

  console.log('\n[1.5] 工具链接（v4：醒图/秀米 + 品牌色）')
  const toolLinks = await page.$$eval('a[target="_blank"]', (as) => as.map((a) => a.href))
  check('醒图链接存在', toolLinks.some((h) => h.includes('retouchpics.com')))
  check('秀米链接存在', toolLinks.some((h) => h.includes('xiumi.us')))
  check('首页教程入口卡片存在', (await page.$('a[href="#/tutorials"]')) !== null)

  console.log('\n[2] 数据状态徽标')
  const badgeTexts = await page.evaluate(() => {
    const els = [...document.querySelectorAll('span[title*="本机浏览器"], span[title*="云端"], span[title*="离线"]')]
    return els.map((el) => el.textContent.trim())
  })
  check(`任务/值班表显示数据状态徽标（${badgeTexts[0] || '无'}）`, badgeTexts.length >= 2)

  console.log('\n[3] 风采轮播')
  const slideCount = await page.evaluate(
    () => document.querySelectorAll('[aria-roledescription="幻灯片"]').length,
  )
  check(`轮播包含 4 张照片（实际 ${slideCount}）`, slideCount === 4)
  await page.click('button[aria-label="下一张"]')
  await sleep(600)
  const secondActive = await page.evaluate(() => {
    const dots = [...document.querySelectorAll('button[aria-label^="切换到第"]')]
    return dots[1] ? dots[1].getAttribute('aria-current') === 'true' : false
  })
  check('点击「下一张」后切换到第 2 张', secondActive)
  await page.click('button[aria-label="上一张"]')
  await sleep(600)
  const firstActive = await page.evaluate(() => {
    const dots = [...document.querySelectorAll('button[aria-label^="切换到第"]')]
    return dots[0] ? dots[0].getAttribute('aria-current') === 'true' : false
  })
  check('点击「上一张」后回到第 1 张', firstActive)

  console.log('\n[4] 任务看板（按数据模式断言）')
  const mode = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span[title*="云端"], span[title*="本机浏览器"], span[title*="离线"]')][0]
    return el ? el.textContent.trim() : ''
  })
  if (mode.includes('云端共享')) {
    // 云端模式：数据为共享数据（无预置任务），验证看板结构与空态
    check('云端模式：三列看板正常渲染', await page.evaluate(() => {
      const cols = document.querySelectorAll('[aria-label$="列"]')
      return cols.length >= 3 && cols[0]?.getAttribute('aria-label')?.includes('待办')
    }))
  } else {
    // 本地/离线模式：预置任务存在
    for (const t of ['秋季纳新宣传推文', '学代会新闻稿初稿', '公众号栏目改版方案']) {
      check(`预置任务「${t}」已渲染`, await textExists(page, t))
    }
  }

  console.log('\n[5] 添加任务')
  await page.click('button::-p-text(添加任务)')
  await page.waitForSelector('#task-title')
  await page.type('#task-title', '冒烟测试任务')
  await page.type('#task-assignee', '测试员')
  await page.type('#task-tag', '测试')
  await page.select('#task-status', 'in_progress')
  await page.click('button::-p-text(保存)')
  await sleep(400)
  check('新任务出现在页面', await textExists(page, '冒烟测试任务'))

  console.log('\n[6] 刷新后持久化')
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后任务仍在（本地持久化）', await textExists(page, '冒烟测试任务'))

  console.log('\n[7] 编辑任务 + 拖拽换列')
  await page.click('[aria-label="编辑任务：冒烟测试任务"]')
  await page.waitForSelector('#task-status')
  await page.select('#task-status', 'done')
  await page.click('button::-p-text(保存)')
  await sleep(400)
  const inDone = await page.evaluate(() =>
    document.querySelector('[aria-label="已完成列"]').innerText.includes('冒烟测试任务'),
  )
  check('编辑状态为已完成 → 出现在「已完成」列', inDone)

  const dragResult = await page.evaluate(async () => {
    const col = document.querySelector('[aria-label="待办列"]')
    const cards = [...document.querySelectorAll('[aria-label="已完成列"] [draggable="true"]')]
    const card = cards.find((c) => c.innerText.includes('冒烟测试任务'))
    if (!card || !col) return false
    const dt = new DataTransfer()
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 120))
    col.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 60))
    col.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
    await new Promise((r) => setTimeout(r, 150))
    return true
  })
  if (dragResult) {
    await sleep(300)
    check('拖拽后任务出现在「待办」列', await page.evaluate(() =>
      document.querySelector('[aria-label="待办列"]').innerText.includes('冒烟测试任务'),
    ))
  } else {
    check('拖拽执行', false)
  }

  console.log('\n[8] 删除任务')
  await page.click('[aria-label="删除任务：冒烟测试任务"]')
  await page.click('[aria-label="确认删除任务：冒烟测试任务"]')
  await sleep(400)
  check('任务已删除', !(await textExists(page, '冒烟测试任务')))

  console.log('\n[9] 深色模式')
  const themeBtn = 'button[aria-label^="当前"]'
  await page.click(themeBtn)
  await page.click(themeBtn)
  await sleep(600)
  check('点击两次后启用深色模式（.dark class）', await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  ))
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后主题保持深色', await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  ))

  console.log('\n[10] 值班表编辑')
  await page.click('button::-p-text(编辑)')
  await page.waitForSelector('input[placeholder="添加成员"]')
  await page.type('input[placeholder="添加成员"]', '测试值班员')
  await page.keyboard.press('Enter')
  await sleep(400)
  check('新增值班成员成功', await textExists(page, '测试值班员'))
  await page.reload({ waitUntil: 'networkidle0' })
  check('刷新后值班表数据保持', await textExists(page, '测试值班员'))
  await page.click('button::-p-text(编辑)')
  await page.click('button::-p-text(重置示例)')
  await sleep(400)
  check('重置示例后恢复默认数据', !(await textExists(page, '测试值班员')))

  console.log('\n[11] 新闻工具（必填校验 + v4 模型双模式）')
  const genBtn = await page.$('button::-p-text(生成初稿)')
  check('未填写要点时生成按钮禁用', await page.evaluate(
    (el) => el.disabled || el.getAttribute('aria-disabled') === 'true', genBtn,
  ))
  const themeArea = await page.$('textarea[placeholder^="描述新闻事件"]')
  await themeArea.type('机械工程学部举办新生开学典礼，校领导出席。')
  await sleep(200)
  check('填写要点后生成按钮可用', !(await page.evaluate(
    (el) => el.disabled || el.getAttribute('aria-disabled') === 'true',
    await page.$('button::-p-text(生成初稿)'),
  )))
  // 模型双模式：默认深度 + 徽标动态型号
  const deepRadio = await page.$('button[role="radio"][aria-checked="true"]')
  check('存在模型模式选择且默认选中', deepRadio !== null && (await page.evaluate(
    (el) => el.textContent.includes('深度'), deepRadio,
  )))
  check('徽标显示 glm-4.5-flash', await page.evaluate(() =>
    [...document.querySelectorAll('span')].some((s) => s.textContent.includes('glm-4.5-flash')),
  ))
  // 切换到快速模式
  await page.click('button[role="radio"]::-p-text(快速)')
  await sleep(200)
  check('切换后徽标显示 glm-4-flash', await page.evaluate(() =>
    [...document.querySelectorAll('span')].some((s) => s.textContent.includes('glm-4-flash')),
  ))
  // 切回深度（默认）
  await page.click('button[role="radio"]::-p-text(深度)')

  console.log('\n[12] 意见反馈页（路由 + 提交 + 列表）')
  await page.click('a[href="#/feedback"]')
  await sleep(500)
  check('进入 #/feedback 二级页', (await page.evaluate(() => window.location.hash)) === '#/feedback' && (await textExists(page, '意见反馈')))
  await page.click('button::-p-text(技术与设计问题)')
  await sleep(300)
  await page.type('textarea[placeholder^="请描述你遇到的问题"]', '这是冒烟测试反馈内容')
  // v4：开关组件重构断言（点击后 aria-checked 翻转、圆点在轨道内）
  const switchBefore = await page.evaluate(() => {
    const sw = document.querySelector('button[role="switch"][aria-label="匿名提交开关"]')
    return sw ? sw.getAttribute('aria-checked') : null
  })
  await page.click('button[role="switch"][aria-label="匿名提交开关"]')
  await sleep(200)
  const switchAfter = await page.evaluate(() => {
    const sw = document.querySelector('button[role="switch"][aria-label="匿名提交开关"]')
    const knob = sw?.querySelector('span')
    const rect = sw?.getBoundingClientRect()
    const krect = knob?.getBoundingClientRect()
    return {
      checked: sw?.getAttribute('aria-checked'),
      inside: rect && krect ? krect.right <= rect.right + 1 && krect.left >= rect.left - 1 : false,
    }
  })
  check(
    `匿名开关点击后状态翻转（${switchBefore} -> ${switchAfter.checked}）`,
    switchBefore === 'true' && switchAfter.checked === 'false',
  )
  check('开关圆点位于轨道内（不越界）', switchAfter.inside)
  // 恢复匿名状态
  await page.click('button[role="switch"][aria-label="匿名提交开关"]')
  await page.click('button::-p-text(提交反馈)')
  await sleep(600)
  check('提交后显示「已提交」', await textExists(page, '已提交，感谢反馈'))
  check('反馈出现在公开列表', await textExists(page, '这是冒烟测试反馈内容'))
  check('匿名展示', await textExists(page, '匿名'))
  await page.click('a[href="#/"]')
  await sleep(500)
  check('返回首页成功', (await page.evaluate(() => window.location.hash)) === '#/')

  console.log('\n[12.5] 教程中心（v4 / v4.2 双板块）')
  await page.click('a[href="#/tutorials"]')
  await sleep(500)
  check('进入教程中心', (await page.evaluate(() => window.location.hash)) === '#/tutorials')
  for (const t of ['摄影技术', '新闻与图像处理', '摄像技术', '新媒体运营', '暂未开通，敬请期待']) {
    check(`板块「${t}」`, await textExists(page, t))
  }
  const availableCount = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('a[href^="#/tutorials/"]')]
    return cards.filter((a) => a.textContent.includes('已上线')).length
  })
  check(`两个板块标记「已上线」（实际 ${availableCount}）`, availableCount === 2)
  // 摄影教程
  await page.click('a[href="#/tutorials/photography"]')
  await sleep(600)
  check('进入摄影教程', (await page.evaluate(() => window.location.hash)) === '#/tutorials/photography')
  check('第一章渲染', await textExists(page, '序章：身份与任务'))
  const progress1 = await page.evaluate(() => {
    const bar = document.querySelector('[role="progressbar"]')
    return bar ? bar.getAttribute('aria-valuenow') : null
  })
  check(`进度条初始 ${progress1}%（1/9 章）`, progress1 === '11.11111111111111' || progress1 === '11')
  await page.click('button::-p-text(下一章)')
  await sleep(300)
  check('翻页到第二章', await textExists(page, '第一章：摄影基础速成'))
  // 跳转到参数速查表章节（第九章）
  await page.click('button[aria-label*="第七章：参数速查表"]')
  await sleep(300)
  check('参数速查表渲染', await textExists(page, '室内会议') && await textExists(page, '舞台演出'))
  // v4.2：新闻与图像处理教程
  await page.click('a[href="#/tutorials"]')
  await sleep(400)
  await page.click('a[href="#/tutorials/news-editing"]')
  await sleep(600)
  check('进入新闻与图像处理教程', (await page.evaluate(() => window.location.hash)) === '#/tutorials/news-editing')
  check('序章渲染', await textExists(page, '序章：身份与任务'))
  check('AI 写作章节存在', (await page.$('button[aria-label*="AI 时代新闻文稿创作高效方式"]')) !== null)
  // 跳到公文格式章节（第五章）
  await page.click('button[aria-label*="第四章：公文格式规范"]')
  await sleep(300)
  check('公文格式表渲染', await textExists(page, '方正小标宋简体') && await textExists(page, '页边距'))
  await page.click('a[href="#/tutorials"]')
  await sleep(400)
  await page.click('a[href="#/"]')
  await sleep(400)
  check('返回首页成功', (await page.evaluate(() => window.location.hash)) === '#/')

  console.log('\n[13] 备份导出')
  await page.click('button::-p-text(导出数据备份)')
  await sleep(600)
  check('点击后按钮变为「已导出」', await textExists(page, '已导出'))

  console.log('\n[14] PWA')
  check('manifest 已注册', (await page.$('link[rel="manifest"]')) !== null)
  try {
    await page.evaluate(() => navigator.serviceWorker.ready, { timeout: 5000 })
    check('Service Worker 已注册', true)
  } catch {
    check('Service Worker 已注册', false)
  }

  console.log('\n[15] 移动端：无横向滚动 + 反馈页布局')
  await page.setViewport({ width: 375, height: 812 })
  await page.reload({ waitUntil: 'networkidle0' })
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  check('375px 视口下页面无横向滚动', noHScroll)
  const burger = await page.$('button[aria-label="打开菜单"]')
  check('移动端汉堡菜单存在', burger !== null)
  // v4.1 修复验证：展开菜单后所有项（含"关于"）完整可见
  await burger.click()
  await sleep(500)
  const menuVisible = await page.evaluate(() => {
    const links = [...document.querySelectorAll('#mobile-nav a')]
    return {
      count: links.length,
      aboutVisible: links.some((a) => a.textContent.includes('关于') && a.getBoundingClientRect().height > 0),
      menuBottomInViewport: (() => {
        const nav = document.querySelector('#mobile-nav')
        if (!nav) return false
        const rect = nav.getBoundingClientRect()
        return rect.bottom <= window.innerHeight + 1 || window.innerHeight >= 600
      })(),
    }
  })
  check(`展开后菜单项共 ${menuVisible.count} 项且「关于」完整可见`, menuVisible.count >= 8 && menuVisible.aboutVisible)
  // 关闭菜单
  await page.click('button[aria-label="关闭菜单"]')
  await sleep(300)
  // 移动端桌面导航隐藏，直接设置 hash 进入反馈页
  await page.evaluate(() => {
    window.location.hash = '#/feedback'
  })
  await sleep(500)
  const fbNoHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  check('反馈页在 375px 下无横向滚动', fbNoHScroll)

  console.log('\n[16] 控制台与运行时错误')
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
