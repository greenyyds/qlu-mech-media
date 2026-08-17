# 机械工程学部全媒体工作台

齐鲁工业大学机械工程学部全媒体部门内部工具网站。聚合常用链接、本周任务规划、**AI 新闻初稿生成**（智谱 GLM-4-Flash 免费模型）、值班表，视觉风格参照苹果官网 / 蔚来官网的极简设计语言。

- 技术栈：**Vite 5 + React 18 + Tailwind CSS v4**（无后端，静态站点）
- 数据：任务 / 值班表使用 `localStorage` 本地持久化，**数据层与 UI 分离**，可无缝替换为 API / 云数据库
- 部署：GitHub Pages 自动部署（GitHub Actions），**手机可添加到主屏幕**（PWA）

---

## 一、功能清单

| 模块 | 说明 |
| --- | --- |
| 公告横幅 | 可关闭的通知条，关闭状态本机记忆 |
| 顶部导航 | 毛玻璃（`blur(20px)`）+ 滚动阴影 + 汉堡菜单 + **主题切换**（浅色/深色/跟随系统） |
| Hero 区 | 大标题 + 副标题 + 双行动按钮；柔和光斑背景 |
| 常用链接 | 媒体链接 ×3 + 工具链接 ×2，新窗口打开 |
| **AI 新闻初稿生成** | **已接入智谱 GLM-4-Flash（免费）**：11 项选项（新闻类型 / 事件要点 / 时间 / 地点 / 人物 / 参考文章链接 / 风格倾向 / 篇幅 / 标题风格 / 关键词 / 摘要开关）、**流式打字机输出**、复制全文、重新生成、最近生成记录（本地保存 5 条） |
| 任务规划 | 三列看板（待办 / 进行中 / 已完成），添加 / 编辑 / 删除 / 拖拽换列 / 进度条；`localStorage` 持久化；预置 6 条示例任务 |
| 值班表 | **页面内可编辑**（每日 ≤4 人），本地持久化，可重置示例 |
| 页脚 | 版权、快速导航、校 LOGO |
| **PWA** | 可添加到手机主屏、离线可用、独立图标、新版本更新提示 |

## 二、快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建到 dist/
npm run preview    # 本地预览生产构建 http://localhost:4173
npm run smoke      # 冒烟测试（渲染/控制台/任务/拖拽/深色/值班表/PWA/移动端）
npm run ai:test    # AI 真实生成端到端测试（消耗少量免费额度）
```

## 三、AI 新闻生成说明

### 模型与配置

- 模型：智谱 **GLM-4-Flash**（官方免费，已实测可用；API 支持浏览器直连，无需代理）
- 配置文件：`src/config/aiConfig.js`
  - 默认内置部门 Key；也可通过环境变量注入：`VITE_GLM_API_KEY=xxx npm run build`
- ⚠️ **安全须知**：静态站的前端代码任何人可见，内置 Key 会被公开。**请只使用免费额度 Key，不要使用付费账号 Key**。若 Key 被滥用，到 [open.bigmodel.cn](https://open.bigmodel.cn) 重新生成并替换。
- 更换模型：改 `aiConfig.js` 的 `model / baseUrl / apiKey`（OpenAI 兼容接口，可换任意兼容服务）

### 生成规则（提示词内置）

- 只使用用户提供的信息；未提供的时间/地点/人物/数字一律输出【】占位符，**不编造事实**
- 篇幅：短讯 300-400 字 / 标准 600-800 字 / 长文 1000 字以上
- 风格：官方正式 / 生动活泼 / 平实客观；标题支持正式/吸睛/问句式/带副标题
- 参考文章链接受浏览器跨域限制无法自动抓取正文，页面已提示用户把关键内容粘贴到"事件要点与背景"

### 扩展方式

- 新增选项：编辑 `src/data/newsToolConfig.js`（支持 select / textarea / text / date / chips / url-list / switch 七种控件，随配置自动渲染）
- 生成逻辑：`src/services/newsService.js`（流式 SSE 解析、JSON 结构化解析、历史记录）

## 四、目录结构

```
├── index.html                 # 入口（含首帧主题防闪烁脚本）
├── vite.config.js             # base:'./' + PWA 配置
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
├── public/                    # favicon + PWA 图标
├── scripts/
│   ├── smoke-test.mjs         # 冒烟测试（36 项）
│   ├── ai-e2e-test.mjs        # AI 真实生成测试
│   └── capture-screens.mjs    # 截图
└── src/
    ├── config/aiConfig.js     # AI 模型配置（Key 在此）
    ├── data/                  # 静态配置：links / newsToolConfig / roster / taskConfig
    ├── services/              # 数据层（UI 不直接操作 localStorage / fetch）
    │   ├── taskService.js     # 任务 CRUD（localStorage，可换 API）
    │   ├── newsService.js     # AI 流式生成 + 历史
    │   └── dutyService.js     # 值班表（localStorage，可换 API）
    ├── hooks/                 # useReveal / useTheme
    ├── utils/date.js          # 本周范围 / 日期格式化
    └── components/            # 模块化组件（12 个）
