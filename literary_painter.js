/* 墨韻・意境構圖繪畫器
 * 只渲染 scenePlan 中核准的物象；每一筆仍標記 motif 供檢核。
 * 構圖、遠近、留白、墨色與烘托由 scenePlan.yijing（意境解析）決定：
 *   1. 依三遠法與留白比例佈局：地平線、主景側、開放側、主體落點
 *   2. 由遠而近分層：天色烘托 → 日月 → 遠山 → 中山 → 雲氣 → 水 → 中景 → 近岸 → 點景人物 → 天候
 *   3. 主體加重、陪襯減淡；孤寂者縮小、近景小品放大
 * 標記為 ambient 的筆劃只是低墨量的大面積渲染（天色、地色），不構成任何可辨認物象。
 */
(function (root) {
  'use strict';

  const DEFAULT_YIJING = {
    snow_winter: { emotion: 'solitude', sky: 'snow', emptiness: .8, texture: 'none', warmth: 0, ink: { gain: .78, wet: .4, dry: .3 } },
    heroic: { emotion: 'heroic', sky: 'plain', emptiness: .32, texture: 'fupi', warmth: .1, ink: { gain: 1.15, wet: .25, dry: .5 } },
    autumn_sunset: { emotion: 'desolate', sky: 'dusk', emptiness: .55, texture: 'fupi', warmth: .5, ink: { gain: .98, wet: .2, dry: .55 } },
    spring_breeze: { emotion: 'joyful', sky: 'plain', emptiness: .5, texture: 'pima', warmth: .4, ink: { gain: .9, wet: .5, dry: .1 } },
    majestic_peaks: { emotion: 'heroic', sky: 'plain', emptiness: .3, texture: 'fupi', warmth: .1, ink: { gain: 1.1, wet: .3, dry: .45 } },
    vast_river: { emotion: 'longing', sky: 'mist', emptiness: .78, texture: 'none', warmth: 0, ink: { gain: .85, wet: .5, dry: .15 } },
    ethereal: { emotion: 'zen', sky: 'mist', emptiness: .75, texture: 'pima', warmth: 0, ink: { gain: .85, wet: .55, dry: .15 } }
  };
  const LANDSCAPE = ['mountain', 'river', 'pond', 'sea', 'waves', 'desert', 'field', 'waterfall'];

  function renderLiteraryPlan(ctx, plan) {
    const { S: emitStroke, D: emitDot, rr } = ctx;
    const opts = plan.options || {}, ids = new Set(plan.elements.map(e => e.id));
    const has = id => ids.has(id);
    const base = DEFAULT_YIJING[ctx.mood] || DEFAULT_YIJING.ethereal;
    const yj = Object.assign({ time: 'day', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', side: 'left', focal: '', solitary: false, hints: {} }, base, plan.yijing || {});
    const H = yj.hints || {};
    const G = yj.ink?.gain ?? 1, WET = yj.ink?.wet ?? .3, DRY = yj.ink?.dry ?? .3;
    const E = yj.emptiness ?? .6;
    const seed = rr(0, 1000);
    const nz = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7 + seed * .731) * 43758.5453; return v - Math.floor(v); };
    const sn = (i, k = 0) => nz(i, k) * 2 - 1;
    const evidenceOf = id => plan.elements.find(e => e.id === id)?.evidence || '';
    let motif = '', emph = 1, T = null;
    const cl = v => Math.max(0, Math.min(1, v));
    // 畫面在左、題跋在右；橫直幅均使用可控的歸一化座標。
    const X = v => .025 + cl(v) * .57, Y = v => .03 + cl(v) * .91;
    const tf = p => T ? [T.cx + (p[0] - T.ox) * T.s * (T.flip ? -1 : 1), T.cy + (p[1] - T.oy) * T.s] : p;
    const rs = () => T ? Math.max(.4, Math.min(2, T.s)) : 1;
    const S = (pts, o = {}) => {
      if (pts.length < 2) return;
      const ink = (o.ink ?? .9) * G * (motif === 'ambient' ? 1 : emph);
      emitStroke(pts.map(tf).map(p => [X(p[0]), Y(p[1])]), { r: .0024, water: .12, dry: .24, speed: 1.1, after: .025, ...o, r: (o.r ?? .0024) * rs(), ink, motif });
    };
    const D = (a, b, o = {}) => {
      const p = tf([a, b]), ink = (o.ink ?? .9) * G * (motif === 'ambient' ? 1 : emph);
      emitDot(X(p[0]), Y(p[1]), { r: .004, water: .12, after: .015, ...o, r: (o.r ?? .004) * rs(), ink, motif });
    };
    const withT = (t, fn) => { const prev = T; T = t; try { fn(); } finally { T = prev; } };
    const ellipse = (a, b, w, h, o = {}, n = 28) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; p.push([a + Math.cos(t) * w, b + Math.sin(t) * h]); } S(p, o); };
    const as = (id, fn) => { if (!has(id)) return; const pm = motif, pe = emph; motif = id; emph = yj.focal === id ? 1.15 : yj.focal ? .88 : 1; fn(); motif = pm; emph = pe; };
    const ambient = fn => { const pm = motif, pe = emph; motif = 'ambient'; emph = 1; fn(); motif = pm; emph = pe; };

    /* ───────── 1. 佈局：依意境決定開合 ───────── */
    if (!ids.size) {
      // 論說文、書信採題跋構圖：一筆淡墨枯筆作引首，不補入未提及的山、鳥、舟、日月。
      motif = 'abstract_ink';
      S([[.3, .45], [.38, .5], [.48, .56], [.57, .61]], { r: .006, ink: .55, dry: .75 });
      S([[.38, .43], [.47, .48]], { r: .004, ink: .4, dry: .8 });
      return;
    }
    const landscape = [...ids].some(id => LANDSCAPE.includes(id));
    const intimate = yj.scale === 'intimate' || !landscape;
    const sgn = yj.side === 'right' ? 1 : yj.side === 'center' ? 0 : -1;
    const mainX = sgn > 0 ? .7 : sgn < 0 ? .3 : .5;
    const openX = sgn > 0 ? .24 : sgn < 0 ? .76 : .8;
    const dirOpen = sgn === 0 ? 1 : -sgn; // 由主景指向留白的方向
    const vp = yj.viewpoint;
    let horizon = intimate ? .2 : vp === 'gaoyuan' ? .24 : vp === 'shenyuan' ? .3 : (yj.scale === 'vast' ? .34 : .38);
    if (has('desert')) horizon = .24;
    if (has('waterfall')) horizon = .2;
    const hasWater = has('river') || has('pond') || has('sea') || has('waves');
    const shoreY = intimate ? .1 : .13;
    const fig = intimate ? (ids.size <= 4 && !has('house') ? 1.8 : 1.3) : (yj.solitary && yj.scale === 'vast') ? .5 : yj.scale === 'vast' ? .7 : .9; // 人物舟楫比例
    const night = yj.sky === 'night' || yj.time === 'night';

    /* ───────── 2. 山形計畫（先算幾何，供天色避讓） ───────── */
    const mountains = [], snowy0 = yj.sky === 'snow';
    if (has('mountain')) {
      const big = 1.15 - E * .55;
      if (opts.multipleViews) {
        for (let k = 0; k < 4; k++) mountains.push({ cx: .14 + k * .24, base: horizon + .02, h: [.42, .26, .5, .3][k] * big, w: .14 + (k % 2) * .05, layer: k % 2 ? 'mid' : 'near', shape: k % 2 ? 'round' : 'peak' });
      } else if (vp === 'gaoyuan') {
        const cx = sgn === 0 ? .48 : mainX;
        mountains.push({ cx: cx + .16 * dirOpen, base: horizon + .2, h: .34 * big, w: .2, layer: 'far', shape: 'peak' });
        mountains.push({ cx: cx - .2 * dirOpen, base: horizon + .08, h: .32 * big, w: .16, layer: 'mid', shape: 'peak' });
        mountains.push({ cx, base: horizon - .02, h: Math.min(.7, .6 * big + .1), w: .28, layer: 'near', shape: 'peak', main: true });
      } else if (vp === 'shenyuan') {
        mountains.push({ cx: openX * .5 + mainX * .5 + .05 * dirOpen, base: horizon + .32, h: .26 * big + .04, w: .26, layer: 'far', shape: 'peak' });
        mountains.push({ cx: mainX + .08 * dirOpen, base: horizon + .16, h: .3 * big + .04, w: .22, layer: 'mid', shape: 'round' });
        mountains.push({ cx: mainX - .06 * dirOpen, base: horizon - .02, h: .32 * big + .05, w: .2, layer: 'near', shape: 'peak', main: true });
      } else {
        // 平遠：遠山一抹橫在水天之際；留白多時只留遠山
        const n = snowy0 ? 5 : E > .8 ? 3 : 4;
        for (let k = 0; k < n; k++) mountains.push({ cx: snowy0 ? .1 + k * .2 : mainX + (k - .5) * .2 * dirOpen, base: horizon, h: (.1 + nz(k, 3) * .08) * (yj.scale === 'vast' ? 1 : 1.3) * (yj.sky === 'snow' ? 1.6 : 1), w: .13 + nz(k, 4) * .05, layer: 'far', shape: 'round' });
        if (E < .8 || yj.sky === 'snow') mountains.push({ cx: mainX - .04 * dirOpen, base: horizon - .01, h: (yj.sky === 'snow' ? .3 : .22) * big + .06, w: .2, layer: 'mid', shape: 'peak', main: true });
      }
    }
    // 山形：主峰與數個肩峰的疊合，避免幾何三角形；尖峰用於雄奇，圓峰用於江南與遠山
    const bumps = m => m._b || (m._b = (() => {
      const k = mountains.indexOf(m) + 1, arr = [{ c: m.cx, w: m.w * .5, a: 1 }];
      for (let i = 0; i < 3; i++) arr.push({ c: m.cx + sn(k * 7 + i, 201) * m.w * .62, w: m.w * (.22 + .2 * nz(k * 7 + i, 202)), a: .42 + .36 * nz(k * 7 + i, 203) });
      return arr;
    })());
    const prof = (m, x) => {
      const t = (x - m.cx) / m.w; if (Math.abs(t) >= 1) return -1;
      let v = 0;
      for (const b of bumps(m)) { const d = Math.abs((x - b.c) / b.w); v = Math.max(v, b.a * (m.shape === 'round' ? Math.exp(-d * d * 1.1) : Math.exp(-Math.pow(d, 1.55) * 1.6))); }
      v *= Math.min(1, (1 - Math.abs(t)) * 3.2);
      return m.base + m.h * v * (1 + (.03 * Math.sin(x * 29 + m.cx * 9) + .015 * Math.sin(x * 73 + m.cx * 3)) * (1 - Math.abs(t)));
    };
    const ridge = x => mountains.reduce((v, m) => Math.max(v, prof(m, x)), -1);
    // 山體內不染天色；浮在後方的遠山之下留一片隨山形收束的白雲（雲斷山腰），不留矩形空白
    const inMountain = (x, y) => mountains.some(m => { const p = prof(m, x); if (p < 0) return false; const k = Math.min(1, (p - m.base) / (m.h * .5)); return y <= p + .018 * k && y >= m.base - (m.base > horizon + .05 ? .12 : .02) * k; });

    /* 天體位置：在山形之後決定，月輪與落日不壓在山體上；天色烘托據此為月亮留白 */
    const moonX = cl(openX + (intimate ? .02 : 0) * dirOpen), moonR0 = intimate ? .06 : .048;
    const moonPos = has('moon') ? [moonX, Math.min(.9, Math.max(intimate ? .78 : .8, ridge(moonX) + moonR0 + .06))] : null;
    const moonR = moonR0;
    // 夕陽落在山脊之上或水天之際；不可畫在山體前面
    const sunPos = has('sunset') ? [openX, Math.max(horizon + .1, ridge(openX) + .05)] : has('sun') ? [cl(openX + .06 * dirOpen), Math.max(.84, ridge(openX) + .08)] : null;

    /* ───────── 3. 天色烘托（ambient／snow／月）：橫向分層渲染，避開山體與月輪 ───────── */
    const groundY = intimate ? (has('pond') || has('lotus') ? .3 : .16) : horizon;
    const skyFloor = x => hasWater || has('desert') ? horizon + .006 : groundY;
    const washSky = (inkFn, cinFn = () => 0) => {
      for (let y = .985; y > .02; y -= .026) {
        const ink = inkFn(y), cin = cinFn(y);
        if (ink < .004 && cin < .004) continue;
        const runs = []; let run = null;
        for (let x = 0; x <= 1.0001; x += .01) {
          const inMoon = moonPos && Math.hypot(x - moonPos[0], y - moonPos[1]) < moonR * 1.4;
          const ok = y > skyFloor(x) && !inMoon && !inMountain(x, y);
          if (ok) { if (run) run[1] = x; else run = [x, x]; } else if (run) { runs.push(run); run = null; }
        }
        if (run) runs.push(run);
        // 邊緣暈開：每列起訖點錯落、兩側較淡，天頂逐列減淡，避免方形色塊
        const topSoft = Math.min(1, (1 - y) / .14 + .25);
        for (const [a, b] of runs) if (b - a > .025) {
          const inkY = ink * topSoft * (.85 + .3 * nz(y * 70, 1));
          const la = a <= .001 ? a + .012 + .06 * nz(y * 13, 5) : a + .006, lb = b >= .999 ? b - .012 - .06 * nz(y * 17, 6) : b - .006;
          if (lb - la > .02) S([[la, y], [(la + lb) / 2, y + .004 * sn(y * 50, 3)], [lb, y]], { r: .024, ink: inkY, cin: cin * topSoft, water: .88, dry: 0, speed: 7, after: .002 });
        }
      }
    };
    const warm = yj.warmth ?? .3;
    const skyFns = {
      night: [y => .07 + .07 * y],
      snow: [y => .04 + .08 * y],
      rain: [y => .045],
    }[yj.sky];
    if (yj.sky === 'dusk') ambient(() => {
      // 暮色：只在落日一側的天邊淡染赭紅，天頂仍留白
      for (let y = horizon + .02; y < horizon + .28; y += .026) { const k = 1 - (y - horizon) / .28, w = .16 + .2 * k; for (const d of [-1, 1]) S([[openX, y], [cl(openX + d * w * .5), y + .003], [cl(openX + d * w), y]], { r: .024, ink: .01, cin: .075 * k * k * warm + .006 * k, water: .9, dry: 0, fade: .95, speed: 7, after: .003 }); }
    });
    if (skyFns) {
      if (yj.sky === 'snow' && has('snow')) as('snow', () => washSky(...skyFns));
      else ambient(() => washSky(...skyFns));
    }

    /* ───────── 4. 日月 ───────── */
    as('moon', () => {
      const [mx, my] = moonPos;
      if (opts.crescent) { S([[mx + .03, my + .04], [mx - .012, my + .028], [mx - .022, my - .006], [mx + .002, my - .036], [mx + .026, my - .03]], { r: .003, ink: .3, water: .3 }); return; }
      // 烘雲托月：月輪留白，四周以層層淡墨圈染；白晝無夜色時只勾淡輪廓。
      const rings = night || yj.sky === 'snow' ? 3 : 1;
      for (let k = 0; k < rings; k++) ellipse(mx, my, moonR * (1.25 + k * .22), moonR * (1.25 + k * .22) * 1.02, { r: .009 + k * .003, ink: .07 - k * .015, water: .75, dry: 0, speed: 2.4, after: .01 }, 24);
      ellipse(mx, my, moonR, moonR, { r: .0013, ink: .22, water: .35, dry: .1 }, 30);
      if (opts.personShadow) S([[.5, .14], [.6, .12], [.7, .11]], { r: .006, ink: .14, water: .45 });
    });
    as('sun', () => {
      const [sx, sy] = sunPos;
      D(sx, sy, { r: .022, ink: 0, cin: .5, water: .14, hard: 1 });
      if (opts.lightOnMoss) for (let i = 0; i < 9; i++) D(mainX + sn(i, 7) * .12, .2 + nz(i, 8) * .08, { r: .0045, ink: .05, cin: .45, water: .25 });
    });
    as('sunset', () => {
      const [sx, sy] = sunPos;
      for (let k = 0; k < 2; k++) for (const d of [-1, 1]) S([[sx, sy - .01 + k * .03], [cl(sx + d * .2), sy - .008 + k * .03]], { r: .024, ink: 0, cin: (.07 * (yj.warmth ?? .5) + .02) * (1 - k * .5), water: .85, fade: .97, speed: 2.5, after: .01 });
      D(sx, sy, { r: .026, ink: 0, cin: .9, water: .12, hard: 1 });
      if (hasWater) for (let i = 0; i < 6; i++) { const yy = horizon - .02 - i * .03; S([[sx - .05 + i * .006, yy], [sx + .05 - i * .006, yy]], { r: .0035, ink: 0, cin: .5 - i * .06, water: .3 }); }
    });

    /* ───────── 5. 山：遠山如黛不皴，近山皴擦點苔；山腳淡出為雲氣 ───────── */
    const tex = yj.texture || 'pima';
    const snowy = yj.sky === 'snow';
    as('mountain', () => {
      const order = { far: 0, mid: 1, near: 2 };
      [...mountains].sort((a, b) => order[a.layer] - order[b.layer]).forEach((m, mi) => {
        const pts = []; for (let i = 0; i <= 26; i++) { const x = m.cx - m.w + i / 26 * m.w * 2; pts.push([x, Math.max(m.base, prof(m, x))]); }
        const top = pts.reduce((a, b) => b[1] > a[1] ? b : a);
        const ti = pts.indexOf(top), left = pts.slice(0, ti + 1).reverse(), right = pts.slice(ti);
        const mist = yj.sky === 'mist' || yj.weather === 'mist' || has('cloud') || vp === 'shenyuan';
        if (m.layer === 'far') {
          if (snowy) { S(left, { r: .0016, ink: .2, water: .3, fade: .7 }); S(right, { r: .0016, ink: .2, water: .3, fade: .7 }); return; }
          S(pts, { r: .008, ink: .17, water: .75, dry: 0, speed: 2 });
          for (let k = 1; k <= 4; k++) { const yy = m.base + m.h * k * .16; const span = m.w * (.85 - k * .17); S([[m.cx - span, yy], [m.cx, yy + .004], [m.cx + span, yy]], { r: .022, ink: .035, water: .9, dry: 0, speed: 3, after: .006 }); }
          return;
        }
        const near = m.layer === 'near', lineInk = snowy ? .4 : near ? .95 : .62;
        const fadeBase = mist ? .9 : .45;
        S(left, { r: near ? .0036 : .0028, ink: lineInk, water: .18, dry: DRY * .8, fade: fadeBase });
        S(right, { r: near ? .0036 : .0028, ink: lineInk, water: .18, dry: DRY * .8, fade: fadeBase });
        // 次峰：主峰側面再起一道稜線，增加山體結構
        const sub = pts.filter((p, i) => i % 3 === 0).map(([x, y]) => [m.cx + (x - m.cx) * .62 + .03 * dirOpen, m.base + (y - m.base) * .66]);
        S(sub.slice(2, -2), { r: .0022, ink: lineInk * .7, dry: .5, fade: .6 });
        if (snowy) {
          // 雪山不皴：只以幾筆短線示意山石，山體留白即是雪
          for (let k = 0; k < 5; k++) { const p = pts[3 + k * 4]; if (p) S([[p[0], p[1] - .01], [p[0] + .012 * Math.sign(p[0] - m.cx), p[1] - .05]], { r: .0013, ink: .28, dry: .6 }); }
          return;
        }
        // 皴擦：取山體內部的點，依所在坡面方向落筆；留白越多皴越少
        const n = (Math.round((1 - E) * (near ? 52 : 26)) + 8) * (tex === 'midian' ? 2 : 1);
        for (let k = 0; k < n; k++) {
          const x = m.cx + sn(k + mi * 50, 11) * m.w * .78, top = prof(m, x);
          if (top < 0) continue;
          const yTop = top - .012, depth = (top - m.base) * (mist ? .55 : .8), y = yTop - nz(k + mi * 50, 12) * depth * .7;
          const dirx = Math.sign(x - m.cx) || 1, len = .025 + (top - m.base) * .12;
          if (tex === 'pima') S([[x, y], [x + dirx * len * .3, y - len * .55], [x + dirx * len * .15, y - len]], { r: .0014, ink: .32, dry: .6, water: .1 });
          else if (tex === 'fupi') S([[x, y], [x + dirx * len * .25, y - len * .55]], { r: .0042, ink: .42, dry: .8, water: .04 });
          else if (tex === 'midian') D(x, y, { r: .0065, ink: .2, water: .55 });
        }
        // 暈染體積：陰面淡墨，山腰以上，下半留白為雲
        for (let k = 0; k < 2; k++) S([[m.cx - .02 * dirOpen, top[1] - .03 - k * .05], [m.cx - m.w * .45 * dirOpen, m.base + m.h * (.45 - k * .1)]], { r: .016, ink: .07 * (1 + WET * .5), water: .8, dry: 0, speed: 2.4, after: .008 });
        if (near || m.main) for (let k = 0; k < 6; k++) { const p = pts[6 + Math.floor(nz(k, 21) * 14)]; D(p[0] + sn(k, 22) * .006, p[1] + .004, { r: .0028, ink: 1.05, water: .1 }); }
      });
    });

    /* ───────── 6. 瀑布：兩側崖壁加墨，水留白，飛白細線 ───────── */
    as('waterfall', () => {
      const m = mountains.find(x => x.main) || { cx: .5, base: horizon, h: .6 };
      const fx = m.cx + .03 * dirOpen, top = m.base + m.h * .82, bot = horizon - .02;
      // 崖壁分段濃墨、水口與飛瀑留白
      for (let k = 0; k < 4; k++) { const y0 = top - k * (top - bot) / 4, y1 = y0 - (top - bot) / 4 * .85; for (const d of [-1, 1]) S([[fx + d * (.026 + k * .003), y0], [fx + d * (.03 + k * .003) + sn(k, d + 5) * .004, y1]], { r: .003, ink: .85, dry: .65, fade: .3 }); }
      for (let i = 0; i < 4; i++) { const x0 = fx - .014 + i * .009; S([[x0, top - .01], [x0 + sn(i, 3) * .003, (top + bot) / 2], [x0 + sn(i, 4) * .004, bot + .05]], { r: .0009, ink: .2, dry: .85, speed: 2, fade: .5 }); }
      for (let i = 0; i < 5; i++) D(fx + sn(i, 6) * .06, bot + .02 + nz(i, 7) * .03, { r: .014, ink: .04, water: .85 });
    });

    /* ───────── 7. 雲氣：勾雲淡筆，山腰橫斷 ───────── */
    as('cloud', () => {
      const yc = mountains.length ? Math.max(horizon + .15, ridge(mainX) * .62 + horizon * .38) : .72;
      for (let k = 0; k < 3; k++) {
        const x0 = (k % 2 ? openX : mainX) - .14, yy = yc + k * .06, p = [];
        for (let i = 0; i <= 10; i++) { const x = x0 + i * .028; p.push([x, yy + Math.sin(i * 1.3 + k) * .012]); }
        S(p, { r: .0013, ink: .3, water: .3, dry: .2, fade: .5 });
        S(p.map(([x, y]) => [x, y - .012]), { r: .016, ink: .035, water: .85, dry: 0, speed: 2.4 });
      }
    });

    /* ───────── 8. 地與水 ───────── */
    as('desert', () => {
      for (let i = 0; i < 6; i++) { const yy = .1 + i * (horizon - .1) / 6; S([[0, yy + .01], [.25, yy + .03 + sn(i, 1) * .01], [.55, yy + .005], [.8, yy + .025], [1, yy + .012]], { r: .0028 - i * .0003, ink: .5 - i * .06, dry: .72, water: .05 }); }
      S([[0, horizon], [1, horizon + .004]], { r: .0016, ink: .25, dry: .4 });
    });
    const waterId = ['river', 'pond', 'sea', 'waves'].find(has);
    const water = () => {
      const rough = has('waves') && !H.calm, darkWater = snowy || night;
      // 寒江與夜江：水面淡墨烘染，比雪地／月光暗，月影處留白
      if (darkWater) for (let y = horizon - .012; y > shoreY; y -= .026) {
        const segs = moonPos && hasWater ? [[0, moonPos[0] - .03], [moonPos[0] + .03, 1]] : [[0, 1]];
        const k = (y - shoreY) / Math.max(.05, horizon - shoreY);
        for (const [a, b] of segs) if (b - a > .03) S([[a, y], [b, y + .002]], { r: .022, ink: (snowy ? .055 : .065) + .035 * k, water: .88, dry: 0, speed: 7, after: .003 });
      }
      if (moonPos && hasWater) for (let i = 0; i < 5; i++) { const yy = horizon - .03 - i * .035; S([[moonPos[0] - .025 + i * .004, yy], [moonPos[0] + .025 - i * .004, yy]], { r: .0012, ink: .18, water: .2, dry: .3 }); }
      // 遠岸一線、水天相接
      S([[cl(openX - .3), horizon], [cl(openX + .3), horizon + .002]], { r: .0016, ink: .28, water: .3, dry: .3, fade: .3 });
      const n = rough ? 12 : Math.round(3 + (1 - E) * 6);
      for (let i = 0; i < n; i++) {
        const yy = shoreY + .03 + (horizon - shoreY - .05) * (i / n) ** 1.3, w = .05 + (1 - i / n) * .12, cx = openX + sn(i, 31) * .18;
        const p = []; for (let x = cx - w; x <= cx + w; x += .02) p.push([x, yy + Math.sin(x * (rough ? 34 : 22) + i) * (rough ? .018 : .003)]);
        S(p, { r: rough ? .0032 : .0014, ink: rough ? .85 : .3, dry: rough ? .6 : .3, water: rough ? .1 : .2, speed: 1.6 });
      }
      if (rough) for (let i = 0; i < 6; i++) { const x = mainX + dirOpen * (.05 + i * .06), y = shoreY + .06 + nz(i, 2) * .08; S([[x - .03, y], [x - .01, y + .04], [x + .02, y + .045], [x + .03, y + .02], [x + .012, y + .012]], { r: .0026, ink: .8, dry: .55 }); }
      if (intimate) for (let i = 0; i < 4; i++) S([[cl(openX - .18 + i * .04), shoreY + .02 + i * .028], [cl(openX + .1 + i * .03), shoreY + .024 + i * .028]], { r: .0012, ink: .28, dry: .4 });
    };
    if (waterId) as(waterId, water);
    as('field', () => {
      const y0 = shoreY + .02, y1 = Math.min(horizon, .34);
      for (let i = 0; i < 6; i++) { const yy = y0 + (y1 - y0) * i / 6; S([[mainX - .3, yy], [mainX + .32, yy + .012]], { r: .0015, ink: .45 - i * .04, dry: .4 }); }
      for (let i = 0; i < 26; i++) { const a = mainX + sn(i, 1) * .28, b = y0 + nz(i, 2) * (y1 - y0); S([[a, b], [a + (opts.withered ? .02 : .006), b + .022 * (1 - (b - y0) / (y1 - y0) * .6)]], { r: .0011, ink: opts.withered ? .45 : .6, dry: opts.withered ? .7 : .3 }); }
    });
    // 古道自前景斜向留白側的天邊：行旅者沿路走向「天涯」
    const pathPts = [[cl(mainX + .02 * dirOpen), .0], [cl(mainX + .16 * dirOpen), .07], [cl(openX - .06 * dirOpen), .15], [cl(openX + .1 * dirOpen), horizon - .015]];
    as('path', () => {
      S(pathPts, { r: .0018, ink: .45, dry: .6 }); S(pathPts.map(([x, y], i) => [x + (.07 - i * .02) * dirOpen, y]), { r: .0014, ink: .32, dry: .6 });
    });

    /* ───────── 9. 坡岸：每一處坡岸都屬於站在上面的物象 ───────── */
    const bank = (cx, cy, w, o = {}) => {
      S([[cx - w, cy - .004], [cx - w * .4, cy + .02], [cx + w * .3, cy + .016], [cx + w, cy - .006]], { r: .0026, ink: snowy ? .5 : .8, dry: .55, ...o });
      if (!snowy) for (let k = 0; k < 3; k++) S([[cx - w * .6 + k * w * .45, cy + .01], [cx - w * .5 + k * w * .45, cy - .01]], { r: .0016, ink: .4, dry: .7 });
      S([[cx - w * .8, cy - .008], [cx + w * .8, cy - .006]], { r: .012, ink: snowy ? 0 : .05, water: .8, dry: 0 });
    };

    /* ───────── 10. 樹木 ───────── */
    const perches = [];
    const trunk = (a, b, h, lean = 0, r = .004) => {
      const p = [[a, b], [a + lean * .3 + .006, b + h * .35], [a + lean * .6 - .006, b + h * .68], [a + lean, b + h]];
      S(p, { r, ink: 1.1, dry: .5, water: .08 });
      S(p.map(([x, y], i) => [x + .007 * (1 - i / 3), y]), { r: r * .45, ink: .6, dry: .7 });
      return p;
    };
    const branches = (a, b, h, lean, n, len, cb) => {
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? -1 : 1, by = b + h * (.42 + i * .55 / n), bx = a + lean * ((by - b) / h);
        const ex = bx + side * len * (.6 + .5 * nz(i, 41)), ey = by + len * (.35 + .4 * nz(i, 42));
        const mid = [bx + (ex - bx) * .5 + .008 * side, by + (ey - by) * .35];
        S([[bx, by], mid, [ex, ey]], { r: .0018, ink: .9, dry: .45 });
        const tx = ex + side * len * .3, ty = ey + len * .25 * (nz(i, 43) - .3);
        S([[ex, ey], [tx, ty]], { r: .0011, ink: .8, dry: .5 });
        S([mid, [mid[0] + side * len * .25, mid[1] + len * .35]], { r: .0011, ink: .8, dry: .5 });
        cb && cb(ex, ey, side, i); perches.push([tx, ty]);
      }
    };
    const leafCluster = (x, y, size, i, o = {}) => {
      const season = yj.season, red = H.redLeaves && !opts.withered;
      const cnt = season === 'autumn' ? 7 : season === 'summer' ? 14 : 11;
      for (let j = 0; j < cnt; j++) {
        const px = x + sn(i * 13 + j, 51) * size, py = y + sn(i * 13 + j, 52) * size * .7;
        // 胡椒點：春潤淡、夏濃密、秋疏而可帶朱
        if (season === 'spring' || o.soft) D(px, py, { r: .0042, ink: .3, water: .45, cin: red ? .5 : 0 });
        else D(px, py, { r: .0034, ink: red && j % 2 ? .12 : season === 'summer' ? .8 : .6, cin: red ? .8 : 0, water: .2 });
      }
    };
    const treeAt = (a, b, h, kind) => {
      const lean = sn(a * 100, 5) * .04;
      if (kind === 'bare') {
        trunk(a, b, h, lean, .0055);
        branches(a, b, h, lean, 6, h * .32);
        if (H.fallingLeaves) for (let i = 0; i < 12; i++) S([[a + dirOpen * (.04 + nz(i, 61) * .3), b + h * (.3 + nz(i, 62) * .7)], [a + dirOpen * (.05 + nz(i, 61) * .3), b + h * (.28 + nz(i, 62) * .7)]], { r: .0018, ink: .7, dry: .4 });
        return;
      }
      if (kind === 'pine') {
        const p = trunk(a, b, h, lean + .03 * dirOpen, .0048);
        for (let k = 0; k < 5; k++) { const y = b + h * (.18 + k * .14); S([[a + lean * .5 - .004, y], [a + lean * .5 + .004, y + .006]], { r: .0012, ink: .6, dry: .7 }); }
        for (let k = 0; k < 5; k++) {
          const cy = b + h * (.5 + k * .12), cx = a + lean * ((cy - b) / h) + (k % 2 ? -1 : 1) * .045;
          S([[a + lean * ((cy - b) / h), cy - .01], [cx, cy]], { r: .0016, ink: .9, dry: .4 });
          for (let j = 0; j < 9; j++) { const t = Math.PI * (.1 + .8 * j / 8); S([[cx, cy], [cx + Math.cos(t) * .03, cy + Math.sin(t) * .016]], { r: .001, ink: .95, dry: .3 }); }
          S([[cx - .03, cy + .004], [cx + .03, cy + .004]], { r: .01, ink: .07, water: .8, dry: 0 });
          perches.push([cx, cy + .015]);
        }
        return;
      }
      if (kind === 'willow') {
        trunk(a, b, h * .6, lean, .0045);
        for (let i = 0; i < 18; i++) { const x0 = a + lean * .6 + sn(i, 71) * .06, y0 = b + h * (.55 + nz(i, 72) * .15); S([[x0, y0], [x0 + sn(i, 73) * .03, y0 - .02], [x0 + sn(i, 74) * .04, y0 - h * (.3 + nz(i, 75) * .25)]], { r: .0011, ink: yj.season === 'spring' ? .45 : .6, water: .35, dry: .1 }); }
        return;
      }
      trunk(a, b, h, lean, .0048);
      const withered = opts.withered || yj.season === 'winter';
      branches(a, b, h, lean, 5, h * .3, (ex, ey, side, i) => { if (!withered) leafCluster(ex, ey, .03 + h * .05, i); });
    };
    const nearSlots = [];
    const slot = (w = .14) => { const k = nearSlots.length; const x = cl(sgn === 0 ? mainX + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * w : mainX + dirOpen * k * w * .85); nearSlots.push(x); return x; };
    const treeH = intimate ? .52 : vp === 'gaoyuan' ? .26 : .34;
    let treeBase = intimate ? shoreY : shoreY + .02;
    const highBank = H.onHeight && !has('mountain');
    if (highBank) {
      // 登高：主景側為高崖，人與樹立於崖頂，江水遠在崖下
      treeBase = .42;
      const owner = has('person') ? 'person' : has('bare_tree') ? 'bare_tree' : [...ids][0];
      as(owner, () => {
        const c = [[cl(mainX - .2 * dirOpen), treeBase + .005], [cl(mainX + .05 * dirOpen), treeBase + .012], [cl(mainX + .16 * dirOpen), treeBase - .01], [cl(mainX + .19 * dirOpen), treeBase - .12], [cl(mainX + .16 * dirOpen), treeBase - .26], [cl(mainX + .2 * dirOpen), .06]];
        S(c, { r: .0036, ink: .95, dry: .65 });
        for (let k = 0; k < 7; k++) { const y = treeBase - .03 - k * .05, x0 = mainX + (.15 - k * .004) * dirOpen; S([[x0, y], [x0 - .05 * dirOpen, y - .03]], { r: .0024, ink: .5, dry: .75 }); }
      });
    }

    /* 中景（遠岸人家、亭、橋） */
    const midY = hasWater ? horizon - .03 : Math.max(shoreY + .1, horizon - .06);
    as('house', () => {
      const night = yj.sky === 'night';
      const far = hasWater && !intimate;
      const bx = has('bridge') ? cl(mainX + .3 * dirOpen) : cl(mainX + .14 * dirOpen);
      const a = far ? bx : cl(mainX + (intimate ? -.04 * dirOpen : .1 * dirOpen)), b = far ? midY : intimate ? groundY - .01 : shoreY + .02, s = far ? .55 : intimate ? 1.05 : 1;
      withT({ ox: 0, oy: 0, cx: a, cy: b, s }, () => {
        if (!far) bank(0, -.004, .11);
        S([[-.085, .075], [-.05, .12], [.055, .125], [.095, .078]], { r: .006, ink: .95, water: .25, dry: .55 });
        S([[-.07, .085], [.08, .088]], { r: .0018, ink: .7 });
        S([[-.065, .076], [-.065, 0], [.07, 0], [.07, .078]], { r: .0024, ink: .8 });
        S([[-.035, .005], [-.035, .055], [.002, .055], [.002, .005]], { r: .0016, ink: .7 });
        S([[.025, .03], [.055, .03], [.055, .055], [.025, .055], [.025, .03]], { r: .0013, ink: .6 });
        if (opts.withered) S([[-.06, .13], [-.01, .11], [.07, .14]], { r: .003, dry: .75, ink: .7 });
        if (night && (has('lamp') || opts.warm)) D(.04, .043, { r: .006, ink: 0, cin: .7, water: .4 });
      });
    });
    as('pavilion', () => {
      const a = cl(mainX + .05 * dirOpen), b = mountains.length ? Math.max(midY, prof(mountains.find(m => m.main) || mountains[0], a) - .05) : midY;
      withT({ ox: .23, oy: .4, cx: a, cy: b, s: .8 }, () => {
        for (let level = 0; level < 2; level++) { const yy = .4 + level * .12, ww = .13 - level * .035; S([[.23 - ww, yy + .12], [.23 - ww * .5, yy + .1], [.23, yy + .13], [.23 + ww * .5, yy + .1], [.23 + ww, yy + .12]], { r: .003 }); S([[.23 - ww * .6, yy + .1], [.23 - ww * .6, yy], [.23 + ww * .6, yy], [.23 + ww * .6, yy + .1]], { r: .002 }); }
      });
    });
    as('bridge', () => {
      const a = cl(mainX + .2 * dirOpen), b = hasWater ? Math.max(shoreY + .06, horizon - .1) : shoreY + .05;
      withT({ ox: .535, oy: .29, cx: a, cy: b, s: .55 }, () => { S([[.3, .25], [.4, .31], [.54, .34], [.68, .3], [.77, .24]], { r: .003 }); S([[.3, .23], [.44, .28], [.62, .28], [.77, .22]], { r: .002 }); S([[.42, .3], [.42, .33]], { r: .0015 }); S([[.62, .3], [.62, .33]], { r: .0015 }); });
    });
    as('wall', () => { const a = mainX; S([[a - .1 * dirOpen, shoreY], [a - .1 * dirOpen, .62], [a + .2 * dirOpen, .62]], { r: .0025, ink: .55, dry: .4 }); S([[a - .1 * dirOpen, shoreY], [a + .25 * dirOpen, shoreY]], { r: .002, ink: .4, dry: .5 }); });

    /* 近景樹木：依主景側排列，前大後小 */
    const treeKinds = [['bare_tree', 'bare'], ['pine', 'pine'], ['willow', 'willow'], ['tree', 'tree']];
    for (const [id, kind] of treeKinds) as(id, () => {
      const x = slot(); bank(x, treeBase - .01, .09);
      treeAt(x, treeBase, treeH * (id === 'pine' ? 1.15 : 1), kind);
      if (opts.castShadows) for (let i = 0; i < 4; i++) S([[x, treeBase], [x + dirOpen * (.18 + i * .03), treeBase - .06 + i * .012]], { r: .0035, ink: .12, water: .45 });
      // 平遠時遠岸以小點樹呼應，表現距離
      if (id === 'tree' && hasWater && !intimate) for (let i = 0; i < 6; i++) { const fx = cl(openX + dirOpen * .05 + sn(i, 81) * .15); S([[fx, horizon + .002], [fx, horizon + .018 + nz(i, 82) * .01]], { r: .0016, ink: .35, water: .3 }); }
    });
    as('bamboo', () => {
      const x0 = slot(.18), n = intimate ? 5 : 4, hh = intimate ? .62 : treeH * 1.2, wind = yj.weather === 'wind' ? 1 : 0;
      if (!has('stone')) bank(x0, treeBase - .01, .1);
      for (let k = 0; k < n; k++) {
        const a = x0 + (k - n / 2) * .04 * -dirOpen, h = hh * (.75 + .35 * nz(k, 91)), segs = 7, ink = k % 2 ? .55 : 1;
        for (let i = 0; i < segs; i++) { const y = treeBase + i * h / segs; S([[a, y + .004], [a + .003, y + h / segs - .004]], { r: .0026, ink }); D(a + .002, y + h / segs, { r: .0024, ink: ink * 1.1 }); }
        // 竹葉「个」「介」字組：小枝出節，三四片葉自一點下垂撇出，濃淡分前後
        for (let i = 3; i < segs; i++) {
          const y = treeBase + h * (i / segs), dir = wind ? dirOpen : (i + k) % 2 ? -1 : 1;
          const tx = a + dir * .022, ty = y + .012;
          S([[a, y], [tx, ty]], { r: .0011, ink: ink * .8 });
          for (let j = 0; j < 4; j++) {
            const ang = (wind ? -.15 - j * .18 : -.35 - j * .32), len = .042 - j * .004;
            S([[tx, ty], [tx + dir * Math.cos(ang) * len * .5, ty + Math.sin(ang) * len * .5 + .003], [tx + dir * Math.cos(ang) * len, ty + Math.sin(ang) * len]], { r: .0042, ink: ink * (j % 2 ? .75 : 1), dry: .1, water: .1 });
          }
        }
      }
      if (opts.castShadows) for (let i = 0; i < 5; i++) S([[x0 + i * .03, treeBase], [x0 + dirOpen * .2 + i * .03, treeBase - .07]], { r: .003, ink: .14, water: .45 });
    });
    as('plum', () => {
      const natural = !!opts.naturalGrowth, ink = opts.plumColor === 'ink';
      const ax = cl(mainX - .08 * dirOpen), ay = intimate ? .08 : treeBase;
      if (natural) {
        S([[.48, .12], [.486, .25], [.477, .4], [.492, .55], [.488, .7], [.476, .82]], { r: .0036, ink: 1.15, dry: .65, water: .05 });
        for (let i = 0; i < 9; i++) { const b = .26 + i * .055, a = .48, side = i % 2 ? -1 : 1, end = [a + side * (.06 + .09 * nz(i, 1)), b + .08 + .09 * nz(i, 2)]; S([[a, b], [a + (end[0] - a) * .48, b + (end[1] - b) * .42], end], { r: .0015, ink: .8, dry: .55, water: .06 }); for (let t = 0; t < 3; t++) { const p = [a + (end[0] - a) * (.42 + t * .16), b + (end[1] - b) * (.42 + t * .16)]; S([p, [p[0] + side * .027, p[1] + .035 + t * .006]], { r: .0009, ink: .65, dry: .6, water: .06 }); } }
        return;
      }
      // 梅幹自一側斜出，向留白伸展；老幹枯筆、新枝挺直、花五瓣圈點。近景小品放大為折枝構圖。
      const ik = intimate ? 1.55 : 1;
      withT({ ox: ax, oy: ay, cx: ax, cy: ay, s: ik }, () => {
      const main = [[ax, ay], [ax + .05 * dirOpen, ay + .12], [ax + .03 * dirOpen, ay + .26], [ax + .14 * dirOpen, ay + .4], [ax + .3 * dirOpen, ay + .5]];
      S(main, { r: .0052, ink: 1.15, dry: .7, water: .05 });
      const tips = [];
      for (let i = 0; i < 7; i++) {
        const p = main[1 + (i % 4)], up = i % 2 ? 1 : -.4;
        const e = [p[0] + dirOpen * (.06 + .08 * nz(i, 3)), p[1] + .05 + .1 * nz(i, 4) * (up > 0 ? 1 : .4)];
        S([p, [e[0] - dirOpen * .02, (p[1] + e[1]) / 2 + .01], e], { r: .0016, ink: .85, dry: .55 });
        S([e, [e[0] + dirOpen * .01, e[1] + .045]], { r: .0009, ink: .75, dry: .4 }); tips.push(e, [e[0] + dirOpen * .01, e[1] + .045]);
      }
      tips.forEach(([fx, fy], j) => {
        if (j % 3 === 2) { D(fx, fy, { r: .003, ink: ink ? .5 : 0, cin: ink ? 0 : .6 }); return; }
        for (let k = 0; k < 5; k++) D(fx + Math.cos(k * 1.256) * .009, fy + Math.sin(k * 1.256) * .006, { r: .003, ink: ink ? .26 : 0, cin: ink ? 0 : .7, water: .2 });
        D(fx, fy, { r: .0012, ink: .9 });
      });
      });
    });
    as('peach', () => {
      const x = slot(); bank(x, treeBase - .01, .09); treeAt(x, treeBase, treeH, 'bare');
      for (let i = 0; i < 30; i++) D(x + sn(i, 1) * .12, treeBase + treeH * (.45 + nz(i, 2) * .5), { r: .0038, ink: .04, cin: .7, water: .25 });
      if (/落英|繽紛/.test(evidenceOf('peach') + (plan.focus || ''))) for (let i = 0; i < 10; i++) D(x + dirOpen * nz(i, 5) * .25, shoreY + nz(i, 6) * .1, { r: .0026, ink: 0, cin: .55 });
    });
    as('fence', () => { const x = slot(.2); for (let i = 0; i < 8; i++) S([[x - .12 + i * .032, shoreY], [x - .12 + i * .032, shoreY + .1]], { r: .0016 }); S([[x - .13, shoreY + .05], [x + .13, shoreY + .052]], { r: .0016 }); S([[x - .13, shoreY + .08], [x + .13, shoreY + .082]], { r: .0013, ink: .7 }); });
    as('chrysanthemum', () => {
      const x0 = cl(mainX + .02 * dirOpen);
      for (let i = 0; i < 5; i++) { const a = x0 + (i - 2) * .045, b = shoreY, h = .1 + (i % 2) * .05; S([[a, b], [a - .01, b + h * .5], [a + .005, b + h]], { r: .0016, ink: .7 }); for (let j = 0; j < 12; j++) { const t = j * Math.PI / 6; S([[a, b + h], [a + Math.cos(t) * .022, b + h + Math.sin(t) * .013]], { r: .0013, ink: .45, cin: .22 }); } S([[a - .015, b + h * .5], [a - .03, b + h * .55]], { r: .004, ink: .5, water: .4 }); }
    });
    as('flower', () => { for (let i = 0; i < 16; i++) { const a = mainX + sn(i, 1) * .25, b = opts.fallenFlowers ? shoreY + nz(i, 2) * .06 : shoreY + .02 + nz(i, 2) * .06; if (!opts.fallenFlowers) S([[a, b - .03], [a + .003, b]], { r: .0012, ink: .5 }); D(a, b, { r: .0028, ink: .3, cin: yj.season === 'autumn' ? .15 : .35 }); } });
    as('reeds', () => { for (let i = 0; i < 16; i++) { const a = mainX + dirOpen * (.02 + i * .016), b = shoreY + .01, h = .12 + nz(i, 1) * .14; S([[a, b], [a + .012 * dirOpen, b + h * .6], [a + .02 * dirOpen, b + h]], { r: .0013, ink: .6 }); S([[a + .02 * dirOpen, b + h], [a + .035 * dirOpen, b + h + .03], [a + .01 * dirOpen, b + h + .012]], { r: .0018, ink: .32, dry: .6 }); } });
    // 荷：莖出水面，葉為濕墨大筆（側看橢圓、葉脈數筆），花以淡墨勾瓣、朱色輕染
    let lotusTop = null;
    as('lotus', () => {
      const n = opts.lotusBud ? 1 : opts.lotusCount || (intimate ? 3 : 4), k = intimate ? 1.6 : 1;
      const water0 = shoreY + .02, x0 = cl(openX - (intimate ? .16 : .1) * dirOpen);
      for (let i = 0; i < n; i++) {
        const a = cl(x0 + dirOpen * (i - (n - 1) / 2) * .075 * k), b = water0 + (i % 2) * .012, h = (opts.lotusBud ? .16 : .07 + (i % 3) * .035) * k;
        S([[a, b], [a - .006 * k, b + h * .5], [a + .003 * k, b + h]], { r: .0016 * k, ink: .75 });
        if (opts.lotusBud) { S([[a - .012 * k, b + h + .01 * k], [a, b + h + .042 * k], [a + .012 * k, b + h + .01 * k], [a, b + h], [a - .012 * k, b + h + .01 * k]], { r: .0018, ink: .7 }); D(a, b + h + .02 * k, { r: .005 * k, ink: 0, cin: .25, water: .4 }); lotusTop = [a, b + h + .042 * k]; continue; }
        const isFlower = i % 2 === 1 || n === 1;
        if (!isFlower) {
          const lw = .045 * k, lh = .014 * k;
          S([[a - lw, b + h], [a - lw * .4, b + h + lh], [a + lw * .5, b + h + lh * .9], [a + lw, b + h - lh * .2]], { r: .0022, ink: .75, water: .3 });
          S([[a - lw * .9, b + h - .002], [a + lw * .9, b + h + .002]], { r: .013 * k, ink: .2, water: .65, dry: .1 });
          for (let j = 0; j < 4; j++) S([[a, b + h + .002], [a - lw * .8 + j * lw * .53, b + h + lh * .6]], { r: .0008, ink: .5 });
        } else {
          const fy = b + h, fw = .016 * k;
          for (let j = 0; j < 4; j++) { const off = (j - 1.5) * fw * .55; S([[a + off * .3, fy], [a + off * 1.3, fy + fw * 1.1], [a + off * .6, fy + fw * 2.1]], { r: .0013, ink: .55 }); }
          D(a, fy + fw, { r: .009 * k, ink: 0, cin: .28, water: .45 });
        }
      }
    });
    as('stone', () => { const x = has('bamboo') ? nearSlots[0] ?? mainX : slot(); for (let i = 0; i < 3; i++) { const a = x + (i - 1) * .09, b = shoreY - .01, s = i === 1 ? 1.4 : 1; S([[a - .04 * s, b], [a - .05 * s, b + .04 * s], [a - .01, b + .08 * s], [a + .05 * s, b + .04 * s], [a + .04 * s, b], [a - .04 * s, b]], { r: .0026, dry: .6, ink: .9 }); S([[a - .02 * s, b + .06 * s], [a + .01 * s, b + .02 * s]], { r: .0016, ink: .5, dry: .7 }); D(a, b + .075 * s, { r: .0025, ink: 1 }); } });
    as('broken_pot', () => { S([[.37, .1], [.33, .04], [.36, .03]], { r: .0025 }); S([[.53, .04], [.57, .06], [.55, .1]], { r: .0025 }); S([[.42, .03], [.46, .06], [.48, .03]], { r: .0018 }); });

    // 平遠水景若近處空無一物，以一抹近岸坡腳定出觀者立足點
    if (waterId && !intimate && !nearSlots.length && !highBank && !has('house')) as(waterId, () => { bank(cl(mainX - .04 * dirOpen), shoreY - .02, .16); S([[cl(mainX - .2 * dirOpen), shoreY - .03], [cl(mainX + .14 * dirOpen), shoreY - .026]], { r: .0016, ink: .35, dry: .5 }); });
    /* ───────── 11. 舟、魚、禽 ───────── */
    const boatPos = (() => {
      if (H.vanishingSail || opts.distantBoat) return [cl(openX + .12 * dirOpen), horizon + .004, .32];
      if (opts.miniature) return [.5, .25, 2.2];
      const y = hasWater ? shoreY + (horizon - shoreY) * (yj.solitary ? .42 : .32) : shoreY + .04;
      return [cl(openX - .04 * dirOpen), y, fig * (intimate ? .8 : 1)];
    })();
    const onBoat = has('boat') && has('person') && !opts.miniature && !(plan.elements.find(e => e.id === 'person')?.evidence || '').match(/岸|籬|田/) && opts.personAction !== 'walk' && opts.personAction !== 'farm';
    as('boat', () => {
      const [a, b, s] = boatPos, ev = evidenceOf('boat');
      const canopy = (night || yj.weather === 'rain' || yj.weather === 'snow') && !/帆/.test(ev);
      withT({ ox: 0, oy: 0, cx: a, cy: b, s }, () => {
        S([[-.075, .018], [-.048, -.002], [.048, -.002], [.08, .022]], { r: .003, ink: 1.15, dry: .3 });
        S([[-.062, .013], [.066, .015]], { r: .0016, ink: .8 });
        S([[-.055, -.012], [.055, -.012]], { r: .002, ink: .16, water: .55 });
        if (canopy) { S([[-.036, .014], [-.03, .042], [.0, .05], [.024, .04], [.03, .015]], { r: .0022, ink: .9 }); S([[-.025, .03], [.022, .03]], { r: .009, ink: .2, water: .5 }); }
        if (/帆/.test(ev)) { S([[0, .01], [0, .17]], { r: .0016, ink: .8 }); S([[.004, .16], [.06, .05], [.004, .05]], { r: .0016, ink: .55 }); }
        if (H.boatLight) { D(.032, .032, { r: .016, ink: 0, cin: .22, water: .6 }); D(.032, .032, { r: .0045, ink: 0, cin: .95, hard: .6 }); }
        if (opts.fastBoat || H.speed) for (let i = 0; i < 3; i++) S([[-.08 - i * .01, .002 + i * .006], [-.2 - i * .04, -.004 + i * .01]], { r: .0012, ink: .35, dry: .6 });
        if (opts.miniature) S([[-.04, .02], [-.025, .1], [.04, .1], [.06, .02]], { r: .002 });
      });
    });
    as('fish', () => { for (let i = 0; i < (opts.fishCount || 3); i++) { const a = openX + dirOpen * (i * .05 - .05), b = shoreY + .03 + (i % 2) * .03; ellipse(a, b, .016, .0055, { r: .0014, ink: .55 }, 16); S([[a + .015, b], [a + .03, b + .01], [a + .028, b - .009], [a + .015, b]], { r: .0012 }); } });
    as('goose', () => withT({ ox: .52, oy: .24, cx: openX, cy: shoreY + .06, s: intimate ? 1.6 : 1 }, () => { ellipse(.52, .24, .08, .025, { r: .0023, ink: .45 }); S([[.56, .255], [.59, .31], [.57, .34], [.61, .34]], { r: .0024, ink: .7 }); S([[.49, .215], [.46, .202], [.53, .209]], { r: .002, ink: 0, cin: .8 }); for (let i = 0; i < 4; i++) S([[.42, .21 - i * .01], [.6, .212 - i * .01]], { r: .0011, ink: .2 }); }));
    as('bird', () => {
      const n = opts.birdCount || (yj.solitary ? 1 : 3);
      if (opts.rooster) { withT({ ox: .48, oy: .32, cx: mainX, cy: .3, s: 1.5 }, () => { ellipse(.48, .32, .07, .045, { r: .003 }); S([[.53, .34], [.56, .43], [.59, .44]], { r: .0028 }); D(.56, .45, { r: .006, cin: 1, ink: 0 }); for (let j = 0; j < 4; j++) S([[.43, .34], [.3 + j * .018, .43 + j * .014]], { r: .002 }); S([[.46, .28], [.46, .2], [.43, .19]], { r: .0018 }); }); return; }
      if (opts.waterBirds) { for (let i = 0; i < n; i++) { const a = openX + dirOpen * i * .06, b = shoreY + .05 + i * .01; ellipse(a, b, .022, .008, { r: .0019 }, 16); S([[a + .018, b], [a + .03, b + .026], [a + .042, b + .025]], { r: .0018 }); } return; }
      const crowsOnTree = (H.crows || has('bare_tree')) && perches.length;
      for (let i = 0; i < n; i++) {
        if (crowsOnTree && i < Math.min(n, perches.length)) { const [px, py] = perches[(i * 3) % perches.length]; D(px, py + .006, { r: .0055, ink: 1.25, water: .08 }); S([[px - .004, py + .008], [px + .008, py + .011]], { r: .002, ink: 1.1 }); continue; }
        const s = (1 - i * .18) * (intimate ? 1.3 : 1);
        const a = cl(openX + dirOpen * (i * .07 - .03) + sn(i, 1) * .02), b = Math.min(.9, (has('moon') && moonPos ? moonPos[1] - .1 : .7) + i * .035 + sn(i, 2) * .02);
        S([[a - .022 * s, b + .01 * s], [a - .008 * s, b + .002 * s], [a, b]], { r: .0018 * s, ink: 1.05, dry: .2 });
        S([[a, b], [a + .01 * s, b + .004 * s], [a + .024 * s, b + .013 * s]], { r: .0018 * s, ink: 1.05, dry: .2 });
        D(a, b - .002, { r: .0026 * s, ink: 1.1 });
        if (opts.birdAction === 'carry_stone') D(a + .006, b - .012, { r: .003, ink: 1 });
      }
      if (opts.egretLine) for (let i = 0; i < 5; i++) { const a = mainX + dirOpen * (.08 + i * .05), b = .62 + i * .045; S([[a - .012, b + .004], [a, b], [a + .012, b + .005]], { r: .0012, ink: .5 }); }
    });

    /* ───────── 12. 點景人物與鞍馬 ───────── */
    let figAnchor = null;
    const figure = (a, b, s, action, face) => {
      // 點景人物：實墨衣袍剪影，頭、肩、袖、衣擺分明，小尺度仍可辨識
      const h = .07 * s, f = face || 1, x = v => a + v * s * f;
      const hat = H.hat || (action === 'fish' && (yj.weather === 'snow' || yj.weather === 'rain'));
      const seated = action === 'qin' || action === 'pipa' || (action === 'fish' && onBoat);
      const bend = action === 'pick_flower' || action === 'farm' || action === 'work' ? .012 : 0;
      const bh = seated ? h * .6 : h, sh = b + bh * .8;
      const up = H.lookUp || action === 'look_moon';
      const head = [x(bend + (up ? -.003 : .002)), sh + h * (up ? .16 : .13)];
      D(head[0], head[1], { r: .0046 * s, ink: 1.3 });
      if (hat) { S([[head[0] - .026 * s, head[1] - .002 * s], [head[0], head[1] + .016 * s], [head[0] + .026 * s, head[1] - .002 * s]], { r: .0026 * s, ink: 1.2 }); }
      S([[x(bend), sh + .004 * s], [x(-.013), sh - bh * .3], [x(-.021), b]], { r: .0024 * s, ink: 1 });
      S([[x(bend), sh + .004 * s], [x(.012), sh - bh * .35], [x(.019), b]], { r: .0024 * s, ink: 1 });
      for (let k = 0; k < 3; k++) S([[x(bend * .8 - .005 + k * .005), sh], [x(-.01 + k * .01), b + .002]], { r: .0034 * s, ink: hat ? .7 : .38, water: .15, dry: hat ? .6 : .15 });
      S([[x(-.021), b], [x(.019), b]], { r: .0022 * s, ink: .9 });
      // 袖與手勢
      if (up) S([[x(.006), sh - .004], [x(.02), sh + h * .1], [x(.016), sh + h * .16]], { r: .0018 * s, ink: .95 });
      else S([[x(.006), sh - .002], [x(.022), sh - bh * .28], [x(.016), sh - bh * .4]], { r: .0026 * s, ink: .95 });
      if (seated) S([[x(-.016), b + .003], [x(.04), b + .006]], { r: .0034 * s, ink: .9 });
      if (action === 'walk') S([[x(.024), sh - bh * .1], [x(.042), b - .006]], { r: .0013 * s, ink: .9 });
      if (action === 'fish') { S([[x(.016), sh - bh * .3], [x(.09), sh + h * .35], [x(.16), sh + h * .45]], { r: .001 * s, ink: .85 }); S([[x(.16), sh + h * .45], [x(.163), b - .03 * s]], { r: .0006 * s, ink: .45 }); }
      if (action === 'farm' || action === 'work') S([[x(.016), sh - bh * .2], [x(.07), b + .012], [x(.05), b]], { r: .002 * s });
      if (action === 'pick_flower') S([[x(.016), sh - bh * .35], [x(.04), b + bh * .2]], { r: .0018 * s });
    };
    as('horse', () => {
      const onPath = has('path') && !intimate, pp = pathPts[1], pq = pathPts[2];
      const a = onPath ? pp[0] + (pq[0] - pp[0]) * .28 : cl(mainX + .14 * dirOpen), b = onPath ? pp[1] + (pq[1] - pp[1]) * .28 : shoreY + .04, s = fig * (intimate ? 1.2 : onPath ? .8 : 1), f = dirOpen;
      withT({ ox: 0, oy: 0, cx: a, cy: b, s }, () => {
        const x = v => v * f;
        S([[x(-.05), .062], [x(-.02), .07], [x(.03), .068], [x(.05), .06]], { r: .0034, ink: 1, dry: .45 });
        S([[x(-.05), .062], [x(-.048), .044], [x(.045), .044], [x(.05), .06]], { r: .0024, ink: .85, dry: .5 });
        S([[x(.05), .062], [x(.07), .08], [x(.085), .07], [x(.095), .045]], { r: .0028, ink: 1 });
        for (const dx of [-.042, -.03, .03, .042]) S([[x(dx), .045], [x(dx + .004), .02], [x(dx), 0]], { r: .0016, ink: .9, dry: .4 });
        S([[x(-.05), .06], [x(-.068), .04], [x(-.062), .02]], { r: .0018, ink: .8, dry: .6 });
      });
    });
    as('person', () => {
      const n = opts.personCount || 1, action = opts.personAction;
      for (let i = 0; i < n; i++) {
        let a, b, s = fig, face = sgn === 0 ? 1 : dirOpen;
        if (opts.miniature) { a = .42 + i * .04; b = .27; s = .55; }
        else if (onBoat && i < 2) { a = boatPos[0] + (i ? -.03 : .01) * boatPos[2]; b = boatPos[1] + .006 * boatPos[2]; s = boatPos[2] * .85; }
        else if (opts.distantPerson && i === n - 1) { a = cl(openX + .1 * dirOpen); b = horizon + .006; s = .38; face = -dirOpen; }
        else if (highBank) { a = cl(mainX + dirOpen * (.08 - i * .05)); b = treeBase + .01; }
        else if (has('path') && !intimate) { const t = .4 + i * .08, p = pathPts[1], q = pathPts[2]; a = p[0] + (q[0] - p[0]) * t; b = p[1] + (q[1] - p[1]) * t; s = fig * .8; }
        else if (has('house') && intimate) { a = cl(mainX + dirOpen * (.17 + i * .07)); b = groundY - .01; }
        else if (has('house') && !hasWater) { a = cl(mainX + dirOpen * (.16 + i * .06)); b = shoreY + .01; }
        else if (has('horse')) { a = cl(mainX + dirOpen * (.22 + i * .05)); b = shoreY + .04; }
        else { a = cl((nearSlots[0] ?? mainX) + dirOpen * (.1 + i * .06)); b = shoreY + .01; if (i === 0 && !nearSlots.length && !intimate) bank(a, b - .006, .07); }
        if (n > 1 && !onBoat && !opts.distantPerson && i % 2) face = -face;
        figure(a, b, s, i === 0 || n <= 2 ? action : (action === 'farm' ? 'farm' : ''), face);
        if (i === 0) figAnchor = [a, b, s, face];
      }
    });
    as('butterfly', () => S([[mainX + .1, .5], [mainX + .07, .54], [mainX + .11, .56], [mainX + .13, .52], [mainX + .17, .56], [mainX + .2, .53], [mainX + .14, .5]], { r: .002 }));
    as('dragonfly', () => { const a = lotusTop ? lotusTop[0] : openX, b = lotusTop ? lotusTop[1] + .012 : shoreY + .235; S([[a, b - .012], [a, b + .015]], { r: .0013 }); S([[a - .036, b + .003], [a, b], [a + .036, b + .005]], { r: .0012 }); S([[a - .027, b - .006], [a, b], [a + .03, b - .006]], { r: .001 }); });

    /* ───────── 13. 器物（隨人物所在） ───────── */
    // 器物隨人物：琴在膝前、杯在手邊；無人物時置於主景旁
    const objX = figAnchor ? cl(figAnchor[0] + figAnchor[3] * .055 * figAnchor[2]) : cl(mainX + dirOpen * .2), objY = figAnchor ? figAnchor[1] + .004 : shoreY + .02, oS = figAnchor ? Math.max(.55, figAnchor[2] * .62) : intimate ? 1.1 : .8;
    as('qin', () => withT({ ox: .48, oy: .25, cx: cl(objX - .02 * dirOpen), cy: objY, s: oS }, () => { S([[.405, .25], [.58, .25], [.56, .27], [.4, .27], [.405, .25]], { r: .0022 }); for (let i = 0; i < 5; i++) S([[.42, .253 + i * .003], [.565, .253 + i * .003]], { r: .0008, ink: .55 }); }));
    as('pipa', () => withT({ ox: .67, oy: .29, cx: objX, cy: objY + .05, s: oS }, () => { ellipse(.67, .29, .027, .045, { r: .0022 }); S([[.67, .33], [.68, .4], [.69, .41]], { r: .002 }); }));
    as('flute', () => withT({ ox: .62, oy: .34, cx: objX, cy: objY + .05, s: oS }, () => S([[.58, .31], [.67, .38]], { r: .0022 })));
    as('cup', () => withT({ ox: .63, oy: .21, cx: objX + .04 * dirOpen, cy: objY, s: oS }, () => { for (let i = 0; i < 2; i++) { const a = .6 + i * .06, b = .21; S([[a - .017, b + .025], [a - .012, b], [a + .012, b], [a + .017, b + .025]], { r: .0017 }); ellipse(a, b + .025, .017, .004, { r: .001 }, 16); } }));
    as('book', () => withT({ ox: .53, oy: .26, cx: objX, cy: objY, s: oS }, () => { S([[.46, .24], [.58, .24], [.6, .28], [.48, .28], [.46, .24]], { r: .002 }); for (let i = 0; i < 5; i++) S([[.48 + i * .02, .245], [.49 + i * .02, .275]], { r: .0008 }); }));
    as('lamp', () => {
      const n = opts.lanterns ? 8 : 1;
      for (let i = 0; i < n; i++) { const a = opts.lanterns ? .1 + i * .11 : objX + .06 * dirOpen, b = opts.lanterns ? .6 + (i % 2) * .07 : objY; S([[a - .02, b], [a + .02, b], [a, b + .018], [a, b + .062]], { r: .0017 }); D(a, b + .064, { r: .012, ink: 0, cin: .25, water: .55 }); D(a, b + .064, { r: .0035, ink: 0, cin: .9 }); }
    });
    as('sword', () => { const a = objX - .06, b = opts.swordUnderwater ? shoreY + .02 : objY + .06; S([[a, b], [a + .15, b + .065], [a + .16, b + .07], [a + .15, b + .05], [a, b - .007], [a, b]], { r: .0015, ink: .85 }); S([[a - .01, b + .015], [a + .005, b - .02]], { r: .002 }); });
    as('chess', () => withT({ ox: .55, oy: .235, cx: objX, cy: objY + .03, s: oS }, () => { S([[.42, .18], [.66, .18], [.68, .29], [.44, .29], [.42, .18]], { r: .0017 }); for (let i = 1; i < 6; i++) { S([[.42 + i * .04, .18], [.44 + i * .04, .29]], { r: .0008, ink: .3 }); S([[.42, .18 + i * .018], [.67, .18 + i * .018]], { r: .0008, ink: .3 }); } for (let i = 0; i < 8; i++) D(.46 + (i % 4) * .04, .22 + Math.floor(i / 4) * .034, { r: .002, ink: i % 2 ? .25 : 1 }); }));
    as('smoke', () => { const a = cl(openX + .05 * dirOpen); S([[a, horizon], [a + .003, horizon + .12], [a - .002, horizon + .26], [a + .002, horizon + .4]], { r: .0026, ink: .45, water: .35, fade: .6 }); });

    /* ───────── 14. 天候最後落筆 ───────── */
    as('rain', () => {
      const slant = yj.weather === 'wind' || /斜風/.test(plan.focus || '') ? .03 : .014;
      for (let i = 0; i < 46; i++) { const a = nz(i, 91), b = .12 + nz(i, 92) * .82; S([[a, b], [a - slant, b - .045]], { r: .0009, ink: .2, dry: .5, water: .25, speed: 2.4, after: .008 }); }
      for (let k = 0; k < 2; k++) S([[0, horizon + .04 + k * .12], [1, horizon + .05 + k * .12]], { r: .03, ink: .035, water: .9, dry: 0, speed: 3 });
    });
    as('snow', () => { if (!(yj.sky === 'snow')) for (let i = 0; i < 18; i++) D(nz(i, 95), .2 + nz(i, 96) * .7, { r: .0018, ink: .12, water: .25 }); });
  }

  root.renderLiteraryPlan = renderLiteraryPlan;
  if (typeof module !== 'undefined' && module.exports) module.exports = renderLiteraryPlan;
})(typeof window !== 'undefined' ? window : globalThis);
