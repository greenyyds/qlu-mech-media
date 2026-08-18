# 机械工程学部全媒体工作台

齐鲁工业大学机械工程学部全媒体部门内部工具网站。聚合常用链接、本周任务规划、**AI 新闻初稿生成**（智谱 GLM-4-Flash 免费模型）、值班表、风采展示与意见反馈，视觉风格参照苹果官网 / 蔚来官网的极简设计语言。

- 技术栈：**Vite 5 + React 18 + Tailwind CSS v4**（静态前端 + 可选云端数据层）
- 数据：**双模式**——配置腾讯云 CloudBase 后数据全员共享（推荐）；未配置时降级 localStorage 本机模式
- 部署：GitHub Pages 自动部署（GitHub Actions），**手机可添加到主屏幕**（PWA）

---

## 一、功能清单

| 模块 | 说明 |
| --- | --- |
| 公告横幅 | 可关闭的通知条，关闭状态本机记忆 |
| 顶部导航 | 毛玻璃（`blur(20px)`）+ 滚动阴影 + 汉堡菜单 + **主题切换**（浅色/深色/跟随系统） |
| Hero 区 | 大标题 + 副标题 + 双行动按钮；柔和光斑背景 |
| **风采展示** | 首页全宽自动轮播（宇树官网风格）：4 张部门活动照片、自动播放、箭头/圆点/键盘切换、触摸滑动 |
| 常用链接 | 媒体链接 ×3 + 工具链接 ×2，新窗口打开 |
| **AI 新闻初稿生成** | **已接入智谱 GLM-4-Flash（免费）**：11 项选项（新闻类型 / 事件要点 / 时间 / 地点 / 人物 / 参考文章链接 / 风格倾向 / 篇幅 / 标题风格 / 关键词 / 摘要开关）、**流式打字机输出**、复制全文、重新生成、最近生成记录（本地保存 5 条） |
| 任务规划 | 三列看板（待办 / 进行中 / 已完成），添加 / 编辑 / 删除 / 拖拽换列 / 进度条；**云端共享**（或本地模式） |
| 值班表 | 页面内可编辑（每日 ≤4 人），**云端共享**（或本地模式），可重置示例 |
| **意见反馈页** | `#/feedback` 二级页面：技术/设计 + 工作/交际两分类、匿名或实名、公开列表（分类筛选）、**预留密码保护开关** |
| **数据备份** | 页脚"导出数据备份"按钮，一键下载任务/值班表/反馈 JSON |
| 页脚 | 版权、快速导航、校 LOGO、数据状态说明 |
| **PWA** | 可添加到手机主屏、离线可用、独立图标、新版本更新提示 |

