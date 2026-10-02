/* 墨韻・雲端 AI 大腦：Google Gemini／OpenAI GPT／Anthropic Claude 三家共用介面
 * - 金鑰只存於使用者瀏覽器（localStorage），由瀏覽器直接呼叫各家官方 API。
 * - 三家都以 JSON Schema 結構化輸出回傳釋義，回覆再交由 literary_engine.validateCloudPlan 逐項回查原文。
 * - 測試連線分兩步：①查詢模型（不耗額度，確認金鑰與模型代碼）②極短生成（確認額度與計費已開通）。
 */
(function (root) {
  'use strict';

  const PROVIDERS = {
    gemini: {
      label: 'Google Gemini', short: 'Gemini', keyPrefix: 'AIza', keyHint: '貼上 Gemini API Key（AIza 開頭）',
      keyUrl: 'https://aistudio.google.com/app/apikey', docUrl: 'https://ai.google.dev/gemini-api/docs',
      models: [
        ['gemini-3.8-flash', 'Gemini 3.8 Flash（推薦・速度與品質均衡）'],
        ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite（最省額度）'],
        ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview（深度釋義，較慢）'],
        ['gemini-2.5-flash', 'Gemini 2.5 Flash（舊版，僅限既有使用者）']
      ],
      steps: [
        '以 Google 帳號登入 Google AI Studio（若學校 Workspace 帳號被管理員關閉 AI Studio，請改用個人帳號）。',
        '點「Create API key／建立 API 金鑰」，選擇或新建一個 Google Cloud 專案。',
        '複製 AIza 開頭的金鑰貼到上方。免費層有每分鐘與每日用量上限，課堂大量使用可在 AI Studio 設定付費。'
      ]
    },
    openai: {
      label: 'OpenAI GPT', short: 'GPT', keyPrefix: 'sk-', keyHint: '貼上 API Key',
      keyUrl: 'https://openrouter.ai/settings/keys', docUrl: 'https://openrouter.ai/docs',
      models: [
        ['gpt-6-luna', 'GPT-6 Luna（推薦・快速省額度）'],
        ['gpt-6.1-sol', 'GPT-6.1 Sol（品質與成本平衡）'],
        ['gpt-6-astra', 'GPT-6 Astra（最強，費用最高）']
      ],
      // OpenAI 官方 API 不開放瀏覽器跨網域呼叫（CORS），純網頁需經 OpenRouter 或自架轉接伺服器
      routes: {
        openrouter: { label: 'OpenRouter 轉接（瀏覽器可直連・推薦）', base: 'https://openrouter.ai/api/v1', keyPrefix: 'sk-or-', keyHint: '貼上 OpenRouter API Key（sk-or- 開頭）',
          keyUrl: 'https://openrouter.ai/settings/keys', docUrl: 'https://openrouter.ai/docs',
          steps: [
            'OpenAI 官方 API 不允許網頁直接連線，本頁透過 OpenRouter 轉接呼叫同一批 GPT 模型（依用量計費，費率以 OpenRouter 網站標示為準）。',
            '以 Google 或 Email 登入 OpenRouter，在 Credits 儲值少量額度。',
            '到 Settings → Keys 按「Create Key」，複製 sk-or- 開頭金鑰貼到上方。'
          ] },
        official: { label: 'OpenAI 官方 API（需自備轉接伺服器）', base: 'https://api.openai.com/v1', keyPrefix: 'sk-', keyHint: '貼上 OpenAI API Key（sk- 開頭）',
          keyUrl: 'https://platform.openai.com/api-keys', docUrl: 'https://developers.openai.com/api/docs',
          steps: [
            '注意：OpenAI 官方 API 會擋下瀏覽器直接送出的請求，金鑰本身有效也無法在純網頁中生成；請改用 OpenRouter，或填「自訂端點」接學校或自架的轉接伺服器。',
            '登入 OpenAI Platform（API 與 ChatGPT 訂閱分開計費），在 Billing 儲值。',
            '到 API keys 按「Create new secret key」，複製 sk- 開頭金鑰（只顯示一次）。'
          ] },
        custom: { label: '自訂端點（OpenAI 相容轉接伺服器）', base: '', keyPrefix: '', keyHint: '貼上轉接伺服器要求的金鑰',
          keyUrl: 'https://platform.openai.com/api-keys', docUrl: 'https://developers.openai.com/api/docs/guides/structured-outputs',
          steps: [
            '填入學校或自架的 OpenAI 相容端點（例如 https://你的伺服器/v1），伺服器須允許瀏覽器跨網域（CORS）。',
            '端點需提供 /chat/completions 與 /models；金鑰依該伺服器的規定填寫。'
          ] }
      },
      steps: []
    },
    claude: {
      label: 'Anthropic Claude', short: 'Claude', keyPrefix: 'sk-ant-', keyHint: '貼上 Claude API Key（sk-ant- 開頭）',
      keyUrl: 'https://platform.claude.com/settings/keys', docUrl: 'https://platform.claude.com/docs',
      models: [
        ['claude-sonnet-5-5', 'Claude Sonnet 5.5（推薦・文學釋義細膩）'],
        ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5（快速省額度）'],
        ['claude-opus-5-5', 'Claude Opus 5.5（深度，費用較高）']
      ],
      steps: [
        '登入 Claude Console（platform.claude.com；API 與 Claude Pro／Max 訂閱分開計費）。',
        '在 Billing 購買 API 額度；未購買時測試會出現 400 或 429 的額度提示。',
        '到 Settings → API Keys 按「Create Key」，複製 sk-ant- 開頭金鑰貼到上方。'
      ]
    }
  };

  /* ───────── 設定儲存：每家金鑰分開存放，讀寫失敗時退回記憶體 ───────── */
  const mem = {};
  const store = {
    get(k) { try { const v = localStorage.getItem(k); return v === null ? (mem[k] ?? '') : v; } catch (e) { return mem[k] ?? ''; } },
    set(k, v) { mem[k] = v; try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* 私密瀏覽或停用儲存 */ } }
  };
  // 舊版只支援 Gemini：自動搬移原金鑰
  (function migrate() { const old = store.get('moyun_gemini_api_key'); if (old && !store.get('moyun_key_gemini')) { store.set('moyun_key_gemini', old); if (!store.get('moyun_ai_provider')) store.set('moyun_ai_provider', 'gemini'); } })();

  // 每家（GPT 再依連線方式）分開存放金鑰
  function keySlot(provider, route) { return provider === 'openai' && route && route !== 'official' ? 'moyun_key_openai_' + route : 'moyun_key_' + provider; }
  function getRoute() { const r = store.get('moyun_openai_route'); return PROVIDERS.openai.routes[r] ? r : 'openrouter'; }
  function routeInfo(provider, route) {
    const P = PROVIDERS[provider];
    if (provider !== 'openai') return P;
    const R = P.routes[route || getRoute()];
    return { ...P, ...R, base: route === 'custom' || (!route && getRoute() === 'custom') ? store.get('moyun_openai_base').trim().replace(/\/+$/, '') : R.base };
  }
  function getConfig() {
    const provider = PROVIDERS[store.get('moyun_ai_provider')] ? store.get('moyun_ai_provider') : 'local';
    if (provider === 'local') return { provider: 'local' };
    const P = PROVIDERS[provider], route = provider === 'openai' ? getRoute() : '';
    const model = (store.get('moyun_model_' + provider) || P.models[0][0]).trim();
    const cfg = { provider, route, key: store.get(keySlot(provider, route)).trim(), model, label: P.label, short: P.short };
    if (provider === 'openai') { cfg.base = routeInfo('openai', route).base; if (route === 'openrouter') cfg.label = 'OpenAI GPT（經 OpenRouter）'; }
    return cfg;
  }
  const apiModel = cfg => cfg.provider === 'openai' && cfg.route === 'openrouter' && !cfg.model.includes('/') ? 'openai/' + cfg.model : cfg.model;

  /* ───────── 結構化輸出綱要（標準 JSON Schema，三家共用） ───────── */
  function analysisSchema() {
    const M = root.MoyunLiterary, Y = root.MoyunYijing;
    const yProps = {
      emotion: { type: 'string', enum: Y.ENUMS.emotion }, time: { type: 'string', enum: Y.ENUMS.time },
      season: { type: 'string', enum: Y.ENUMS.season.filter(Boolean).concat('none') }, weather: { type: 'string', enum: Y.ENUMS.weather },
      viewpoint: { type: 'string', enum: Y.ENUMS.viewpoint }, scale: { type: 'string', enum: Y.ENUMS.scale },
      emptiness: { type: 'number' }, focal: { type: 'string' }, reading: { type: 'string' }, composition: { type: 'string' }
    };
    return {
      type: 'object', additionalProperties: false,
      required: ['meaning', 'focus', 'representation', 'note', 'elements', 'yijing'],
      properties: {
        meaning: { type: 'string' }, focus: { type: 'string' },
        representation: { type: 'string', enum: ['literal', 'symbolic', 'calligraphy'] }, note: { type: 'string' },
        elements: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'evidence'], properties: { id: { type: 'string', enum: Object.keys(M.MOTIFS) }, evidence: { type: 'string' } } } },
        yijing: { type: 'object', additionalProperties: false, required: Object.keys(yProps), properties: yProps }
      }
    };
  }
  // Gemini responseSchema 採 OpenAPI 子集：型別大寫、不支援 additionalProperties
  function toGeminiSchema(s) {
    if (Array.isArray(s)) return s.map(toGeminiSchema);
    if (!s || typeof s !== 'object') return s;
    const out = {};
    for (const [k, v] of Object.entries(s)) {
      if (k === 'additionalProperties') continue;
      if (k === 'type') out.type = String(v).toUpperCase();
      else if (k === 'properties') out.properties = Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toGeminiSchema(pv)]));
      else if (k === 'items') out.items = toGeminiSchema(v);
      else out[k] = v;
    }
    return out;
  }

  /* ───────── 錯誤分類：給老師看得懂的原因與處理方式 ───────── */
  class CloudError extends Error { constructor(msg, status, detail) { super(msg); this.status = status; this.detail = detail || ''; } }
  function explain(status, detail, provider) {
    const d = String(detail || '');
    if (/credit|balance|billing|quota|insufficient|exceeded|RESOURCE_EXHAUSTED/i.test(d) || status === 429)
      return status === 429 && !/credit|balance|billing|insufficient/i.test(d) ? '請求過於頻繁或已達用量上限（429）。稍候再試，或到官網查看額度與付費設定。' : '帳戶額度不足或尚未開通付費（' + status + '）。請到官網 Billing 儲值或確認方案。';
    if (status === 401 || /invalid.*key|API key not valid|authentication/i.test(d)) return '金鑰無效（' + status + '）。請確認整串複製、沒有多餘空白，或重新建立金鑰。';
    if (status === 403) return provider === 'gemini' ? '金鑰沒有權限使用此模型（403）。舊版 Gemini 2.5 只開放既有使用者，請改選 3.x 模型；學校帳號也可能被管理員限制。' : '金鑰沒有權限（403）。請確認帳戶狀態或組織權限。';
    if (status === 404 || /not found|does not exist|model_not_found/i.test(d)) return '找不到這個模型代碼（' + status + '）。請改選清單中的其他模型，或到官方文件查最新代碼。';
    if (status === 400) return '服務拒絕了請求參數（400）。可改選其他模型；若訊息提到額度或付費，請先儲值。';
    if (status >= 500) return '服務端暫時異常（' + status + '），請稍後再試。';
    return '連線失敗（' + status + '）。';
  }
  async function send(url, init, provider, timeoutMs) {
    let res;
    try { res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }); }
    catch (e) {
      if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new CloudError('連線逾時（超過 ' + Math.round(timeoutMs / 1000) + ' 秒）。網路較慢時可改用較快的模型。', 0);
      if (provider === 'openai' && /api\.openai\.com/.test(url)) throw new CloudError('OpenAI 官方 API 不允許瀏覽器直接連線（CORS 被拒）。請在「連線方式」改選 OpenRouter，或使用自架轉接伺服器。', 0, String(e && e.message || e));
      throw new CloudError('無法連到 ' + PROVIDERS[provider].label + '：可能是離線、校園網路或防火牆阻擋，或該端點不允許瀏覽器跨網域請求（CORS）。', 0, String(e && e.message || e));
    }
    let data = null, text = '';
    try { text = await res.text(); data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    if (!res.ok) {
      const detail = data?.error?.message || data?.error?.type || data?.message || text.slice(0, 200);
      throw new CloudError(explain(res.status, detail, provider), res.status, detail);
    }
    return data;
  }
  const splitDataUrl = img => { if (!img) return null; const m = /^data:([^;]+);base64,(.*)$/s.exec(img); return m ? { mime: m[1], data: m[2], url: img } : { mime: 'image/jpeg', data: img, url: 'data:image/jpeg;base64,' + img }; };

  /* ───────── 三家請求轉接 ───────── */
  async function generate(cfg, { system, user, image, schema, maxTokens = 6000, timeoutMs = 45000 }) {
    const img = splitDataUrl(image);
    if (cfg.provider === 'gemini') {
      const gen = { maxOutputTokens: maxTokens };
      if (schema) { gen.responseMimeType = 'application/json'; gen.responseSchema = toGeminiSchema(schema); }
      if (/^gemini-3/.test(cfg.model)) gen.thinkingConfig = { thinkingLevel: 'low' };
      const parts = [{ text: user }]; if (img) parts.push({ inlineData: { mimeType: img.mime, data: img.data } });
      const data = await send('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cfg.model) + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }], generationConfig: gen })
      }, 'gemini', timeoutMs);
      const cand = data?.candidates?.[0];
      if (!cand) throw new CloudError('Gemini 沒有回傳內容' + (data?.promptFeedback?.blockReason ? '（' + data.promptFeedback.blockReason + '）' : '') + '。', 200);
      return (cand.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
    }
    if (cfg.provider === 'openai') {
      const content = [{ type: 'text', text: user }]; if (img) content.push({ type: 'image_url', image_url: { url: img.url } });
      const body = { model: apiModel(cfg), messages: [{ role: 'system', content: system }, { role: 'user', content }], max_completion_tokens: maxTokens };
      if (schema) body.response_format = { type: 'json_schema', json_schema: { name: 'moyun_plan', strict: true, schema } };
      if (!cfg.base) throw new CloudError('尚未填入自訂端點網址。', 0);
      const data = await send(cfg.base + '/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key }, body: JSON.stringify(body)
      }, 'openai', timeoutMs);
      const msg = data?.choices?.[0]?.message;
      if (msg?.refusal) throw new CloudError('GPT 拒絕回答：' + msg.refusal, 200);
      return msg?.content || '';
    }
    if (cfg.provider === 'claude') {
      const content = []; if (img) content.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data } }); content.push({ type: 'text', text: user });
      const body = { model: cfg.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] };
      if (schema) body.output_config = { format: { type: 'json_schema', schema } };
      const data = await send('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify(body)
      }, 'claude', timeoutMs);
      return (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    }
    throw new CloudError('尚未選擇雲端 AI。', 0);
  }
  function parseJson(text) {
    try { return JSON.parse(text); } catch (e) { /* 部分模型會包上 ```json 或前後說明 */ }
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(text.slice(a, b + 1));
    throw new CloudError('雲端回覆不是有效的 JSON。', 200);
  }

  /* ───────── 釋義：結構化輸出失敗（400）時，改以提示詞要求 JSON 再試一次 ───────── */
  async function analyze(input, analysis, image = null, cfg = getConfig()) {
    if (cfg.provider === 'local' || !cfg.key) return null;
    const M = root.MoyunLiterary;
    const system = M.SYSTEM_PROMPT, user = M.buildCloudPrompt(input, analysis);
    let raw;
    try { raw = await generate(cfg, { system, user, image, schema: analysisSchema() }); }
    catch (e) {
      if (e.status !== 400 || /credit|balance|billing|quota|api key|authenticat|permission/i.test(e.detail)) throw e;
      raw = await generate(cfg, { system, user: user + '\n\n請只輸出一個 JSON 物件，欄位：meaning, focus, representation, note, elements[{id,evidence}], yijing{emotion,time,season,weather,viewpoint,scale,emptiness,focal,reading,composition}。不要加任何說明文字。', image, schema: null });
    }
    const result = M.validateCloudPlan(parseJson(raw), input, analysis);
    result.cloudProvider = cfg.label + '・' + cfg.model;
    return result;
  }

  /* ───────── 測試連線：①模型查詢 ②極短生成 ───────── */
  async function testConnection(cfg = getConfig()) {
    if (cfg.provider === 'local') return { ok: true, steps: [{ ok: true, text: '使用本機引擎，不需連線。' }] };
    if (!cfg.key) return { ok: false, steps: [{ ok: false, text: '尚未填入金鑰。' }] };
    const P = routeInfo(cfg.provider, cfg.route), steps = [];
    if (P.keyPrefix && !cfg.key.startsWith(P.keyPrefix)) steps.push({ ok: null, text: '提醒：' + P.short + ' 金鑰通常以「' + P.keyPrefix + '」開頭，請確認沒有貼錯服務的金鑰。' });
    const t0 = performance.now();
    try {
      if (cfg.provider === 'gemini') await send('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cfg.model), { headers: { 'x-goog-api-key': cfg.key } }, 'gemini', 15000);
      if (cfg.provider === 'openai' && cfg.route === 'openrouter') {
        await send(cfg.base + '/key', { headers: { Authorization: 'Bearer ' + cfg.key } }, 'openai', 15000);
        const list = await send(cfg.base + '/models', {}, 'openai', 15000);
        if (!(list?.data || []).some(m => m.id === apiModel(cfg))) throw new CloudError('OpenRouter 找不到模型「' + apiModel(cfg) + '」。請改選清單中的其他模型。', 404);
      } else if (cfg.provider === 'openai') {
        if (!cfg.base) throw new CloudError('尚未填入自訂端點網址。', 0);
        await send(cfg.base + '/models/' + encodeURIComponent(cfg.model), { headers: { Authorization: 'Bearer ' + cfg.key } }, 'openai', 15000);
      }
      if (cfg.provider === 'claude') await send('https://api.anthropic.com/v1/models/' + encodeURIComponent(cfg.model), { headers: { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } }, 'claude', 15000);
      steps.push({ ok: true, text: '① 金鑰有效，模型「' + cfg.model + '」可用（' + Math.round(performance.now() - t0) + ' ms）。' });
    } catch (e) { steps.push({ ok: false, text: '① 模型查詢失敗：' + e.message, detail: e.detail }); return { ok: false, steps }; }
    const t1 = performance.now();
    try {
      const text = await generate(cfg, { system: '你是連線測試助手。', user: '請只回覆四個字：墨韻連線', schema: null, maxTokens: 1200, timeoutMs: 30000 });
      steps.push({ ok: true, text: '② 生成測試成功（' + Math.round(performance.now() - t1) + ' ms），回覆：「' + String(text).trim().slice(0, 30) + '」。創作時將使用 ' + cfg.label + ' 補充釋義。' });
      return { ok: true, steps };
    } catch (e) { steps.push({ ok: false, text: '② 生成測試失敗：' + e.message, detail: e.detail }); return { ok: false, steps }; }
  }

  const api = { PROVIDERS, store, getConfig, getRoute, routeInfo, keySlot, apiModel, analysisSchema, toGeminiSchema, generate, analyze, testConnection, parseJson, CloudError };
  root.MoyunCloud = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
