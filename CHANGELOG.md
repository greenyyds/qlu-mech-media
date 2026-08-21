# 变更日志（CHANGELOG）

> 记录每一次版本迭代的变更、动机与踩坑，供后续维护者（含新 AI）快速了解项目演进。
> 格式：版本号 — 日期 — 变更内容。

---

## v1.0.0 — 初始搭建（首个可部署版本）

**新增**
- Vite 5 + React 18 + Tailwind CSS v4 项目脚手架（`base: './'` 相对路径，可部署任意静态托管）
- 单页滚动布局：公告横幅 / 毛玻璃导航（汉堡菜单）/ Hero / 常用链接（媒体 3 + 工具 2）/ 新闻初稿工具（空状态预留）/ 任务看板三列（增删改 + HTML5 拖拽 + localStorage 持久化 + 6 条示例任务）/ 值班表（静态展示）/ 页脚
- 数据层与 UI 分离：`src/services/taskService.js`（Promise 接口，可替换后端）
- 冒烟测试 `scripts/smoke-test.mjs`（26 项，puppeteer-core 复用本机 Edge）

**关键决策**
- 纯静态站（无后端）：部门内部工具，零成本部署优先
- 设计语言参照苹果/蔚来官网（`#f5f5f7` 背景、24px 圆角、毛玻璃、系统字体栈、克制动效）

## v2.0.0 — AI 新闻工具 + PWA + 深色模式

**新增**
- 新闻初稿生成工具接入**智谱 GLM-4-Flash**（官方免费）：11 项选项（新闻类型/事件要点/时间/地点/人物/参考文章链接/风格倾向/篇幅/标题风格/关键词/摘要开关）、SSE 流式打字机输出、JSON 结构化解析、复制全文、重新生成、最近生成历史（localStorage 5 条）
- PWA：`vite-plugin-pwa`，添加到主屏 / 离线可用 / 192/512/maskable 图标 / 新版本更新提示
- 深色模式：跟随系统 + 手动三态切换，颜色令牌化（`--c-*` CSS 变量），首帧防闪烁
- 值班表可编辑（每天 ≤4 人，localStorage）

**关键决策**
- AI Key 前端直连（免费 Key 公开可见，方案经确认；换取零后端架构）
- Key 放 `src/config/aiConfig.js`，支持 `VITE_GLM_API_KEY` 构建注入

**踩坑**
- 本机网络对 HTTP/3(QUIC) 不稳导致 AI 偶发断连 → 服务层自动重试一次 + 测试加 `--disable-quic`
- Windows 下 Vite 文件监听偶发崩溃（chokidar）→ 属环境问题，重启即可

## v2.5.0 — 部署上线（GitHub Pages）

**变更**
- 尝试 EdgeOne Pages（国内免备案）→ 遇"必须备案域名"政策，放弃
- Gitee Pages 已停服，排除
- 最终：**GitHub Pages 上线**（https://greenyyds.github.io/qlu-mech-media/），GitHub Actions 自动部署（push → 构建 → 发布）
- 仓库：`greenyyds/qlu-mech-media`

**踩坑**
- PowerShell `Compress-Archive` 生成 zip 内部路径用反斜杠 → EdgeOne 拒绝上传 → 用 .NET ZipArchive 重写 `scripts/package-deploy.ps1`（强制正斜杠 + 自检）
- GitHub Pages 启用需手动设置 Source=GitHub Actions；部署 503 为 GitHub 服务端临时故障，重试即可

## v3.0.0 — 数据共享（CloudBase）+ 风采展示 + 意见反馈

**新增**
- **双模式数据层**：`src/config/cloudConfig.js` 的 `envId` 决定云端共享（CloudBase 文档数据库）或本地模式（localStorage）；云端故障自动降级本地（橙色"离线模式"徽标），写入失败同样降级不丢数据
- 数据模型：`tasks`（任务）/ `roster`（值班表整周单文档）/ `feedback`（意见反馈）三个集合，公开读写
- **风采展示**：首页全宽自动轮播（宇树官网风格），4 张 3:2 部门活动照片（压缩 30MB→946KB），箭头/圆点/键盘/触摸切换
- **意见反馈页**（`#/feedback` hash 路由二级页）：技术/设计 + 工作/交际两分类、匿名/实名、公开列表（倒序+筛选）、密码预留开关（`src/config/feedbackConfig.js`）
- 备份导出：页脚一键下载 JSON（任务+值班表+反馈）
- 数据状态徽标（云端共享/本机数据/离线模式）+ SDK 动态加载（本地模式主包仅 234KB）

**关键决策**
- 无登录系统的公开读写（部门内部工具 + 备份兜底，方案经确认）
- 云端重新开始（不迁移本地数据）
- 意见反馈密码为"防君子"轻量保护（前端校验）

