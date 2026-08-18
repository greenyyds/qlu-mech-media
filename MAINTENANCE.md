# 长期维护手册（MAINTENANCE.md）

> 本手册的目标：**任何一个人（哪怕是没参与开发的同学、或换了新的 AI 助手）都能独立完成网站的全部日常维护**。
> 核心原则：所有维护知识都写在这里和 README 里，**不依赖任何一次对话的记忆**。
> 配套：`README.md`（功能与架构总览）· `docs/DEPLOY-GITHUB-PAGES.md`（上线操作卡）· `scripts/`（测试与打包脚本）。

---

## 一、30 秒了解现状

| 项 | 值 |
|---|---|
| 正式网址 | **https://greenyyds.github.io/qlu-mech-media/** |
| 技术栈 | Vite 5 + React 18 + Tailwind CSS v4（静态前端） |
| 数据存储 | **双模式**：配置 CloudBase 后云端共享（推荐）；未配置时各人浏览器 localStorage |
| AI 模型 | 智谱 GLM-4-Flash（免费），Key 在前端 `src/config/aiConfig.js` |
| 部署方式 | 推送到 GitHub `main` 分支 → GitHub Actions 自动构建发布（约 1 分钟） |
| 代码仓库 | https://github.com/greenyyds/qlu-mech-media |

---

## 二、维护地图（改什么 → 改哪个文件）

| 想改的内容 | 修改文件 | 说明 |
|---|---|---|
| 公告横幅文字 | `src/components/NoticeBanner.jsx`（顶部 NOTICE_TEXT） | 可关闭，关闭状态在访问者本机 |
| 值班表成员/排班（默认值） | `src/data/roster.js` | 云端模式下改的是 CloudBase 数据（页面上编辑）；此文件是"初始默认值" |
| 风采展示照片/文案 | `src/data/gallery.js` + `src/assets/gallery/` | 换图：替换图片文件 + 改配置（标题/日期/alt） |
| 意见反馈页文案/分类 | `src/components/FeedbackPage.jsx`（CATEGORIES 数组） | 页面结构 |
| 反馈页密码开关 | `src/config/feedbackConfig.js` | `protected: true` + 密码哈希后启用 |
| 常用链接（增删改） | `src/data/links.js` | url 留空会显示"待配置"占位，不会产生死链接 |
| 任务看板示例任务 | `src/services/taskService.js`（buildSeedTasks） | 仅本地模式首次打开生效 |
| 新闻工具选项（增删） | `src/data/newsToolConfig.js` | 控件自动渲染，支持七种控件类型 |
| AI 模型 / Key / 参数 | `src/config/aiConfig.js` | 换模型改 model/baseUrl；换 Key 改 apiKey |
| AI 生成提示词规则 | `src/services/newsService.js`（buildSystemPrompt） | 事实纪律、篇幅、风格都在这里 |
| **云端开关（共享/本地）** | `src/config/cloudConfig.js` | `envId` 填写 = 云端共享；留空 = 本地模式 |
| 配色 / 圆角 / 动效 | `src/index.css`（@theme 设计令牌） | 浅色/深色都走 CSS 变量 |
| 导航菜单项 / 主题切换 | `src/components/Navbar.jsx` | NAV_LINKS 数组 |
| 页面整体布局 / 路由 | `src/App.jsx` + `src/utils/router.js` | 二级页约定：hash 以 `#/` 开头 |

## 三、标准维护流程（每次改版就做这 3 步）

```bash
# 1. 改完代码后，本地验证构建与冒烟测试
npm install            # 仅首次或依赖变更时需要
npm run build          # 构建，报错说明代码有问题
npm run preview        # 本地预览 http://localhost:4173（可选）
npm run smoke          # 冒烟测试 36 项（需先起 preview）

# 2. 提交并推送（推送后约 1 分钟自动上线）
git add -A
git commit -m "改动说明，例如：更新值班表排班"
git push origin main

# 3. 验证线上
打开 https://greenyyds.github.io/qlu-mech-media/ 确认
```

> 不需要手动上传任何文件——GitHub Actions 自动构建部署。**推了就是上线了。**

## 四、回滚到上一个版本

1. 打开 https://github.com/greenyyds/qlu-mech-media/commits/main ，找到要回滚到的提交
2. 点该提交右侧的 `...` → **Revert**（GitHub 自动生成反向提交）→ Confirm
3. 约 1 分钟后自动回滚上线

## 五、常见故障排查表

