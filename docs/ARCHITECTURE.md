# 架构文档（ARCHITECTURE）

> 本文件回答"为什么这么设计"，是维护与迭代的决策依据。
> 与 `README.md`（现状）、`MAINTENANCE.md`（怎么维护）、`CHANGELOG.md`（怎么演进）互补。

---

## 一、系统全景

```
┌────────────────────────────────────────────────────────────┐
│ 浏览器（PC / 手机 / PWA 添加到主屏）                          │
│  React 18 单页应用（hash 路由：#/ 前缀为二级页面）              │
│                                                              │
│  src/services/* 数据层（双模式）                              │
│   ├─ 云端模式：CloudBase SDK（动态加载）→ 腾讯云文档数据库      │
│   └─ 本地模式：localStorage（envId 为空或云端故障时）           │
└───────┬──────────────────────────────┬──────────────────────┘
        │ fetch（浏览器直连）           │ fetch（浏览器直连，SSE 流式）
        ▼                              ▼
  腾讯云 CloudBase               智谱 GLM-4-Flash API
  （匿名登录 + 公开读写）            （免费模型，Key 前端公开）
        ▲
        └── 部署：GitHub Pages（GitHub Actions 自动构建发布）
```

## 二、数据层双模式设计（核心机制）

**触发逻辑**（`src/services/cloudService.js` 统一管理状态）：
- `cloudConfig.envId` 非空 → 云端模式；为空 → 本地模式
- 云端读取失败 → 降级本地数据，状态 `offline`
- 云端写入失败 → 降级本地写入（不丢数据），状态 `offline`
- 离线时每 30 秒自动探测（App 层），恢复后广播 `cloud-recovered` 事件，各模块自动刷新

**为什么这样设计**：
- 部门成员网络环境差异大，必须保证"任何情况下可用"
- 状态徽标让使用者明确当前数据在哪，避免"以为共享了其实没有"的幻觉
- 接口签名不变（`listTasks/createTask/...`），未来替换后端 UI 零改动

**替换后端的方式**：只改 `cloudService.js` 内部实现（如换 REST API），各业务 service 与组件无感知。

## 三、关键设计决策记录（ADR）

| # | 决策 | 背景 | 影响 |
|---|---|---|---|
| 1 | 纯静态站 + 前端直连 AI | 部门工具零预算；国内部署受备案政策约束 | Key 公开可见（免费 Key 可接受）；无账号体系 |
| 2 | GitHub Pages 部署 | EdgeOne 需备案域名、Gitee Pages 停服、Vercel 国内不稳 | 免备案免费；国内个别网络偶发不通（学校子域名是长期方案） |
| 3 | CloudBase 文档数据库 | 免费额度、国内直连、免备案（数据库 API 非网站托管） | 需环境配置（匿名登录/安全域名/集合/规则），脚本已自动化 |
| 4 | 公开读写 + 备份导出 | 无登录系统下最简共享模式（经用户确认） | 数据可被外部篡改 → 页脚一键备份兜底 + "勿外传链接"提示 |
| 5 | 双模式数据层 | 云端配置未完成/故障时仍可用 | 复杂度可控（状态机仅三态） |
| 6 | SDK 动态导入 | 本地模式首屏不受 742KB SDK 拖累 | 主包 234KB，云端模式才加载 SDK chunk |
| 7 | hash 路由约定（`#/` 前缀） | 避免引入 react-router 依赖；主页锚点（#home 等）与二级页（#/feedback）不冲突 | 极简；多级路由需扩展 |
| 8 | 提示词内置"事实纪律" | AI 会编造姓名/数字，新闻稿场景不可接受 | 未提供信息输出【】占位，仍需人工核对 |
| 9 | 反馈页密码为前端校验 | 纯静态站无法真正鉴权 | "防君子"级别；正式方案待登录系统（见 CHANGELOG 技术债） |
| 10 | 乐观更新（UI 先行） | 云端免费套餐单次 200-500ms，两次往返造成明显卡顿 | 操作即时生效，云端后台同步，失败回滚；数据一致性以云端为准 |
| 11 | 离线原因诊断横幅 | "离线模式"含义模糊，成员不知原因无法自愈 | cloudService 记录错误并分类（匿名登录/集合/网络或安全域名），顶部横幅展示 |
| 12 | Web 安全域名用 CLI 配置 | TCB SDK 的 CreateAuthDomain 格式不兼容（带协议前缀） | 规范：`tcb cors add 域名 -e 环境ID`（不带协议前缀），仅控制台/CLI 可配 |

