# 迭代提示词 v3：数据共享 · 风采展示 · 意见反馈

> 与部门确认的决策记录（2026-08）：数据后端用**腾讯云 CloudBase**（免费额度、国内直连、免备案）；共享数据**公开读写 + 一键备份**；云端**重新开始**（不迁移本地数据）；风采展示用**全宽自动轮播**（宇树官网风格，4 张 3:2 活动照片，通用文案）；意见反馈**公开提交 + 公开查看**，**匿名或填姓名**，预留密码保护模块。

---

## 一、迭代目标

1. **数据共享**：值班表、任务、反馈三个模块的数据从"各人浏览器 localStorage"升级为"云端共享（CloudBase）"，实现多人实时看到同一份数据
2. **风采展示模块**：首页新增全宽自动轮播（参考宇树科技官网 https://www.unitree.com/cn 的克制大图风格），素材为 `图片素材/风采展示/` 下 4 张 3:2 活动照片
3. **意见反馈二级页面**：`#/feedback` 独立页面，两个分类（技术/设计问题、工作/交际问题），匿名或实名提交，公开列表，预留密码访问开关

## 二、架构变更（重要）

- 项目从"纯静态"升级为"**静态前端 + CloudBase BaaS**"：
  - 新增依赖：`@cloudbase/js-sdk`（官方 JS SDK，Web 匿名登录 + 数据库读写）
  - 新增 `src/config/cloudConfig.js`：`{ envId: '', collections: {...} }`；**envId 为空时应用进入"本地模式"**（云端操作返回提示，不崩溃）
  - 新增 `src/services/cloudService.js`：SDK 初始化（幂等）、集合引用、错误归一化
  - 数据模型：
    | 集合 | 文档结构 | 说明 |
    | --- | --- | --- |
    | `tasks` | `{ title, assignee, deadline, tag, progress, status, createdAt, updatedAt }` | 任务看板，公开读写 |
    | `roster` | `{ weekStart, days: [{ iso, weekday, monthDay, members }] }` | 单文档存整周值班表，公开读写 |
    | `feedback` | `{ category: 'tech'\|'daily', name, content, createdAt }` | 意见反馈，公开读写 |
  - 安全规则：各集合配置为"所有用户可读可写"（CloudBase 安全规则）
- **服务层改造原则**：`taskService` / `dutyService` 保持对外接口签名不变（listTasks/createTask/…），内部存储从 localStorage 切换为 CloudBase；云端不可用时**降级 localStorage 并提示"离线模式"**，恢复后自动回云端
- **备份**：新增"导出数据"按钮（页脚），一键下载 `tasks + roster + feedback` 的 JSON 备份文件

## 三、风采展示模块

- 位置：Hero 区下方、常用链接上方（`src/components/Gallery.jsx`）
- 形式：全宽自动轮播（宇树官网风格）：
  - 大图横幅 `object-cover`，桌面高约 520-600px，移动端约 320-360px
  - 自动播放（5 秒/张）+ 手动左右箭头 + 底部圆点指示器 + 悬停暂停
  - 图片底部深色渐变遮罩 + 说明文字（标题 + 拍摄日期），白字
  - 切换动效：横向滑动 + 淡入（0.5s，克制）；尊重 `prefers-reduced-motion`（自动播放关闭）
  - 键盘可操作（左右方向键）、`aria-label` 齐全
- 素材处理：
  - 4 张 JPG（原图 1.5-13MB）压缩至 ~200KB/张（宽度 1600，质量 80，`System.Drawing` 或 `sharp` 处理）
  - 存放 `src/assets/gallery/`，配置 `src/data/gallery.js`：`{ src, title, date, alt }`（通用文案：标题"机械工程学部 · 活动风采"系列 + 拍摄日期，按照片文件名时间）
- 展示顺序：按文件名时间升序（2024 → 2026）

## 四、意见反馈二级页面

- 路由：手写 **hash 路由**（`#/feedback`，不引入 react-router，约 30 行 `src/utils/router.js`）；导航栏、页脚、移动菜单新增"意见反馈"入口；反馈页有"返回首页"按钮
- 页面结构：
  - 标题区（沿用 SectionHeading 风格）
  - 两个分类卡片（横向并排，移动端堆叠）：
    - **技术与设计**（图标：Bug/Wrench）：网站功能、界面、设计问题
    - **工作与交际**（图标：Users/MessageCircle）：日常值班、协作、沟通问题
  - 点击卡片进入对应分类的表单：内容（textarea，必填，≤500 字）、**匿名开关**（默认匿名；关闭后显示姓名输入框，必填）、提交
  - 下方公开列表：按时间倒序，分类筛选（全部/技术/工作），显示 姓名或"匿名" + 时间 + 内容；空状态提示
- 数据层：`src/services/feedbackService.js`（基于 cloudService，签名 `listFeedbacks / createFeedback / clearAll?`；clearAll 仅本地备份用途）
- **密码预留模块**：`src/config/feedbackConfig.js`：`{ protected: false, password: '' }`
  - `protected: false`（当前）：页面完全公开
  - 后期置 `true`：进入 `#/feedback` 前先弹密码框（输入正确后 sessionStorage 记住本次会话）；密码仅前端校验（存 SHA-256 哈希），文档注明"轻量保护，防君子不防小人；正式方案待接入登录系统"

## 五、需要你配合的事项（执行时）

1. 腾讯云控制台 → 搜索"**云开发 CloudBase**" → 开通并**创建环境**（免费体验环境即可，区域选上海/广州）→ 把**环境 ID** 发我（形如 `xxx-xxxxxx`，约 10 分钟，我给傻瓜式步骤）
2. 提供后我配置 `src/config/cloudConfig.js` 并完成安全规则设置（通过 CloudBase 控制台/CLI）
3. （可选）反馈页密码的初始状态确认：当前保持公开（protected: false）

## 六、验收标准

1. **真实共享验证**：两个浏览器实例同时打开（自动化测试），A 添加任务/修改值班表 → B 刷新后可见；B 提交反馈 → A 可见
2. 风采轮播：自动播放、手动切换、键盘操作、移动端高度、图片加载性能（4 张共 <1MB）
3. 反馈页：两分类提交、匿名/实名展示、公开列表、空状态；`protected: true` 时密码拦截生效
4. 备份导出：JSON 文件包含三类数据
5. 离线降级：envId 留空时页面不崩、云端功能提示"未配置"
6. 冒烟测试扩展并全绿（云端断言可跳过：`SMOKE_NO_CLOUD=1`）、控制台零报错、构建零报错
7. 既有功能不回退：任务拖拽/增删改、深色模式、PWA、AI 生成

## 七、风险与说明（写入 README）

- **公开读写**：无登录系统，任何知道链接的人都能读写云端数据 → 已配一键备份；建议 README 注明"内部工具，请勿外传链接"
- **免费额度**：CloudBase 体验环境约 3000 资源点/月，日常查询消耗很小；若超额服务暂停，可升级或改用 JSON 手动方案（服务层已留切换口）
- **实名是"君子协定"**：姓名由用户自填，无法核验；正式实名待登录系统
- **密码模块是轻量保护**：前端校验，不构成真实安全边界

## 八、交付物清单

- 完整代码（CloudBase 接入、Gallery、Feedback 页、hash 路由、备份导出、降级逻辑）
- 更新 README（新架构说明、CloudBase 环境创建指南、数据模型、风险说明）+ MAINTENANCE.md（新增维护条目）
- 压缩后的 4 张风采图片
- 扩展后的冒烟测试
- 真实共享验证记录（双实例测试输出）
