'use strict';
/* 雲端 AI 轉接測試：以模擬 fetch 檢查三家請求格式、結構化綱要、錯誤說明與原文回查。不需真實金鑰、不連網。 */
const assert = require('node:assert/strict');
require('../classical_data.js'); require('../literary_profiles.js'); require('../literary_objects.js'); require('../literary_yijing.js');
const engine = require('../literary_engine.js');
require('../literary_catalog.js');
const C = require('../literary_cloud.js');

// 模擬 localStorage 與 fetch
const ls = {}; globalThis.localStorage = { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; } };
let calls = [], responder = null;
globalThis.fetch = async (url, init = {}) => { calls.push({ url, init }); const r = responder(url, init); return { ok: r.status < 400, status: r.status, text: async () => JSON.stringify(r.body) }; };
globalThis.performance = globalThis.performance || { now: () => Date.now() };

// 1. 結構化綱要：符合 OpenAI strict（每個物件 additionalProperties:false 且全部欄位 required）
const schema = C.analysisSchema();
(function walk(s, path) {
  if (s.type === 'object') {
    assert.equal(s.additionalProperties, false, path + ' additionalProperties');
    assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort(), path + ' all required');
    for (const [k, v] of Object.entries(s.properties)) walk(v, path + '.' + k);
  }
  if (s.type === 'array') walk(s.items, path + '[]');
})(schema, 'root');
const g = C.toGeminiSchema(schema);
assert.equal(g.type, 'OBJECT'); assert.equal(g.properties.elements.items.type, 'OBJECT'); assert(!JSON.stringify(g).includes('additionalProperties'));

// 2. 典型回覆
const item = globalThis.CLASSICAL_LITERATURE_DATA.find(x => x.title === '江雪');
const local = engine.analyzeLiteraryConcept(item);
const reply = { meaning: '孤高自守', vernacular: '【國文老師為你解讀】柳宗元這首《江雪》展現了孤高自守的品格。', focus: engine.sourceText(item), representation: 'literal', note: '依原文取景', elements: [{ id: 'boat', evidence: '孤舟蓑笠翁' }],
  yijing: { emotion: 'solitude', time: 'day', season: 'winter', weather: 'snow', viewpoint: 'pingyuan', scale: 'vast', emptiness: .85, focal: 'boat', reading: '千山萬徑一片死寂，唯孤舟老翁獨釣寒江，天地愈大人愈小，寄寓貶謫後孤高不屈的心境。', composition: '孤舟置於三分點，大片留白為雪。' } };
const okBody = { gemini: { candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }, openai: { choices: [{ message: { content: JSON.stringify(reply) } }] }, claude: { content: [{ type: 'text', text: JSON.stringify(reply) }] } };

