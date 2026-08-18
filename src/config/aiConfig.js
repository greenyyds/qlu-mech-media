/**
 * AI 模块配置（智谱 GLM-4.5-Flash，官方免费）
 *
 * ⚠️ 安全提示：本网站为纯静态站（GitHub Pages），API Key 直接打包进前端代码，
 * 任何访问者都能看到该 Key。请仅使用「免费额度」的 Key，切勿使用付费账号 Key。
 * 若 Key 被滥用导致额度耗尽，请到 https://open.bigmodel.cn 重新生成并替换此处。
 *
 * 模型选择说明（2026-08 实测）：
 * - glm-4.5-flash（当前）：官方免费，代际优于 glm-4-flash，实测稳定无限流
 * - glm-4.7-flash：免费但当前访问量过大频繁限流（429），待缓解后可切换
 * - 切换方式：仅改下方 model 字段，其余代码零改动
 *
 * 替换 Key 方式：
 * 1. 直接修改下方 apiKey；或
 * 2. 构建时通过环境变量注入：VITE_GLM_API_KEY=xxx npm run build
 */
export const aiConfig = {
  model: 'glm-4.5-flash',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey:
    import.meta.env.VITE_GLM_API_KEY || 'efc0b908b94e4d9dbada191e1c01afd7.1AliyJYuviw9M4nr',
  temperature: 0.7,
  maxTokens: 4096,
}
