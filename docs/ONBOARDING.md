# 新人 / 新 AI 上手指南（ONBOARDING）

> 无论你是一位新同学还是一个全新会话的 AI 助手，按本指南操作，
> 可在 15 分钟内完整接管本项目的开发与维护，**无需依赖任何历史对话**。

---

## 第一步：按顺序读这 4 份文档（10 分钟）

1. **`README.md`** — 功能清单、双模式数据层、部署现状、风险说明
2. **`docs/ARCHITECTURE.md`** — 系统全景、核心机制、决策依据（ADR）、数据模型
3. **`CHANGELOG.md`** — 版本演进历史与踩坑记录（为什么会有现在的设计）
4. **`MAINTENANCE.md`** — 维护地图（改什么→改哪）、标准流程、故障排查表

> 读完这 4 份，你对该项目的了解 ≈ 任何一位资深维护者。

## 第二步：了解环境与账号（只读清单）

| 项 | 值 | 存放位置 |
|---|---|---|
| 代码仓库 | `https://github.com/greenyyds/qlu-mech-media`（main 分支） | 本机 git remote |
| 线上地址 | `https://greenyyds.github.io/qlu-mech-media/` | README |
| CloudBase 环境 ID | `qlu-mech-media-d9gqzu1a9ecebc41b`（文档数据库，上海） | `src/config/cloudConfig.js` |
| AI Key（智谱 GLM-4-Flash） | 见 `src/config/aiConfig.js`（公开可见，免费额度） | 同上 |
| 腾讯云账号 | 部门负责人持有（greenyyds 本人） | 不落盘 |
| 本机开发环境 | Windows + Node 24 + npm 11（需 Node ≥ 18） | — |

**权限原则**：CloudBase 配置脚本（`configure-cloudbase.mjs`）需要 SecretId/SecretKey，由账号持有者提供，用完即删；密钥永不写入项目文件。

## 第三步：本地开发环境（10 分钟）

```bash
git clone https://github.com/greenyyds/qlu-mech-media.git   # 或使用已有目录
cd qlu-mech-media
npm install
npm run dev        # http://localhost:5173
npm run build      # 验证构建
npm run preview    # http://localhost:4173（冒烟测试需要）
npm run smoke      # 50 项冒烟测试，必须全绿
```

**已知环境问题**：
- Windows 下 `npm run dev` 偶发崩溃（Vite 文件监听 bug）→ 重启即可，不影响线上
- 本机网络访问 GitHub 偶发不通 → git 操作重试或换网络
- AI 偶发 `ERR_CONNECTION_CLOSED` → 网络对 HTTP/3 不稳，服务已自动重试

## 第四步：标准迭代流程（新功能/改版）

```
1. 读 README 维护地图 → 定位要改的文件
2. 改代码（数据操作必须走 src/services/*，组件不直接碰 localStorage/fetch）
3. 验证：
   npm run build        # 构建零报错
   npm run preview      # 起预览（后台）
   npm run smoke        # 冒烟全绿
   （数据层改动）node scripts/cloud-share-test.mjs   # 双实例共享验证
   （AI 改动）  npm run ai:test                       # 真实生成验证
4. 更新文档：README / MAINTENANCE / CHANGELOG（新版本记录）
5. 提交推送：
   git add -A && git commit -m "说明" && git push origin main
   # 推送即上线（GitHub Actions 自动部署，约 1 分钟）
6. 线上验证：打开 https://greenyyds.github.io/qlu-mech-media/ 抽查
```

## 第五步：常见坑速查（都是本项目真实踩过的）

| 坑 | 表现 | 避免 |
|---|---|---|
| CloudBase 环境选成 PostgreSQL | 页面报 "no document database instance" | 创建环境必须选**文档数据库**；用 `configure-cloudbase.mjs` 验证 |
| 密钥写进代码 | 泄露风险 | 密钥只走环境变量，用完即删 |
| **Web 安全域名带协议前缀** | 线上 CORS 拦截、长期离线模式 | 用官方 CLI：`tcb cors add greenyyds.github.io -e <envId>`（**不带 https://**） |
| PowerShell 改 JS 时 `\r\n` 字面量 | 构建报 "Expected unicode escape" | 替换文本用真实换行符 |
| zip 用 Compress-Archive 打包 | 平台拒绝上传（反斜杠） | 用 `scripts/package-deploy.ps1` |
| 改版后线上还是旧版 | PWA 缓存 | 等待页面底部"发现新版本"提示点刷新，或清缓存 |
| 云端模式看不到预置任务 | 正常！云端重新开始，任务列表为空 | 非 bug；本地模式才有种子数据 |
| 冒烟测试在云端模式失败 | 断言未适配模式 | 参考 [4] 的按徽标分支断言写法 |

## 第六步：第一次动手练习（建议）

给新 AI/新人布置的最小验证任务（验证环境与流程通畅）：

> "在 `src/data/links.js` 中把「DeepSeek 官方网站」的描述改为『AI 大模型对话与创作助手（免费）』，
> 按标准迭代流程完成构建、冒烟测试、推送上线，并在 CHANGELOG 记录 v3.1.1。"

完成即证明：环境可用、流程掌握、文档闭环。

## 交接检查表（离开前）

- [ ] 代码已推送（`git status` 干净，`git log` 与 origin 一致）
- [ ] 文档同步（README/MAINTENANCE/CHANGELOG 反映最新状态）
- [ ] 密钥未留在任何文件（grep 检查 SecretKey/API Key 格式）
- [ ] 冒烟测试全绿
- [ ] 关键账号/凭据口头交接给负责人（不在文档中明文保存密钥）