## 四、数据模型

| 集合/存储 | 结构 | 说明 |
|---|---|---|
| CloudBase `tasks` | `{ _id, title, assignee, deadline, tag, progress, status, createdAt }` | 任务看板 |
| CloudBase `roster` | `{ weekStart, days: [{ iso, weekday, monthDay, members }] }` | 每周一份文档，整周排班 |
| CloudBase `feedback` | `{ category: 'tech'\|'daily', name, content, createdAt }` | 意见反馈（name 空 = 匿名） |
| localStorage `qlu-mech-media:tasks:v1` 等 | 与上述同构 | 本地模式与降级路径 |

安全规则：三个集合均为 `{ "read": true, "write": true }`（公开读写）。

## 五、关键依赖

| 依赖 | 用途 | 备注 |
|---|---|---|
| react / react-dom 18 | UI 框架 | |
| vite 5 / @vitejs/plugin-react | 构建 | `base: './'` |
| tailwindcss 4（@tailwindcss/vite） | 样式 | 设计令牌在 `src/index.css` |
| lucide-react | 线性图标 | |
| @cloudbase/js-sdk | CloudBase 前端 SDK | 动态导入 |
| vite-plugin-pwa | PWA / Service Worker | prompt 模式 + 手动更新提示 |
| puppeteer-core（dev） | 浏览器自动化测试 | 复用本机 Edge，不下载浏览器 |
| tencentcloud-sdk-nodejs-tcb（dev） | CloudBase 环境配置脚本 | 密钥经环境变量传入 |

## 六、测试体系

| 脚本 | 覆盖 | 运行时机 |
|---|---|---|
| `npm run smoke` | 渲染/任务 CRUD/拖拽/轮播/反馈/深色/PWA/移动端/控制台零错误（50 项，按数据模式自适应断言） | 每次改版必跑 |
| `npm run ai:test` | AI 真实生成端到端（消耗少量免费额度） | AI 相关改动后 |
| `node scripts/cloud-share-test.mjs` | 双浏览器实例云端共享验证（A 加 B 见） | 云端/数据层改动后 |
| `node scripts/capture-screens.mjs` | 生成截图（docs/screenshots/） | 视觉改版后 |
| `node scripts/convert-gallery-webp.mjs` | 风采图片转 WebP（1280px q75，自动删 jpg） | 更换风采照片后 |
| `powershell scripts/package-deploy.ps1` | 打包部署 zip（正斜杠修复 + 自检） | EdgeOne 备选部署时 |
| `node scripts/configure-cloudbase.mjs` | CloudBase 环境一键配置（匿名登录/集合/规则） | 重建环境时（密钥走环境变量） |
| `tcb cors add <域名> -e <envId>` | Web 安全域名配置（官方 CLI，**域名不带协议前缀**） | 新环境/换域名时 |

## 七、性能与体积基线

- 主包 JS：234KB（gzip ~68KB，不含动态加载的 CloudBase SDK 742KB）
- CSS：45KB（gzip ~8KB）
- 风采图片：4 张 WebP 共 369KB（原图 30MB 已压缩；转换脚本 `scripts/convert-gallery-webp.mjs`）
- 无外部字体/图片依赖（PWA 图标与官方 API 除外）

## 八、演进方向（详见 CHANGELOG 技术债）

1. 学校子域名绑定（国内访问最稳，代码零改动）
2. 登录系统（实名核验、权限区分）
3. 任务统计/导入
4. 反馈密码升级为真实认证
