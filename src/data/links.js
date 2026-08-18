/**
 * 常用链接配置（唯一维护入口）
 * 新增 / 修改链接只需编辑本文件：
 * - icon: 对应 QuickLinks.jsx 中 ICONS 映射的键名（lucide 图标）
 * - tint: 图标底色类名（v4 起按官网品牌主色淡色化；均含 dark 变体）
 * - url 为 null 时卡片会显示为"待配置"虚线状态，不会产生死链接
 *
 * 品牌色方案（v4 与部门确认）：
 *   醒图=莫兰迪绿 / 秀米=浅粉红 / DeepSeek=深灰蓝 / 剪映=黑色
 */
export const linkGroups = [
  {
    id: 'media',
    title: '媒体链接',
    description: '学部官方发布渠道',
    links: [
      {
        name: '齐鲁工业大学官网',
        desc: '学校新闻、通知公告与招生信息',
        url: 'https://www.qlu.edu.cn/',
        icon: 'Globe',
        tint: 'bg-accent/10 text-accent',
      },
      {
        name: '机械工程学部官网',
        desc: '学部动态、教学科研与学团工作',
        url: 'https://me.qlu.edu.cn/',
        icon: 'Building2',
        tint: 'bg-[rgba(0,113,227,0.08)] text-accent-ink',
      },
      {
        name: '机械工程学部微信公众号',
        desc: '学部官方新媒体账号（暂指向新媒体平台页）',
        url: 'https://me.qlu.edu.cn/1752/list.htm',
        icon: 'MessageCircle',
        tint: 'bg-[rgba(0,113,227,0.08)] text-accent-ink',
      },
    ],
  },
  {
    id: 'tools',
    title: '工具链接',
    description: '日常创作常用工具',
    links: [
      {
        name: '醒图官方网站',
        desc: '在线修图工具（配合摄影教程后期章节）',
        url: 'https://www.retouchpics.com/',
        icon: 'Image',
        tint: 'bg-[#eef4ef] text-[#5f8a6f] dark:bg-white/10 dark:text-[#9fc7ae]',
      },
      {
        name: '秀米官方网站',
        desc: '微信公众号图文排版工具',
        url: 'https://xiumi.us/',
        icon: 'Newspaper',
        tint: 'bg-[#fdf1f1] text-[#c08484] dark:bg-white/10 dark:text-[#e0a8a8]',
      },
      {
        name: '剪映官方网站',
        desc: '视频剪辑与后期制作工具',
        url: 'https://www.capcut.cn/',
        icon: 'Clapperboard',
        tint: 'bg-[#f0f0f2] text-ink dark:bg-white/10 dark:text-white/90',
      },
      {
        name: 'DeepSeek 官方网站',
        desc: 'AI 大模型对话与创作助手',
        url: 'https://www.deepseek.com/',
        icon: 'Sparkles',
        tint: 'bg-[#edf0f5] text-[#45597c] dark:bg-white/10 dark:text-[#93a7c9]',
      },
    ],
  },
]