**踩坑**
- **环境数据库类型必须选"文档数据库(MongoDB)"**——误选 PostgreSQL 后前端文档数据库 API 全部不可用（报 "no document database instance"），需重建环境
- Web 安全域名 API 仅接受正式域名（`localhost:5173` 带端口被拒）且免费套餐部分接口受限
- API 密钥用完即删（用户已实践两次密钥轮换）
- PowerShell 字符串替换时 `\r\n` 被写入字面文本 → JS 语法错误（替换文本需用真实换行）

## v3.1.0 — 离线自动恢复

**变更**
- 离线模式自动恢复：每 30 秒探测云端，恢复后自动切回"云端共享"并刷新数据（`cloud-recovered` 事件 + 状态订阅 `useDataStatus`）
- 反馈页新增数据状态徽标
- 冒烟测试适配双模式断言（云端模式无预置任务为正确行为）

## v3.2.0 — 体验修复（乐观更新 / 离线诊断 / 图片提速）

**变更**
- **任务看板 + 值班表乐观更新**：操作瞬间本地 UI 立即生效，云端同步放后台，失败自动回滚（消除 2 次网络往返的卡顿）
- **离线诊断提示**：云端异常时导航下方显示原因横幅（匿名登录未开 / 集合缺失 / 网络或安全域名问题），便于自愈排查
- **风采图片 WebP 化**：946KB → 369KB（省 61%），新增 `scripts/convert-gallery-webp.mjs` 可复用
- 新增 `scripts/convert-gallery-webp.mjs`、离线横幅组件 `OfflineNotice`

## v3.2.1 — 云端共享彻底修复（Web 安全域名）

**问题**：线上长期"离线模式"（云端共享未生效）。

**根因链（完整排查记录）**
1. 线上请求 `api.tcloudbasegateway.com/auth/v1/signin/anonymously` 被 **CORS 拦截**（`net::ERR_FAILED`）
2. 原因：CloudBase **Web 安全域名（CORS 白名单）未配置**
3. 此前尝试用 TCB SDK `CreateAuthDomain` API 添加 → 带 `https://` 前缀，格式错误（官方要求**不含协议前缀**），且该 API 与实际生效的 CORS 白名单存在差异
4. 本地 `localhost` 测试通过的原因：CloudBase 默认放行 localhost（开发便利），生产域名严格校验

