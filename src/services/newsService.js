/**
 * 新闻初稿生成服务 —— 已接入智谱 GLM-4-Flash（免费模型）
 *
 * ▍调用方式：浏览器直连（智谱 API 支持 CORS，已实测验证）
 * ▍替换模型：改 src/config/aiConfig.js 的 model / baseUrl / apiKey 即可，
 *            接口为 OpenAI 兼容格式，可无缝切换其他兼容服务。
 * ▍历史记录：localStorage 持久化（最近 5 条），数据层与 UI 分离。
 */
import { aiConfig, aiModels } from '../config/aiConfig'

const HISTORY_KEY = 'qlu-mech-media:news-history:v1'
const HISTORY_MAX = 5

/** 工具是否可用 */
export function isToolEnabled() {
  return true
}

/* ---------------- 提示词组装 ---------------- */

/** 系统提示词：新闻写作专家 + 结构化输出要求 */
function buildSystemPrompt() {
  return `你是齐鲁工业大学机械工程学部全媒体部门的资深新闻编辑，精通高校新闻写作。
请根据用户提供的选项，生成一篇结构完整、可直接使用的新闻初稿。

输出要求（严格遵守）：
1. 只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释文字。字段：
   - title: 字符串，符合所选标题风格（"带副标题"时用"主标题——副标题"格式）
   - abstract: 文首摘要（30-60 字，仅当 withAbstract 为 true 时输出，否则空字符串）
   - lead: 导语（1-2 句，交代时间、地点、人物与事件核心）
   - paragraphs: 正文段落字符串数组（3-6 段）
2. 篇幅：短讯 300-400 字；标准 600-800 字；长文 1000 字以上（含标点）。
3. 风格倾向：官方正式（严谨规范，多用"学部""师生"等称谓）；生动活泼（有画面感、适当口语化但不失分寸）；平实客观（中立、信息密度高）。
4. 事实纪律（最重要）：只能使用用户提供的信息。用户未提供的时间、地点、人物、数字、职务一律用【】占位符标注（如【时间】【地点】【嘉宾姓名】），严禁编造姓名、数字、职务。
5. 标题避免感叹号堆砌；正文开头不使用"近日""为了"等空泛套话。
6. 参考文章链接仅作风格参考，不得引用其内容。`
}

/** 把选项序列化为用户消息 */
function buildUserMessage(options = {}) {
  const refUrls = Array.isArray(options.refUrls) ? options.refUrls.filter(Boolean) : []
  const lines = [
    `新闻类型：${options.newsType || '未指定'}`,
    `事件要点与背景：${options.theme || '未提供'}`,
    `时间：${options.time || '未提供'}`,
    `地点：${options.place || '未提供'}`,
    `人物：${options.people || '未提供'}`,
    `参考文章链接：${refUrls.length ? refUrls.join('；') : '未提供'}`,
    `风格倾向：${options.style || '官方正式'}`,
    `篇幅：${options.length || '标准（600-800字）'}`,
    `标题风格：${options.headlineStyle || '正式标题'}`,
    `关键词：${options.keywords || '未提供'}`,
    `withAbstract：${options.withAbstract ? 'true' : 'false'}`,
  ]
  return lines.join('\n')
}

/* ---------------- 生成接口 ---------------- */

/**
 * 流式生成新闻初稿（SSE）
 * @param {object}   options 选项对象（见 newsToolConfig）
 * @param {AbortSignal} signal 中止信号（用于"停止生成"）
 * @param {string}   mode 模型模式：'quick' | 'deep'（默认取 aiConfig.defaultMode）
 * @returns {AsyncGenerator<string>} 逐段产出文本增量
 */
export async function* streamDraft(options = {}, signal, mode) {
  const modelInfo = aiModels[mode] || aiModels[aiConfig.defaultMode] || aiModels.deep
  const attemptFetch = async () => {
    const res = await fetch(aiConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelInfo.model,
        stream: true,
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserMessage(options) },
        ],
      }),
      signal,
    })
    return res
  }

  // 网络抖动容错：连接阶段失败自动重试一次（已收到内容后中断则不再重试）
  let res
  try {
    res = await attemptFetch()
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    res = await attemptFetch()
  }

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message || ''
    } catch {
      /* 非 JSON 错误体 */
    }
    throw new Error(`生成失败（HTTP ${res.status}）${detail ? `：${detail}` : ''}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // 逐行解析 SSE data: 块
    let nl
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        /* 忽略残缺分块 */
      }
    }
  }
}

/** 解析模型输出为结构化草稿；失败返回 null（调用方回退为原文展示） */
export function parseDraft(raw) {
  if (!raw) return null
  let text = raw.trim()
  // 剥离可能的 markdown 代码块包裹
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()
  // 兼容输出前后多余文字：截取首个 { 到最后一个 }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) text = text.slice(start, end + 1)

  try {
    const obj = JSON.parse(text)
    if (typeof obj.title !== 'string') return null
    return {
      title: obj.title,
      abstract: typeof obj.abstract === 'string' ? obj.abstract : '',
      lead: typeof obj.lead === 'string' ? obj.lead : '',
      paragraphs: Array.isArray(obj.paragraphs) ? obj.paragraphs : [],
    }
  } catch {
    return null
  }
}

/** 草稿拼成完整纯文本（用于复制） */
export function draftToText(draft) {
  const parts = [draft.title]
  if (draft.abstract) parts.push(draft.abstract)
  if (draft.lead) parts.push(draft.lead)
  parts.push(...(draft.paragraphs || []))
  return parts.join('\n\n')
}

/* ---------------- 最近生成历史（localStorage） ---------------- */

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return list
    }
  } catch (err) {
    console.warn('[newsService] 读取生成历史失败', err)
  }
  return []
}

function writeHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch (err) {
    console.warn('[newsService] 写入生成历史失败', err)
  }
}

/** 保存一条生成记录（最多 HISTORY_MAX 条，新的在前） */
export function saveHistory(entry) {
  const list = readHistory()
  list.unshift({ id: `h-${Date.now()}`, ts: Date.now(), ...entry })
  writeHistory(list.slice(0, HISTORY_MAX))
}

export function listHistory() {
  return readHistory()
}

export function clearHistory() {
  writeHistory([])
}
