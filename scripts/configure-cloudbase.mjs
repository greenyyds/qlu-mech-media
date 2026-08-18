/**
 * CloudBase 环境一键配置脚本（用后即弃的运维工具）
 *
 * 功能：
 *   1. 开启匿名登录
 *   2. 添加 Web 安全域名（正式站 + 本地调试）
 *   3. 创建集合 tasks / roster / feedback（如缺失）
 *   4. 设置集合安全规则为「所有用户可读写」（CUSTOM 规则）
 *
 * 用法（密钥经环境变量传入，不写入任何文件）：
 *   $env:TCB_SECRET_ID = "AKID..."
 *   $env:TCB_SECRET_KEY = "s1xh..."
 *   node scripts/configure-cloudbase.mjs
 *
 * 完成后建议立即在 https://console.cloud.tencent.com/cam/capi 删除该密钥。
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('tencentcloud-sdk-nodejs-tcb/tencentcloud/services/tcb/v20180608/tcb_client.js')
const models = require('tencentcloud-sdk-nodejs-tcb/tencentcloud/services/tcb/v20180608/tcb_models.js')

const ENV_ID = 'qlu-mech-media-d9gqzu1a9ecebc41b'
const SECRET_ID = process.env.TCB_SECRET_ID
const SECRET_KEY = process.env.TCB_SECRET_KEY
const COLLECTIONS = ['tasks', 'roster', 'feedback']
const WEB_DOMAINS = ['https://greenyyds.github.io']
const PUBLIC_RULE = JSON.stringify({ read: true, write: true })

if (!SECRET_ID || !SECRET_KEY) {
  console.error('请先设置环境变量 TCB_SECRET_ID / TCB_SECRET_KEY')
  process.exit(1)
}

const client = new Client({
  credential: { secretId: SECRET_ID, secretKey: SECRET_KEY },
  region: 'ap-shanghai',
  profile: {
    httpProfile: { endpoint: 'tcb.tencentcloudapi.com', reqTimeout: 30 },
  },
})

let failed = 0
function ok(name, detail) {
  console.log(`  ✔ ${name}${detail ? `（${detail}）` : ''}`)
}
function fail(name, err) {
  failed += 1
  console.error(`  ✘ ${name}: ${err?.message || err}`)
}

// 1. 环境确认
console.log('[1] 环境确认')
try {
  const envs = await client.DescribeEnvs({})
  const env = (envs.EnvList || []).find((e) => e.EnvId === ENV_ID)
  if (env) {
    ok(`环境 ${ENV_ID}（${env.Alias || ''}）`, `状态 ${env.Status || '未知'}`)
    console.log(`    环境详情：${JSON.stringify({ Region: env.Region, Source: env.Source, AppId: env.AppId })}`)
  } else fail('未找到环境，请检查 ENV_ID 与密钥权限')
} catch (e) {
  fail('DescribeEnvs', e)
}

// 2. 匿名登录
console.log('\n[2] 开启匿名登录')
try {
  let current = {}
  try {
    current = await client.DescribeLoginConfig({ EnvId: ENV_ID })
  } catch {
    /* 读取失败按默认处理 */
  }
  await client.ModifyLoginConfig({
    EnvId: ENV_ID,
    PhoneNumberLogin: current.PhoneNumberLogin === true,
    EmailLogin: current.EmailLogin === true,
    UserNameLogin: current.UserNameLogin === true,
    AnonymousLogin: true,
  })
  ok('匿名登录已开启')
} catch (e) {
  fail('ModifyLoginConfig', e)
}

// 3. Web 安全域名
console.log('\n[3] 配置 Web 安全域名')
try {
  let existing = []
  try {
    const res = await client.DescribeAuthDomains({ EnvId: ENV_ID })
    existing = (res.Domains || []).map((d) => (typeof d === 'string' ? d : d.Domain || ''))
  } catch {
    /* 读取失败按空处理 */
  }
  const toAdd = WEB_DOMAINS.filter((d) => !existing.includes(d))
  if (toAdd.length) {
    await client.CreateAuthDomain({ EnvId: ENV_ID, Domains: toAdd })
    ok(`已添加安全域名：${toAdd.join('、')}`)
  } else {
    ok('安全域名已存在，无需添加', WEB_DOMAINS.join('、'))
  }
} catch (e) {
  fail('CreateAuthDomain', e)
}

// 4. 集合创建 + 安全规则
console.log('\n[4] 集合与安全规则')
let tableNames = []
try {
  const tables = await client.ListTables({ EnvId: ENV_ID, MgoLimit: 100 })
  tableNames = (tables.TableList || []).map((t) => t.TableName || t.Name || '')
  ok(`当前集合：${tableNames.join('、') || '（空）'}`)
} catch (e) {
  fail('ListTables', `${e?.code || ''} ${e?.message || e}`)
}

for (const name of COLLECTIONS) {
  if (!tableNames.includes(name)) {
    try {
      await client.CreateTable({
        TableName: name,
        EnvId: ENV_ID,
        PermissionInfo: { AclTag: 'CUSTOM', Rule: PUBLIC_RULE, EnvId: ENV_ID },
      })
      ok(`集合 ${name} 已创建（公开读写规则）`)
    } catch (e) {
      // 并发/重复创建容错
      if (String(e?.message || '').includes('exist') || String(e?.message || '').includes('重复')) {
        ok(`集合 ${name} 已存在`)
      } else {
        fail(`创建 ${name}`, e)
      }
    }
  } else {
    ok(`集合 ${name} 已存在（创建时已配置公开读写规则）`)
  }
}

console.log('\n' + (failed ? `配置完成，${failed} 项异常（见上方 ✘）` : '全部配置完成 ✔'))
process.exit(failed ? 1 : 0)