**修复**（官方 CLI 标准操作，见 [docs.cloudbase.net/cli-v1/cors](https://docs.cloudbase.net/cli-v1/cors)）
```bash
npm i -g @cloudbase/cli
tcb login --apiKeyId <SecretId> --apiKey <SecretKey>
tcb cors add greenyyds.github.io -e <envId>   # 不带协议前缀；交互确认输入 y
tcb cors list -e <envId>                       # 验证 Enabled
tcb logout                                     # 用完即清理
```

**验证**：线上站徽标「云端共享」、控制台 0 错误、双实例共享测试通过。

**沉淀**：`docs/CLOUDBASE-SETUP.md` 已更新正确格式与 CLI 方式；API 密钥坚持"用完即删"原则（本次已轮换 3 次密钥）。

## v3.3.0 — AI 模型升级（glm-4-flash → glm-4.5-flash）

**变更**
- 新闻工具模型升级：`glm-4-flash` → **`glm-4.5-flash`**（官方免费模型，代际更新，文字性能更优）
- 实测依据：同一提示词对比 3 个免费模型——
  - `glm-4.5-flash`：**3/3 稳定成功、JSON 格式合规、无限流** ← 选定（官方免费文档：docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash）
  - `glm-4.7-flash`：免费但**访问量过大频繁限流（429）**、篇幅遵循度差（329/568 字 vs 要求 600-800），待缓解后可切换
  - `glm-4-flash`（旧）：稳定但代际旧
- 配置注释更新：含模型选择说明与切换方式；`scripts/compare-glm-models.mjs` 保留为模型对比工具

**已知限制**
- 本次改动受沙箱子进程限制（esbuild spawn EPERM），本地构建/冒烟测试未能执行；模型可用性已通过 Node 直连 API 实测（3/3），线上由 GitHub Actions 云端构建部署验证

---

## v4.3.0 — 常用链接迁移二级页 + 导航更名

**变更**
- 导航栏「媒体链接」更名「链接」，全站（导航/页脚/移动菜单）指向新二级页 #/links`r
- 「常用链接」模块从首页完全移除（不留入口卡片），首页更精简；二级页保留媒体/工具两组与品牌色卡片
- 新增 LinksPage.jsx（QuickLinks 迁移）；冒烟测试适配（首页无模块、二级页链接断言）

---

## v4.2.0 — 教程中心新增：新闻与图像处理板块

**变更**
- 教程中心第二板块「新闻与图像处理」上线（#/tutorials/news-editing），内容源自部门 docx（3598 字，忠于原文）：序章/身份任务、AI 时代新闻文稿创作（提示词示例）、新闻写作要点、插图编辑与 AI 工具（醒图抠像工作流）、公文格式规范（表格）、常见问题、口诀
- 抽取通用 TutorialReader.jsx 分步引导阅读器，各板块教程页变为数据驱动（后续新增板块只需数据 + 薄包装）
- 新增操作截图素材 2 张（公众号页面/醒图抠像）转 WebP（127KB）
- 冒烟测试适配双板块（已上线 x2、公文表渲染断言）

---

## v4.1.1 — 风采轮播日期修正

**变更**
- 第一张日期修正为 2025-10-9，第二张修正为 2024-5-12（此前误用文件名导出日期 2026-08-18；拍摄日期以部门确认为准，维护入口：src/data/gallery.js）

---

## v4.1.0 — 移动端菜单修复

**变更**
- 汉堡菜单由固定最大高度（max-h-96，384px 截断第 8 项「关于」）改为 grid-rows 自适应高度动画，菜单项增减均完整显示
- 冒烟测试新增断言：展开后 8 项全部可见（含「关于」）

---

## v4.0.0 — 体验修复 + AI 双模式 + 工具链接升级 + 内部教程中心

**变更**
1. **Switch 组件统一重构**（Bug 修复）：新建 `Toggle.jsx` 共用组件，flex 两端对齐 + 内边距替代 translate 位移，彻底修复新闻工具摘要开关、反馈页匿名开关的圆点越界/方向问题；冒烟测试新增开关断言（状态翻转 + 圆点在轨道内）
2. **AI 模型双模式**（Bug 修复 + 升级）：`aiConfig` 重构为 `aiModels`（快速 = glm-4-flash / 深度 = glm-4.5-flash，默认深度）；选项面板新增模式选择，模块徽标/预览区动态显示型号（修复此前 UI 写死"GLM-4-Flash"的标识不同步问题）；历史记录保存所用模式
3. **工具链接升级**：新增醒图（retouchpics.com）、秀米（xiumi.us）；品牌色方案——醒图莫兰迪绿、秀米浅粉红、DeepSeek 深灰蓝、剪映黑色（含深色模式变体）
4. **内部教程中心**（大升级）：
   - `#/tutorials` 四板块（摄影技术 / 新闻与图像处理 / 摄像技术 / 新媒体运营），三板块"暂未开通，敬请期待"
   - `#/tutorials/photography` 分步引导式教程：九章节（身份任务/基础速成/新闻要义/后期/拍摄细则/交付规范/错误清单/参数速查表/口诀），章节进度条 + 翻页 + 键盘 + 章节跳转；内容源自用户提供的 docx（3447 字，忠于原文）
   - 素材压缩：3 张图 13.9MB → 200KB WebP；新增 `scripts/convert-tutorial-assets.mjs`
   - 入口：导航栏 + 首页入口卡片 + 页脚
5. **迭代日志规范落地**：本次迭代同步更新 CHANGELOG / README / MAINTENANCE（生命周期保障）

**关键决策**
- 模型模式默认"深度"（glm-4.5-flash 实测 3/3 稳定）；glm-4.7-flash 因限流严重暂缓（配置注释已记录，缓解后可加选项）
- 教程文字忠于 docx 原文，仅做排版化拆分；后续新增板块只需扩展 `src/data/tutorials.js`

**踩坑**
- FeedbackPage 替换 Toggle 时遗漏 import → `ReferenceError: Toggle is not defined`，冒烟测试 [12] 捕获并修复（测试价值验证）

---

## 版本速查

| 版本 | 主题 | 关键词 |
|---|---|---|
| v1.0.0 | 初始搭建 | 静态站、任务看板、空状态新闻工具 |
| v2.0.0 | 能力增强 | AI 生成、PWA、深色模式 |
| v2.5.0 | 部署上线 | GitHub Pages、Actions 自动部署 |
| v3.0.0 | 架构升级 | CloudBase 共享、风采轮播、反馈页 |
| v3.1.0 | 稳定性 | 离线自动恢复 |
| v3.2.x | 体验与修复 | 乐观更新、离线诊断、WebP 提速、Web 安全域名 |

## 未来方向（技术债清单）

- 学校子域名（如 `media.qlu.edu.cn`）：已备案主域名免重新备案，绑定后国内访问最稳
- 登录系统：反馈页实名核验、任务编辑权限区分（当前公开读写为临时方案）
- 任务模块增强：统计看板、JSON 导入（当前仅导出）
- 反馈密码升级：接入真实认证（当前前端校验仅为"防君子"）
