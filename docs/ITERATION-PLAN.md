# 迭代提示词：移动端 / 公网部署 / AI 新闻生成（v2）

> 本文件是第二轮迭代的完整需求定稿，执行时以此为准。
> 决策记录（2026-08 与部门确认）：GitHub Pages 部署 · 国内稳定访问优先 · 智谱 GLM-4-Flash（免费）· 前端直连 Key 可见 · 加 PWA · 新闻工具按完整选项集 · 深色模式 + 值班表可编辑。

---

## 一、迭代目标（三大主目标 + 两项顺带）

1. **移动端正常工作**：在现有响应式基础上补齐"真正的手机体验"——PWA（可添加到主屏幕、离线可用、独立图标），并修正真机细节（安全区、触控目标、视口高度）。
2. **公网可访问链接**：部署到 GitHub Pages，最终链接为语义化 URL：`https://<GitHub用户名>.github.io/qlu-mech-media/`（仓库名定为 `qlu-mech-media`），配置自动部署（GitHub Actions），让部门成员用手机浏览器或微信直接打开。
3. **AI 新闻初稿生成**：接入智谱 GLM-4-Flash（官方免费），选项面板包含 时间 / 地点 / 人物 / 参考文章链接 / 风格倾向 / 新闻类型 / 篇幅 / 标题风格 / 事件要点与背景 / 关键词 / 摘要开关，流式输出新闻初稿，可复制、可重新生成。
4. **深色模式**（顺带）：跟随系统 + 手动切换，全站色彩令牌化适配。
5. **值班表可编辑**（顺带）：页面内编辑值班成员，localStorage 持久化（走 service 层）。

明确不做：任务看板增强（统计/导出）、触屏长按拖拽（保持编辑弹窗改状态）。

---

## 二、基线（v1 已验收，不得回退）

- 极简视觉：`#f5f5f7` 背景、20–28px 圆角、毛玻璃导航（`blur(20px)`）、系统字体栈、`0.3s cubic-bezier(0.4,0,0.2,1)` 动效、卡片 hover 上浮 4px
- 任务看板增删改、拖拽换列、localStorage 持久化、数据层 `src/services/taskService.js` 独立
- 控制台零报错、375px 无横向滚动、WCAG AA 对比度、`aria-label`、键盘可导航
- 冒烟测试 `scripts/smoke-test.mjs` 26 项全过（迭代后需扩展并保持全绿）

---

## 三、模块 A：移动端 + PWA

**A1. PWA（vite-plugin-pwa）**
- 安装 `vite-plugin-pwa`，注册 Service Worker，缓存 app shell 与静态资源，支持离线打开
- manifest：名称"机械工程学部全媒体工作台"、短名称"全媒体工作台"、`theme_color #f5f5f7`、`background_color`、`display: standalone`
- 图标：由 `src/assets/dept-logo.webp`（474×474）生成 192/512 图标（可用 `@vite-pwa/assets-generator` 或手动放置转换后的 PNG；若徽章背景非透明，图标底色用 `#f5f5f7` 衬底）
- `start_url: ./`，`scope: ./`（与 `base: './'` 兼容，GitHub Pages 子路径可用）
- 新增更新提示：SW 更新后提示"新版本可用，点击刷新"（toast，克制样式）

**A2. 真机细节修正**
- 安全区：底部固定元素（如有）适配 `env(safe-area-inset-bottom)`
- 触控目标：所有可点元素高度 ≥ 44px（当前汉堡按钮 40px → 改 44px）
- 视口高度：使用 `100dvh` 替代 `100vh`（移动端地址栏伸缩问题）
- 触摸反馈：卡片/按钮 `active:scale-[0.98]` 轻微按压反馈（0.15s，尊重 reduced-motion）
- 微信内置浏览器打开时正常渲染（不做微信 JS-SDK，仅确保 CSS 兼容：`-webkit-` 前缀、无 ES2022+ 语法依赖或正确转译）

**A3. 验收**
- 真机（iOS Safari / Android Chrome / 微信内置浏览器）访问公网链接：布局正常、无横向滚动、可添加到主屏、断网后已访问页面可打开
- Lighthouse PWA 项通过（或人工核对清单）

---

## 四、模块 B：GitHub Pages 公网部署

**B1. 仓库与链接**
- 仓库名：`qlu-mech-media`（语义化；如需微调，最终 URL 同步变更为 `https://<用户名>.github.io/<仓库名>/`）
- 部署目标：`gh-pages` 分支（或 Actions 直接发布），最终 URL：`https://<GitHub用户名>.github.io/qlu-mech-media/`
- 保留 `base: './'`，全站相对路径（已验证兼容子路径）

