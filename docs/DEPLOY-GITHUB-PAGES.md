# GitHub Pages 上线操作卡（免备案 · 立即可用）

> 目标链接：**https://greenyyds.github.io/qlu-mech-media/**
> 你的电脑上代码仓库已全部准备好（git 已提交、remote 已配置），你只需做下面 3 步。

---

## 第 1 步：创建 GitHub 仓库（浏览器操作，约 1 分钟）

1. 打开 **https://github.com/new**（用 greenyyds 账号登录）
2. 仓库名称填：**`qlu-mech-media`**
3. 可见性选 **Public**
4. **不要**勾选 "Add a README" / ".gitignore" / "license"（留空仓库，避免冲突）
5. 点 **Create repository**

> 不需要执行网页上显示的 git 命令（本机已配置好 remote）。

## 第 2 步：推送代码（本机操作，约 1 分钟）

打开 PowerShell（Win+X → Windows PowerShell），执行：

```powershell
cd "D:\all exploit files\dsh_project\web of machanical engineering"
git push -u origin main
```

- 首次推送会弹出 **GitHub 登录窗口**（Git Credential Manager）→ 用浏览器完成授权即可
- 如果没有弹窗而是提示输入用户名密码：用户名填 `greenyyds`，**密码位置粘贴 Personal Access Token**（获取方法见下方"常见问题"）
- 推送完成后会显示 `main -> main` 和 Actions 流水线开始运行

## 第 3 步：开启 Pages（浏览器操作，约 30 秒）

1. 打开 **https://github.com/greenyyds/qlu-mech-media/settings/pages**
2. **Source** 选择 **"GitHub Actions"**（流水线会自动构建部署）
3. 等待约 1 分钟（Actions 页可看进度：https://github.com/greenyyds/qlu-mech-media/actions）

## 第 4 步：验证上线

手机 + 电脑打开：**https://greenyyds.github.io/qlu-mech-media/**

验证清单：
- [ ] 页面完整显示，样式正常
- [ ] 新闻工具生成一篇初稿（AI 可用）
- [ ] 手机浏览器 → 添加到主屏幕（PWA 生效）
- [ ] 任务看板添加任务 → 刷新不丢
- [ ] 深色模式切换正常

---

## 常见问题

| 问题 | 解决 |
| --- | --- |
| push 提示输入用户名密码 | 密码处填 Token：GitHub → Settings → Developer settings → **Personal access tokens** → Tokens (classic) → Generate new token → 勾选 `repo` → 生成后复制粘贴 |
| push 一直失败/超时 | 国内网络访问 GitHub 偶有不稳，多试几次或换网络（手机热点） |
| 部署后打不开/404 | 确认第 3 步 Source 选了 "GitHub Actions"；Actions 页面看是否构建成功 |
| 以后改版 | 本机 `git add -A && git commit -m "..."` 后 `git push`，Actions 自动重新部署 |
| github.io 偶尔打不开 | 属 DNS 偶发污染，换网络或用手机流量通常可恢复；长期方案是学校子域名（见 DEPLOY-EDGEONE.md 思路，申请后绑定自定义域名即可，代码零改动） |
