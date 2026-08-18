/**
 * CloudBase（腾讯云开发）配置
 *
 * envId：云开发环境 ID（形如 'xxx-123abc'），在腾讯云控制台创建环境后获得。
 *       留空 = 本地模式（数据存浏览器 localStorage，不共享）。
 *       填入后自动切换云端共享模式（任务 / 值班表 / 反馈）。
 *
 * 获取方式：腾讯云控制台 → 搜索"云开发 CloudBase" → 创建环境（免费体验环境）→
 *          环境列表中的"环境 ID"一栏。
 */
export const cloudConfig = {
  envId: '',
  collections: {
    tasks: 'tasks',
    roster: 'roster',
    feedback: 'feedback',
  },
}