**B2. 自动部署（GitHub Actions）**
- 新增 `.github/workflows/deploy.yml`：`on: push` 到 `main` → `npm ci` → `npm run build` → 上传 `dist/` 到 GitHub Pages（`actions/deploy-pages` 或 `peaceiris/actions-gh-pages`），并包含 PWA 产物（`workbox` 缓存清单、`manifest.webmanifest`、图标）
- 页脚/README 中更新最终链接与"部署流水线说明"

**B3. 国内访问预案（写明，不阻塞本次交付）**
- `github.io` 国内多数网络可直连；若所在网络 DNS 污染导致打不开，预案：仓库启用 GitHub Pages 后绑定 Cloudflare（免费、免备案）自定义域名或 `pages.dev` 中转，README 附录说明步骤

**B4. 交付**
- 本地生成完整部署包（`npm run build` 产物自检：`dist/manifest.webmanifest`、SW、图标存在）
- README 更新部署章节：仓库创建、`git push`、Actions 自动发布、开启 Pages 的步骤；并注明"推送后约 1 分钟生效"

---

## 五、模块 C：AI 新闻初稿生成（智谱 GLM-4-Flash）

**C1. 模型与接口**
- 模型：`glm-4-flash`（智谱开放平台 https://open.bigmodel.cn ，官方免费）
- 接口：OpenAI 兼容 `/chat/completions`，`baseURL https://open.bigmodel.cn/api/paas/v4`
- **第一步必须做 CORS 实测**：用 curl 模拟 `Origin` 请求 + 浏览器直连验证；若智谱侧允许跨域则前端直连；若被 CORS 拦截，预案（按序）：a) 检查是否可用 JSONP/无鉴权端点；b) 提示用户改用"自建 Cloudflare Worker 代理"（提供 worker 源码与部署步骤，Key 经 Worker 注入）；c) 换用硅基流动免费池（其 API 兼容 OpenAI）。CORS 结论写入 README

**C2. Key 处理（用户已确认：前端直连、Key 可见）**
- 配置入口：`src/config/aiConfig.js`，字段：`model`、`baseUrl`、`apiKey`、`temperature`、`maxTokens`
- Key 支持两种注入：直接写入配置文件（带醒目注释"该 Key 公开可见，请使用免费额度 Key，勿用付费账号 Key"）；或 `import.meta.env.VITE_GLM_API_KEY`（构建时注入，README 说明）
- 前端做输入保护：Key 不打印到控制台、不写入 localStorage

**C3. 选项面板（完整选项集）**
| 选项 | 控件 | 说明 |
| --- | --- | --- |
| 新闻类型 | select | 院系动态 / 活动报道 / 人物专访 / 成果喜报 / 会议新闻 / 通知解读 |
| 事件要点与背景 | textarea（必填） | 主题、事件经过、背景信息 |
| 时间 | 日期选择器 + 可选"待定" | 事件发生时间 |
| 地点 | text | 事件地点，可选 |
| 人物 | text（支持逗号分隔多人） | 涉及人物/职务，可选 |
| 参考文章链接 | 动态 URL 列表（可增删，≤5 条） | 附提示：受浏览器跨域限制，建议同时把关键内容粘贴进"事件要点" |
| 风格倾向 | chips 单选 | 官方正式 / 生动活泼 / 平实客观 |
| 篇幅 | select | 短讯（300–400 字）/ 标准（600–800 字）/ 长文（1000+ 字） |
| 标题风格 | select | 正式标题 / 吸睛标题 / 问句式标题 / 带副标题 |
| 关键词 | text | 可指定核心词，可选 |
| 摘要开关 | switch | 生成文首摘要（可关闭） |

- 选项配置继续走 `src/data/newsToolConfig.js`（配置驱动渲染，扩展方式不变，新增 `type: 'date' | 'chips' | 'url-list' | 'switch'` 控件渲染分支）

**C4. 生成流程**
- 校验：事件要点必填；未填时按钮禁用并提示
- `newsService.generateDraft()` 重构：组装系统提示词（新闻写作专家，中文，结构化要求）+ 用户消息（选项序列化），调用智谱 API
- **流式输出**：fetch + `ReadableStream` 解析 SSE `data:` 块，预览区打字机效果逐字渲染（`aria-live="polite"`）；同时保留完整文本供复制
- 输出结构：要求模型返回 JSON：`{ title, abstract?, lead, paragraphs[] }`；前端容错解析（剥离 markdown 代码块包裹），解析失败时回退为原文展示
- 交互：生成中按钮转 loading（禁用 + 文案"生成中…"）；完成后提供 **复制全文**（Clipboard API + 降级）与 **重新生成**（temperature 微调 0.7→0.8 变化性）；可选 **最近生成** 记录（localStorage，service 层，≤5 条，可清空）
- 错误处理：网络失败 / 限流 / 非 200 → 面板内错误提示（不弹窗），按钮恢复可用
- 深色面板样式沿用 v1（夜间渐变容器），新控件补齐 disabled/loading 态

