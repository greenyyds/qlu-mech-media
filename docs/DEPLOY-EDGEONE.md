# 部署到 EdgeOne Pages（国内直连 · 免费 · 免备案）

> 目标：让部门成员在国内网络下**免翻墙**直接访问工作台。
> 部署包已生成：`docs/deploy/qlu-mech-media-v2.zip`（如改版请重新构建打包）。
> 预计耗时：注册实名约 2 分钟 + 上传 3 分钟。

---

## 第 1 步：注册腾讯云账号并实名

1. 打开 https://cloud.tencent.com ，点击右上角「注册」（可用微信扫码注册）
2. 注册完成后进入 https://console.cloud.tencent.com/developer/auth ，完成**个人实名认证**（微信扫码 + 身份证信息，几分钟内通过）
   - ⚠️ 实名是国内平台硬性要求，EdgeOne Pages 免费版也需要

## 第 2 步：进入 EdgeOne Pages（国内版入口）

> ⚠️ 注意：`pages.edgeone.ai` 是**国际站**（邮箱/Google 登录），国内用户请用下面的腾讯云入口。

国内正确入口（任选其一）：

- **方式 A（推荐）**：打开 https://edgeone.cloud.tencent.com/ → 用刚才注册的**腾讯云账号**登录 → 在页面中找到「**Pages**」入口（服务总览或导航菜单里）
- **方式 B**：腾讯云控制台 https://console.cloud.tencent.com/edgeone → 左侧菜单找「**EdgeOne Pages**」
- **方式 C**：腾讯云控制台顶部搜索框直接搜「**EdgeOne Pages**」

> 如入口未显示：EdgeOne Pages 为免费能力，首次进入按页面提示开通即可（不产生费用）。

## 第 3 步：创建项目

1. 点击「创建项目」
2. 填写项目名称，例如：`qlu-mech-media`（将影响默认域名）
3. 部署方式选择 **「直接上传」**（无需代码仓库）
4. 创建成功后进入项目详情页

## 第 4 步：上传部署包

1. 在项目页点击「上传」/「部署新版本」
2. 选择文件：**`docs/deploy/qlu-mech-media-v2.zip`**
   - zip 内已是站点内容（index.html 在根目录），直接上传即可
   - 也可以解压后上传 dist 文件夹内容
3. 上传完成后点击「部署」，等待几十秒

## 第 5 步：获得你的公网链接

部署完成后，项目会分配一个域名，形如：

```
https://<项目名>.edgeone.app
```

例如：`https://qlu-mech-media.edgeone.app`

- ✅ 自动 HTTPS（PWA 添加到主屏幕需要）
- ✅ 国内节点直连，无需翻墙
- ✅ 免费额度足够部门内部使用（流量以控制台「免费版」说明为准）

**验证清单**（手机 + 电脑各过一遍）：

- [ ] 打开链接，页面完整显示
- [ ] 手机浏览器 → 分享/菜单 →「添加到主屏幕」，出现应用图标，可全屏打开
- [ ] 新闻工具生成一篇初稿（验证 AI 可用）
- [ ] 任务看板添加任务 → 刷新不丢
- [ ] 深色模式切换正常

## 第 6 步：以后改版如何更新

每次更新代码后：

```bash
npm run build                              # 重新构建
# 重新压缩 docs/deploy/qlu-mech-media-v2.zip（或按下方命令）
```

或直接执行：

```powershell
Compress-Archive -Path "dist\*" -DestinationPath "docs\deploy\qlu-mech-media-v2.zip" -Force
```

然后在 EdgeOne Pages 项目页再次「上传新版本」→「部署」即可，旧版本会自动保留可回滚。

---

## 常见问题

| 问题 | 说明 |
| --- | --- |
| 找不到腾讯云登录入口？ | `pages.edgeone.ai` 是国际站；国内请走 `edgeone.cloud.tencent.com` 或腾讯云控制台（见第 2 步） |
| 免费额度够吗？ | 部门内部工具站点访问量很小，免费版流量额度足够；超额后腾讯云会提示，可随时升级或改用 COS |
| 域名不满意？ | 可以绑定自己的域名（需已备案），控制台「自定义域名」中添加 |
| 更新后手机还是旧版？ | PWA 缓存了旧资源，页面底部会弹出「发现新版本，刷新后生效」，点击刷新即可；或彻底关闭浏览器重开 |
| 部署包更新了但上传失败？ | 确认 zip 内 index.html 在根目录，且未包含外层 dist 文件夹 |
| EdgeOne 有意外？ | 备选方案：腾讯云 COS 静态网站托管（见 README「其他平台」），部署思路一致 |

## 相关链接

- EdgeOne 国内入口：https://edgeone.cloud.tencent.com/
- 腾讯云控制台 EdgeOne：https://console.cloud.tencent.com/edgeone
- EdgeOne Pages 直接上传官方文档：https://pages.edgeone.ai/zh/document/direct-upload
- 腾讯云实名认证：https://console.cloud.tencent.com/developer/auth
