/**
 * GLM 免费模型对比工具（一次性）
 * 用相同提示词对比 glm-4.7-flash 与 glm-4-flash 的新闻稿生成质量
 * 运行：node scripts/compare-glm-models.mjs
 */
const KEY = process.env.GLM_API_KEY || 'efc0b908b94e4d9dbada191e1c01afd7.1AliyJYuviw9M4nr'
const BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

const SYSTEM = `你是齐鲁工业大学机械工程学部全媒体部门的资深新闻编辑。请根据用户提供的信息生成一篇新闻初稿。
只输出一个 JSON 对象（不要代码块）：{ "title": 字符串, "lead": 字符串, "paragraphs": 字符串数组 }。
只能使用用户提供的信息，未提供的用【】占位，严禁编造姓名、数字、职务。`

const USER = `新闻类型：活动报道
事件要点与背景：机械工程学部于今日在长清校区举办 2026 级新生开学典礼，学部领导与新生代表出席并发言，典礼结束后开展了专业导学活动。
地点：齐鲁工业大学（长清校区）艺体中心
风格倾向：官方正式
篇幅：标准（600-800字）
标题风格：正式标题`

async function callModel(model, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.7,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: USER },
        ],
      }),
    })
    if (res.status === 429) {
      console.log(`  ${model} 限流(429)，${attempt * 8} 秒后重试…`)
      await new Promise((r) => setTimeout(r, attempt * 8000))
      continue
    }
    if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    let parsed = null
    try {
      const clean = content.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1))
    } catch {
      parsed = { title: content.slice(0, 60), lead: '', paragraphs: [content] }
    }
    return {
      model: json.model,
      usage: json.usage,
      title: parsed.title,
      lead: parsed.lead,
      paragraphs: parsed.paragraphs || [],
      rawLength: content.length,
    }
  }
  throw new Error(`${model} 重试 ${retries} 次仍限流`)
}

const [m47, m4] = [await callModel('glm-4.7-flash'), await callModel('glm-4-flash')]

console.log('================ glm-4.7-flash ================')
console.log(`标题: ${m47.title}`)
console.log(`正文长度: ${m47.paragraphs.join('').length} 字 | 原始输出 ${m47.rawLength} 字符 | tokens ${m47.usage?.total_tokens}`)
console.log(`导语: ${m47.lead.slice(0, 80)}`)
console.log('================ glm-4-flash（当前） ================')
console.log(`标题: ${m4.title}`)
console.log(`正文长度: ${m4.paragraphs.join('').length} 字 | 原始输出 ${m4.rawLength} 字符 | tokens ${m4.usage?.total_tokens}`)
console.log(`导语: ${m4.lead.slice(0, 80)}`)
console.log('==================================================')