**C5. 验收**
- 真实 Key 调用成功生成一篇结构完整新闻稿（三类篇幅各测一次）
- 必填校验、流式渲染、复制、重新生成、错误提示均可用
- 控制台无报错；生成过程不阻塞 UI 其他模块

---

## 六、模块 D：深色模式

- 策略：`prefers-color-scheme` 跟随系统 + 页面内手动切换（导航栏 moon/sun 按钮，存 localStorage，三态：系统/浅/深）
- 设计令牌扩展（`src/index.css` @theme 增加 dark 组）：
  - 背景 `#000` / `#1d1d1f`，卡片 `#1c1c1e` / `#2d2d30`，文字 `#f5f5f7`，次文字 `#a1a1a6`，边框 `rgba(255,255,255,0.12)`
  - 强调蓝保持 `#0071e3`（深色下可提亮为 `#2997ff` 用于文字）
  - 状态色在深色下的文字变体重新核对 AA
- Tailwind v4 `dark:` variant（class 策略，`:root` 挂 `dark` class），所有组件过一遍 dark 态；新闻工具深色面板在深色模式下微调（保持可辨识层次）
- 验收：切换后全站无刺眼对比/死黑、无漏改区块；刷新保持选择

---

## 七、模块 E：值班表可编辑

- 新增 `src/services/dutyService.js`（数据层分离原则，注释说明 localStorage→API 替换方式）：`listWeek()`、`updateDay(iso, members)`、`resetToDefault()`；默认数据仍来自 `src/data/roster.js`
- UI：值班表卡片右上角进入"编辑"模式（每格成员 chip 可删除、输入框添加成员回车确认）；"完成"退出编辑；"重置示例"恢复默认；数据存 localStorage，刷新不丢
- 编辑态样式克制（虚线边框 + 铅笔图标），`aria-label` 齐全
- 验收：编辑 → 刷新 → 数据保持；重置恢复示例；键盘可操作

---

## 八、数据层与代码规范（延续 v1，不放松）

- UI 组件不得直接操作 localStorage / 直接 fetch AI 接口，一律经 `src/services/*`
- 新增配置集中到 `src/data/*` 与 `src/config/aiConfig.js`
- 组件按功能拆分，注释说明"当前实现 / 替换方式"
- 全站无外部字体/图片依赖（PWA 图标与智谱 API 除外）

## 九、测试与验收总清单

1. `npm run build` 无报错；`dist/` 含 manifest、SW、图标
2. 冒烟测试扩展并全绿：新增 PWA 注册断言、深色模式切换断言、值班表编辑断言、新闻工具必填校验断言（AI 真实调用放手动清单，CI 中 mock）
3. 真机手动清单：iOS/Android/微信内置浏览器 × 公网链接 × 添加到主屏 × 离线打开
4. 公网链接 `https://<用户名>.github.io/qlu-mech-media/` 可访问，页面资源全 200
5. 三篇真实生成（短/标/长）人工核对：结构完整、无编造细节（涉及具体姓名/数字需人工确认）、文风符合所选风格

## 十、需要你配合的事项（执行时）

1. 提供 GitHub 用户名（或告知我仓库已创建好，由我给出 push 命令/由你 push）
2. 注册智谱开放平台并创建 **GLM-4-Flash 免费 Key**（约 2 分钟，README 会附注册步骤；也可先用占位 Key 完成开发，上线前填入）
3. 若 CORS 实测被拦截：选择"接受 Cloudflare Worker 代理方案"或"换硅基流动"

## 十一、交付物清单

- 完整项目代码（含 PWA、深色模式、值班表编辑、AI 模块）
- `.github/workflows/deploy.yml` 自动部署流水线
- 更新版 `README.md`（新功能说明、AI Key 配置与注册指南、CORS 结论、部署与国内访问预案、公网链接）
- 扩展后的冒烟测试脚本
- 真机验证记录（截图存入 `docs/screenshots/v2/`：深色模式、PWA 添加到主屏、移动端 AI 生成过程）
