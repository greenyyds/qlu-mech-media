/**
 * AI 模块配置（智谱 GLM 双模式，均官方免费）
 *
 * ⚠️ 安全提示：本网站为纯静态站（GitHub Pages），API Key 直接打包进前端代码，
 * 任何访问者都能看到该 Key。请仅使用「免费额度」的 Key，切勿使用付费账号 Key。
 * 若 Key 被滥用导致额度耗尽，请到 https://open.bigmodel.cn 重新生成并替换此处。
 *
 * ▍双模式（v4）：
 *   quick 快速 = glm-4-flash（响应快、节省额度）
 *   deep  深度 = glm-4.5-flash（文字质量更高，默认）
 * 模型选择说明（2026-08 实测）：
 *   - glm-4.5-flash：官方免费（docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash），
 *     3/3 稳定成功、JSON 格式合规、无限流
 *   - glm-4.7-flash：免费但访问量过大频繁限流（429），待缓解后可加入选项
 *
 * 替换 Key 方式：
 * 1. 直接修改下方 apiKey；或
 * 2. 构建时通过环境变量注入：VITE_GLM_API_KEY=xxx npm run build
 */
export const aiModels = {
  quick: {
    id: 'quick',
    label: '快速',
    model: 'glm-4-flash',
    note: '响应快、节省额度',
  },
  deep: {
    id: 'deep',
    label: '深度',
    model: 'glm-4.5-flash',
    note: '文字质量更高（推荐）',
  },
}

export const aiConfig = {
  defaultMode: 'deep',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey:
    import.meta.env.VITE_GLM_API_KEY || 'efc0b908b94e4d9dbada191e1c01afd7.1AliyJYuviw9M4nr',
  temperature: 0.7,
  maxTokens: 4096,
}