| 症状 | 原因 | 处理 |
|---|---|---|
| 打开网址 404 | 1) Pages 未启用；2) 部署流水线失败 | 检查仓库 Settings→Pages 是否 Source=GitHub Actions；Actions 页看运行是否成功 |
| 部署流水线失败 | 多为 GitHub 服务端临时故障（503） | Actions → Re-run all jobs，重试即可 |
| 手机/同事打开很慢或打不开 | github.io 在国内个别网络不稳定（DNS 污染） | 换网络或手机流量；长期方案见第八节"学校子域名" |
| 页面显示旧内容 | PWA 缓存了旧版本 | 页面底部会弹"发现新版本"，点刷新；或彻底关闭浏览器重开 |
| AI 生成报错 | 1) Key 失效/额度耗尽；2) 网络问题 | 换 `src/config/aiConfig.js` 里的 Key；重试 |
| 生成内容乱编细节 | 提示词有事实纪律，但 AI 仍可能出错 | 人工核对后发布；可在 `newsService.js` 加强提示词 |
| 数据不共享（显示"本机数据"） | CloudBase 未配置或 envId 为空 | 检查 `src/config/cloudConfig.js` 的 envId；见 README 第三节接入步骤 |
| 显示"离线模式" | 云端暂时不可用（网络/额度/环境问题） | **无需手动操作**：系统每 30 秒自动探测，云端恢复后自动切回"云端共享"并刷新数据；若长时间不恢复，检查网络、CloudBase 环境状态与免费额度 |
| 云端数据被改乱/误删 | 公开读写模式（无登录系统） | 页脚"导出数据备份"定期备份；重要数据建议每周导出一份 |
| CloudBase 免费额度耗尽 | 资源点用超 | 控制台查看用量；可清空 envId 降级本地模式，或升级付费 |
| 反馈页无法进入（提示密码） | `feedbackConfig.protected` 被置 true | 输入密码；或把 protected 改回 false 重新部署 |
| 本地 npm run dev 崩溃 | Windows 文件监听偶发问题 | 重启 `npm run dev` 即可，不影响线上 |

## 六、交给新 AI / 新同学接手时（重要）

**完整上手指南见 `docs/ONBOARDING.md`**（15 分钟接管：读 4 份文档 → 环境清单 → 本地开发 → 标准迭代流程 → 常见坑 → 练习任务）。

新对话/新 AI 快速进入状态，只需让它按顺序读：

1. **`README.md`** —— 功能清单、架构、数据层（双模式）、部署
2. **`docs/ARCHITECTURE.md`** —— 设计决策依据、数据模型、测试体系
3. **`CHANGELOG.md`** —— 版本历史与踩坑记录
4. **`MAINTENANCE.md`（本文件）** —— 维护地图、流程、故障排查
5. 动手前读：`src/config/cloudConfig.js`、`src/config/aiConfig.js`、`src/config/feedbackConfig.js`、`src/services/taskService.js`、`vite.config.js`

> 对本文件、README、CHANGELOG 的任何重大变更（新模块、新流程），请同步更新文档——这是"长期维护不依赖记忆"的根本保证。

## 七、换电脑 / 电脑坏了怎么办

网站代码全在 GitHub，任何一台电脑都能恢复：

```bash
git clone https://github.com/greenyyds/qlu-mech-media.git
cd qlu-mech-media
npm install
npm run dev
```

> 改代码 → `git push` 即上线，和这台电脑无关。**这台电脑丢了都不影响网站。**

## 八、长期升级建议（学校子域名，最稳）

github.io 在国内偶有不稳，最正规的长期方案是把域名换成学校子域（已备案主域名无需重新备案）：

1. 联系学校信息化中心/网络中心，申请子域名（如 `media.qlu.edu.cn`），**申请文案模板见下**
2. 拿到后：仓库 Settings → Pages → Custom domain 填入子域名 → Save
3. 学校 DNS 解析到 `greenyyds.github.io`（CNAME）；HTTPS 由 GitHub 自动签发
4. 代码零改动，旧链接自动跳转

申请文案模板：

> 尊敬的老师：
> 您好！我是机械工程学部全媒体部门的学生。为满足学部新闻宣传工作需要，我们搭建了部门内部工具网站（常用链接聚合、任务规划、AI 新闻初稿生成），目前已部署于 GitHub Pages（https://greenyyds.github.io/qlu-mech-media/）。
> 考虑到校外访问稳定性与校园形象，希望申请使用学校已备案域名下的子域名（如 media.qlu.edu.cn）作为网站正式域名，由贵中心统一管理解析与备案关系。网站为静态页面，无数据存储、无后台，运行在 GitHub Pages 上，仅需一个 CNAME 解析即可。盼批准，感谢！

## 九、当前已知事项

- AI Key 为公开可见的免费 Key（方案已确认）；如额度被滥用，到智谱开放平台重新生成后替换 `src/config/aiConfig.js`
- 值班表/公告/任务示例均为示例数据，按第二节"维护地图"修改
- 公众号链接暂指向学部官网"新媒体平台"页，可替换为公众号主页链接或二维码（`src/data/links.js`）