## 二、快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建到 dist/
npm run preview    # 本地预览生产构建 http://localhost:4173
npm run smoke      # 冒烟测试（渲染/任务/轮播/反馈/深色/PWA/移动端）
npm run ai:test    # AI 真实生成端到端测试（消耗少量免费额度）
```

## 三、数据共享（CloudBase）——让值班表与任务"真正实用"

### 原理

项目为**双模式数据层**（`src/services/*`，接口签名不变）：

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| 云端共享 | `src/config/cloudConfig.js` 的 `envId` 已填写 | 任务 / 值班表 / 反馈读写腾讯云 CloudBase，**所有人看到同一份数据**；页面上任务与值班表头部显示绿色「云端共享」徽标 |
| 本地模式 | `envId` 为空（默认） | 数据存各人浏览器 localStorage，仅本机可见（v2 行为），显示「本机数据」徽标 |
| 离线降级 | 云端配置了但网络失败 | 自动回退本地数据并显示「离线模式」徽标，写操作会明确报错（不静默丢失） |

### 接入步骤（约 10 分钟，一次性）

1. 登录腾讯云控制台 → 搜索 **"云开发 CloudBase"** → 按提示开通
2. 创建环境：免费体验环境即可，区域选上海/广州 → 记下**环境 ID**（形如 `xxx-1a2b3c`）
3. 把环境 ID 填入 `src/config/cloudConfig.js` 的 `envId`（或构建时注入 `VITE_CLOUDBASE_ENV_ID`，需代码支持——当前以配置文件为准）
4. 在 CloudBase 控制台为三个集合配置**安全规则（所有用户可读可写）**：
   - 数据库 → 集合 `tasks`、`roster`、`feedback`（首次运行时自动创建）
   - 每个集合的"权限设置"选**自定义安全规则**，填入：
     ```json
     { "read": true, "write": true }
     ```
5. 重新构建部署，全员即可共享

### 数据模型

| 集合 | 文档结构 |
| --- | --- |
| `tasks` | `{ title, assignee, deadline, tag, progress, status, createdAt }` |
| `roster` | `{ weekStart, days: [{ iso, weekday, monthDay, members }] }`（每周一份） |
| `feedback` | `{ category: 'tech'\|'daily', name, content, createdAt }` |

### ⚠️ 风险与说明（请知悉）

- **公开读写**：无登录系统，任何知道链接的人都能读写云端数据 → 页脚已提供**一键备份导出**；请勿外传链接
- **免费额度**：体验环境约 3000 资源点/月，日常查询消耗极小；超额会暂停服务，届时可降级本地模式（清空 envId 即可）或升级
- **实名是"君子协定"**：反馈页的姓名由用户自填，无法核验；正式实名需接入登录系统（后续迭代方向）
- **意见反馈密码**：`src/config/feedbackConfig.js` 的 `protected` 置 `true` 并填入密码哈希后，反馈页需密码进入（前端校验，防君子不防小人）

## 四、AI 新闻生成说明

### 模型与配置

- 模型：智谱 **GLM-4-Flash**（官方免费，已实测；API 支持浏览器直连）
- 配置：`src/config/aiConfig.js`（Key 公开可见，**请只用免费额度 Key**）
- 更换模型：改 `model / baseUrl / apiKey`（OpenAI 兼容）

### 生成规则

- 只使用用户提供的信息，未提供的输出【】占位符，不编造事实
- 篇幅：短讯 300-400 / 标准 600-800 / 长文 1000+ 字
- 参考文章链接受跨域限制无法自动抓取正文，页面已提示粘贴关键内容

### 扩展方式

- 新增选项：`src/data/newsToolConfig.js`（七种控件类型自动渲染）
- 生成逻辑：`src/services/newsService.js`

## 五、目录结构

```
├── index.html / vite.config.js / .github/workflows/deploy.yml
├── public/                        # favicon + PWA 图标
├── scripts/                       # smoke-test / ai-e2e-test / capture-screens / package-deploy
└── src/
    ├── config/
    │   ├── aiConfig.js            # AI 模型与 Key
    │   ├── cloudConfig.js         # ★ CloudBase 环境开关（envId）
    │   └── feedbackConfig.js      # 反馈页密码预留
    ├── data/                      # links / newsToolConfig / roster / taskConfig / gallery
    ├── services/                  # 数据层（双模式：云端优先 + 本地降级）
    │   ├── cloudService.js        # CloudBase 封装（SDK 动态加载）
    │   ├── taskService.js / dutyService.js / feedbackService.js / backupService.js
    │   └── newsService.js         # AI 流式生成
    ├── hooks/ utils/              # useTheme / useReveal / hash 路由 / 日期工具
    └── components/                # 14 个组件（含 Gallery 轮播、FeedbackPage、DataStatusBadge）
```

## 六、部署

**当前方案：GitHub Pages（免备案，已上线）** —— 操作卡见 **[docs/DEPLOY-GITHUB-PAGES.md](docs/DEPLOY-GITHUB-PAGES.md)**

- **正式链接：`https://greenyyds.github.io/qlu-mech-media/`**
- 自动部署：push 到 main → GitHub Actions 构建发布（约 1 分钟）
- 长期方案：学校子域名（如 `media.qlu.edu.cn`）绑定后代码零改动；备选 EdgeOne Pages（部署包 `docs/deploy/` 已就绪）

## 七、主题（深色模式）

- 三态：跟随系统 / 浅色 / 深色（导航栏循环切换，持久化，首帧防闪烁）
- 颜色经 CSS 变量（`--c-*`）全站令牌化

## 八、已知事项与待确认

| 项 | 状态 |
| --- | --- |
| CloudBase 共享 | ✅ **已上线生效**（双实例实测通过：跨设备任务/值班表/反馈实时共享） |
| 风采照片文案 | 通用文案（"机械工程学部 · 活动风采"+拍摄日期），想换在 `src/data/gallery.js` |
| 公众号链接 | 暂指向学部官网"新媒体平台"页（`src/data/links.js`） |
| 值班表/公告/任务示例 | 示例数据，改 `src/data/roster.js`、`NoticeBanner.jsx` |
| AI Key | 免费 Key 已内置；被滥用请到智谱平台换新（`src/config/aiConfig.js`） |
| 本地网络访问 GitHub 偶发失败 | 属网络环境问题，换网络即可；网站本身正常 |

## 九、验收对照（v3）

- ✅ 数据共享：双模式架构（云端/本地/离线降级），状态徽标明确提示
- ✅ 风采轮播：4 图全宽自动播放、箭头/圆点/键盘/触摸切换、图片压缩后共 946KB
- ✅ 意见反馈：二级页路由、两分类、匿名/实名、公开列表、密码预留
- ✅ 备份导出：一键下载 JSON
- ✅ 冒烟测试 50 项全绿、构建零报错、控制台零报错
- ✅ 性能：SDK 动态加载，本地模式主包 234KB（gzip ~68KB）
