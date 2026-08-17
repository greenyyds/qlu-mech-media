/**
 * 新闻初稿生成工具 —— 选项配置（唯一扩展入口）
 *
 * 新增控件只需在此数组追加一项，渲染层（NewsTool.jsx）自动生成对应控件。
 *
 * type 支持：
 * - 'select'    下拉单选（options 必填）
 * - 'textarea'  多行文本
 * - 'text'      单行文本
 * - 'date'      日期选择
 * - 'chips'     胶囊单选（options 必填）
 * - 'url-list'  参考链接列表（可增删，max 条）
 * - 'switch'    开关
 *
 * 其他字段：label 标题 / required 必填 / placeholder 占位 / hint 辅助说明 / max 上限
 */
export const newsToolOptions = [
  {
    id: 'newsType',
    label: '新闻类型',
    type: 'select',
    options: ['院系动态', '活动报道', '人物专访', '成果喜报', '会议新闻', '通知解读'],
    default: '活动报道',
  },
  {
    id: 'theme',
    label: '事件要点与背景',
    type: 'textarea',
    required: true,
    placeholder:
      '描述新闻事件的主题、经过与背景信息，越具体生成质量越高。例如：9月12日机械工程学部举办2026级新生开学典礼，校领导出席并致辞……',
    hint: '必填项：生成质量取决于这里的描述',
  },
  {
    id: 'time',
    label: '时间',
    type: 'date',
    hint: '事件发生时间，可留空',
  },
  {
    id: 'place',
    label: '地点',
    type: 'text',
    placeholder: '如：齐鲁工业大学（长清校区）艺体中心',
  },
  {
    id: 'people',
    label: '人物',
    type: 'text',
    placeholder: '涉及人物，多人用逗号分隔，如：学部主任XXX、辅导员XXX',
    hint: '可留空；未提供时模型会以【】占位',
  },
  {
    id: 'refUrls',
    label: '参考文章链接',
    type: 'url-list',
    max: 5,
    placeholder: 'https://…',
    hint: '受浏览器跨域限制无法自动抓取正文，建议把关键内容一并粘贴到「事件要点与背景」',
  },
  {
    id: 'style',
    label: '风格倾向',
    type: 'chips',
    options: ['官方正式', '生动活泼', '平实客观'],
    default: '官方正式',
  },
  {
    id: 'length',
    label: '篇幅',
    type: 'select',
    options: ['短讯（300-400字）', '标准（600-800字）', '长文（1000字以上）'],
    default: '标准（600-800字）',
  },
  {
    id: 'headlineStyle',
    label: '标题风格',
    type: 'select',
    options: ['正式标题', '吸睛标题', '问句式标题', '带副标题'],
    default: '正式标题',
  },
  {
    id: 'keywords',
    label: '关键词',
    type: 'text',
    placeholder: '希望突出的关键词，逗号分隔，可留空',
  },
  {
    id: 'withAbstract',
    label: '生成文首摘要',
    type: 'switch',
    default: false,
  },
]

/** 工具启用状态：true = 已接入 AI（按钮可用） */
export const newsToolStatus = {
  enabled: true,
  modelLabel: 'GLM-4-Flash',
}

/** 生成一份选项默认值对象 */
export function getDefaultOptions() {
  const obj = {}
  for (const opt of newsToolOptions) {
    if (opt.type === 'url-list') obj[opt.id] = []
    else obj[opt.id] = opt.default ?? ''
  }
  return obj
}