```

## 五、部署

**当前方案：GitHub Pages（免备案，立即可用）** —— 操作卡见 **[docs/DEPLOY-GITHUB-PAGES.md](docs/DEPLOY-GITHUB-PAGES.md)**

- 目标链接：`https://greenyyds.github.io/qlu-mech-media/`
- 自动部署流水线已配置（`.github/workflows/deploy.yml`，push 到 main 即发布）

**长期方案：学校子域名**（最稳最合规，免重新备案）—— 申请学校已备案主域名下的子域（如 `media.qlu.edu.cn`），绑定到 EdgeOne Pages / COS / 校内托管，代码零改动。备选：自有域名备案后绑 EdgeOne Pages（见 [docs/DEPLOY-EDGEONE.md](docs/DEPLOY-EDGEONE.md)，部署包 `docs/deploy/qlu-mech-media-v2.zip` 已就绪）。

**其他平台**：`base: './'` 已配置，`dist/` 可直接部署到 Vercel / Netlify / 任意静态托管。

## 六、数据层说明（替换指南）

所有读写都经 `src/services/*`，组件不直接操作 `localStorage`。接口均返回 Promise，与后端 API 形态一致：

- `taskService`：`listTasks / createTask / updateTask / deleteTask / moveTask / resetTasks`
- `dutyService`：`listWeek / updateDay / resetToDefault`
- `newsService`：`streamDraft / parseDraft / saveHistory / listHistory / clearHistory`

替换为后端时，仅修改 service 内部实现（改为 `fetch('/api/...')` 等），方法名与返回结构不变，UI 零改动。

## 七、主题（深色模式）

- 三态：跟随系统 / 浅色 / 深色（导航栏按钮循环切换，选择持久化）
- 颜色经 CSS 变量（`src/index.css` 的 `--c-*`）全站令牌化，切换无闪烁（首帧脚本防 FOUC）
- 状态栏配色（`theme-color`）随主题同步

## 八、已知事项与待确认

| 项 | 状态 |
| --- | --- |
| 学部徽章 | 已用于导航 / PWA 图标（由 `OIP-C.webp` 生成）。请确认视觉效果，不满意可直接替换 `src/assets/dept-logo.webp` 并重新生成图标（`public/pwa-*.png`） |
| 公众号链接 | 暂指向学部官网"新媒体平台"页，建议替换为公众号主页/二维码（`src/data/links.js`） |
| 值班表/公告/任务示例 | 均为示例数据，可在 `src/data/roster.js`、`NoticeBanner.jsx` 修改 |
| 联系方式 | 页脚为占位文案，确认真实邮箱后替换 |
| AI Key | 已内置免费 Key；如被滥用请到智谱平台重新生成（`src/config/aiConfig.js`） |
| QUIC 环境说明 | 本机测试时若遇 AI 偶发 `ERR_CONNECTION_CLOSED`，属个别网络对 HTTP/3 不稳定，服务已加自动重试；正常网络无影响 |

## 九、验收对照（v2）

- ✅ 移动端：375px 无横向滚动、汉堡菜单、触控目标 ≥44px、PWA 可安装、离线可用
- ✅ 公网链接：GitHub Actions 自动部署，`https://<用户名>.github.io/qlu-mech-media/`
- ✅ AI 生成：真实调用成功（流式 135 分块实测）、必填校验、复制/重新生成/历史、错误提示
- ✅ 深色模式：三态切换、全站令牌化、AA 对比度复检
- ✅ 值班表可编辑：增删成员、刷新不丢、重置示例
- ✅ 冒烟测试 36 项全绿、AI 端到端测试通过、构建零报错
