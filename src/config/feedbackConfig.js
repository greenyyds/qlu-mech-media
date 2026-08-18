/**
 * 意见反馈页访问控制配置（预留模块）
 *
 * - protected: false（当前）→ 反馈页完全公开
 * - protected: true  → 进入反馈页需输入密码（本次会话记住）
 *
 * password 填 SHA-256 哈希（不要填明文）：
 * 生成命令：node -e "console.log(require('crypto').createHash('sha256').update('你的密码').digest('hex'))"
 *
 * ⚠️ 说明：纯静态站的前端校验只是"轻量保护"（代码公开可见），
 * 防君子不防小人；正式权限控制需接入登录系统（后期迭代方向）。
 */
export const feedbackConfig = {
  protected: false,
  password: '', // 例如：sha256('qlu2026') 的十六进制结果
}