(async () => {
  for (const provider of ['gemini', 'openai', 'claude']) {
    const cfg = { provider, key: C.PROVIDERS[provider].keyPrefix + 'TESTKEY', model: C.PROVIDERS[provider].models[0][0], label: C.PROVIDERS[provider].label, short: C.PROVIDERS[provider].short };
    if (provider === 'openai') Object.assign(cfg, { route: 'openrouter', base: 'https://openrouter.ai/api/v1', key: 'sk-or-v1-TESTKEY' });
    // 釋義請求格式
    calls = []; responder = () => ({ status: 200, body: okBody[provider] });
    const r = await C.analyze(item, local, 'data:image/png;base64,AAAA', cfg);
    assert(r && r.cloudProvider.includes(cfg.model), provider + ' analyze');
    const { url, init } = calls[0], body = JSON.parse(init.body);
    if (provider === 'gemini') {
      assert(url.endsWith('/models/' + cfg.model + ':generateContent')); assert.equal(init.headers['x-goog-api-key'], cfg.key);
      assert.equal(body.generationConfig.responseMimeType, 'application/json'); assert(body.generationConfig.responseSchema.properties.yijing);
      assert.equal(body.contents[0].parts[1].inlineData.mimeType, 'image/png'); assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'low');
    }
    if (provider === 'openai') {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions'); assert.equal(init.headers.Authorization, 'Bearer ' + cfg.key); assert.equal(body.model, 'openai/gpt-6-luna');
      assert.equal(body.response_format.type, 'json_schema'); assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.messages[1].content[1].type, 'image_url'); assert(!('temperature' in body));
    }
    if (provider === 'claude') {
      assert.equal(url, 'https://api.anthropic.com/v1/messages'); assert.equal(init.headers['x-api-key'], cfg.key);
      assert.equal(init.headers['anthropic-version'], '2023-06-01'); assert.equal(init.headers['anthropic-dangerous-direct-browser-access'], 'true');
      assert.equal(body.output_config.format.type, 'json_schema'); assert.equal(body.messages[0].content[0].type, 'image');
    }
    // 名篇校訂不被雲端覆寫
    assert.equal(r.yijing.reading, local.yijing.reading, provider + ' curated reading kept');

    // 結構化輸出被拒（400）時改以純文字 JSON 再試一次
    calls = []; let n = 0;
    responder = () => (++n === 1 ? { status: 400, body: { error: { message: 'Invalid schema for response_format' } } } : { status: 200, body: provider === 'gemini' ? { candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(reply) + '\n```' }] } }] } : provider === 'openai' ? { choices: [{ message: { content: '以下為結果：' + JSON.stringify(reply) } }] } : { content: [{ type: 'text', text: JSON.stringify(reply) }] } });
    assert(await C.analyze(item, local, null, cfg)); assert.equal(calls.length, 2, provider + ' retry without schema');

    // 錯誤說明
    for (const [status, msg, re] of [[401, 'invalid api key', /金鑰無效/], [404, 'model not found', /找不到這個模型/], [429, 'Rate limit', /頻繁|上限/], [429, 'insufficient_quota: exceeded your current quota, check billing', /額度|付費/]]) {
      responder = () => ({ status, body: { error: { message: msg } } });
      await assert.rejects(C.analyze(item, local, null, cfg), e => re.test(e.message), provider + ' ' + status);
    }
    // 測試連線：模型查詢＋極短生成
    calls = []; responder = (u, i) => ({ status: 200, body: i.method === 'POST' ? (provider === 'gemini' ? { candidates: [{ content: { parts: [{ text: '墨韻連線' }] } }] } : provider === 'openai' ? { choices: [{ message: { content: '墨韻連線' } }] } : { content: [{ type: 'text', text: '墨韻連線' }] }) : /\/models$/.test(u) ? { data: [{ id: 'openai/gpt-6-luna' }] } : { id: cfg.model } });
    const t = await C.testConnection(cfg);
    assert(t.ok, provider + ' test ok ' + JSON.stringify(t)); assert.equal(calls.length, provider === 'openai' ? 3 : 2); assert(!calls[0].init.method, provider + ' step 1 is a GET lookup');
    responder = () => ({ status: 401, body: { error: { message: 'invalid x-api-key' } } });
    const bad = await C.testConnection(cfg); assert(!bad.ok && /金鑰無效/.test(bad.steps.at(-1).text));
  }
  // 網路被阻擋
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  const net = await C.testConnection({ provider: 'claude', key: 'sk-ant-x', model: 'claude-sonnet-5-5', label: 'Anthropic Claude', short: 'Claude' });
  assert(!net.ok && /無法連到/.test(net.steps.at(-1).text));
  // OpenAI 官方端點被瀏覽器擋下時，明確指引改用 OpenRouter
  const official = await C.testConnection({ provider: 'openai', route: 'official', base: 'https://api.openai.com/v1', key: 'sk-x', model: 'gpt-6-luna', label: 'OpenAI GPT', short: 'GPT' });
  assert(!official.ok && /OpenRouter/.test(official.steps.at(-1).text));
  // 舊版 Gemini 金鑰搬移
  assert.equal(C.getConfig().provider, 'local');
  console.log(JSON.stringify({ providers: Object.keys(C.PROVIDERS), models: Object.values(C.PROVIDERS).map(p => p.models.map(m => m[0])), result: 'PASS' }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
