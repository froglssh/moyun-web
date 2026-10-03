'use strict';
const assert=require('node:assert/strict');
require('../classical_data.js');require('../literary_profiles.js');require('../literary_objects.js');const Y=require('../literary_yijing.js');
const engine=require('../literary_engine.js'),render=require('../literary_painter.js');
require('../literary_catalog.js');
require('../literary_vernacular.js');
const data=globalThis.CLASSICAL_LITERATURE_DATA,profiles=globalThis.LITERARY_WORK_PROFILES;
let scenes=0,marks=0,washes=0;
for(const item of data){
  const base=engine.analyzeLiteraryConcept(item);
  assert.equal(base.confidence,'逐篇內建畫意',item.title+' has no dedicated plan');
  assert(base.vernacular && base.vernacular.includes('國文老師'),item.title+' has no teacher vernacular explanation');
  for(let i=0;i<base.sceneOptions.length;i++){
    const a=engine.analyzeLiteraryConcept(item,'','','',i),n=engine.normalize(engine.sourceText(item));scenes++;
    assert(a.poemLines.length,item.title+' has no original inscription');
    assert(n.includes(engine.normalize(a.poemLines.join(''))),item.title+' inscription reordered, rewritten or non-contiguous');
    for(const e of a.scenePlan.elements){assert(e.evidence && (n.includes(engine.normalize(e.evidence)) || e.evidence===item.title),item.title+' evidence');}
    for(const id of profiles[engine.keyOf(item)]?.scenes[i]?.exclude||[])assert(!a.scenePlan.elements.some(e=>e.id===id),item.title+' forbidden '+id);
    const allowed=new Set(a.scenePlan.elements.map(e=>e.id));
    const rendered=new Set();
    assert(allowed.size,item.title+' has no drawable subjects');
    assert(a.scenePlan.words.length,item.title+' has no word reading');
    for(const w of a.scenePlan.words)assert(n.includes(engine.normalize(w.quote)),item.title+' word quote is not original');
    const yj=a.yijing;assert(yj&&Y.ENUMS.emotion.includes(yj.emotion)&&Y.ENUMS.time.includes(yj.time)&&Y.ENUMS.viewpoint.includes(yj.viewpoint)&&yj.emptiness>=.2&&yj.emptiness<=.92&&yj.reading&&yj.composition,item.title+' yijing');
    assert(!yj.focal||allowed.has(yj.focal),item.title+' focal must be an approved motif');
    function inspect(coords,options){marks++;rendered.add(options.motif);
      // ambient 只允許低墨量的大面積渲染（天色、地色），不能構成物象，也不出現在題跋構圖
      const amb=options.motif==='ambient'&&allowed.size>0&&options.ink<=.25&&(options.cin||0)<=.12&&options.r>=.015;if(amb)washes++;
      assert(allowed.has(options.motif)||amb||(!allowed.size&&options.motif==='abstract_ink'),item.title+' undeclared drawing '+options.motif+' '+JSON.stringify(options).slice(0,120));for(const point of coords){assert(point.every(Number.isFinite),item.title+' invalid coordinate');assert(point[0]>=0&&point[0]<=.64&&point[1]>=0&&point[1]<=1,item.title+' out of bounds '+point);}}
    render({rr:(a,b)=>(a+b)/2,S:(p,o)=>inspect(p,o),D:(x,y,o)=>inspect([[x,y]],o)},a.scenePlan);
    for(const id of allowed)assert(rendered.has(id),item.title+' missing actual drawing '+id);
  }
}
function find(title,author){return data.find(x=>x.title.startsWith(title)&&(!author||x.author===author));}
function ids(title,author){return engine.analyzeLiteraryConcept(find(title,author)).scenePlan.elements.map(e=>e.id);}
for(const [title,absent] of [ ['江雪',['bird','moon']],['靜夜思',['snow','boat']],['前赤壁賦',['waves','bird']],['念奴嬌 赤壁',['snow','boat']],['墨梅',['snow','sunset']],['記承天寺',['pond','fish']],['磧中作',['smoke','moon','sunset']],['竹里館',['boat']],['師說',['mountain','river']],['小池',['boat','mountain']] ])for(const id of absent)assert(!ids(title).includes(id),title+' '+id);
assert(ids('江雪').includes('person'),'江雪 must preserve fisherman despite absence of passersby');
assert(ids('竹里館').includes('qin'),'竹里館 must depict qin');
assert(ids('天淨沙・秋思').includes('horse'),'秋思 must depict thin horse');
const plum=engine.analyzeLiteraryConcept(find('病梅館記'));
assert(plum.scenePlan.options.naturalGrowth,'病梅館記 must restore natural growth');
assert(plum.poemLines.join('').includes('毀其盆'),'病梅館記 inscription must emphasize recovery');
assert.equal(engine.analyzeLiteraryConcept(find('登高','杜甫')).poemLines.length,8);
assert.equal(engine.analyzeLiteraryConcept(find('聲聲慢')).inscriptionMode,'全文');
const plain={title:'測試',author:'甲',form:'詩',lines:['千山鳥飛絕，孤舟蓑笠翁。']};
const noisy={...plain,title:'樓閣花鳥',author:'松雪',intro:'柳樹繁花、亭台流水、月夜孤舟'};
assert.deepEqual(engine.analyzeLiteraryConcept(plain).scenePlan.elements,engine.analyzeLiteraryConcept(noisy).scenePlan.elements,'metadata cannot add imagery');
assert.deepEqual(engine.analyzeLiteraryConcept(engine.sourceText(find('江雪'))).scenePlan,engine.analyzeLiteraryConcept(find('江雪')).scenePlan,'pasted classics use work profile');
assert(!engine.analyzeLiteraryConcept('沒有小船，只有竹林。').scenePlan.elements.some(e=>e.id==='boat'));
const local=engine.analyzeLiteraryConcept(plain),cloud={meaning:'孤寂',focus:plain.lines[0],representation:'literal',note:'依原文取景',elements:[{id:'boat',evidence:'孤舟蓑笠翁'}]};
assert(engine.validateCloudPlan(cloud,plain,local));
// 不合格景物逐項略去（不整份作廢），並在 cloudNote 說明原因
{const r=engine.validateCloudPlan({...cloud,elements:[{id:'bird',evidence:'千山鳥飛絕'},{id:'moon',evidence:'明月'},cloud.elements[0]]},plain,local);const ids=r.scenePlan.elements.map(e=>e.id);
 assert(!ids.includes('bird')&&!ids.includes('moon')&&ids.includes('boat'),'invalid cloud elements dropped');assert(/鳥禽/.test(r.cloudNote)&&/月色/.test(r.cloudNote),'dropped elements explained');}
{const r=engine.validateCloudPlan({...cloud,focus:'不存在的文章'},plain,local);assert.equal(r.scenePlan.focus,local.scenePlan.focus);assert(/取景段落改用本機/.test(r.cloudNote));}
assert.equal(engine.validateCloudPlan({...cloud,representation:'calligraphy'},plain,local).scenePlan.elements.length,0,'calligraphy has no imagery');
assert.equal(engine.validateCloudPlan({...cloud,elements:[cloud.elements[0],cloud.elements[0]]},plain,local).scenePlan.elements.length,1,'duplicates removed');
{const r=engine.validateCloudPlan({...cloud,elements:[{id:'bird',evidence:'千山鳥飛絕'}]},plain,local);assert.deepEqual(r.scenePlan.elements.map(e=>e.id),local.scenePlan.elements.map(e=>e.id),'all rejected falls back to local scene');assert.equal(r.meaning,'孤寂');}
assert.throws(()=>engine.validateCloudPlan({focus:'x'},plain,local),'no meaning and no yijing');
// 使用者截圖情境：自貼王維詩，雲端以「林叟」為人物
{const t='行到水窮處，坐看雲起時。偶然值林叟，談笑無還期。',l=engine.analyzeLiteraryConcept(t);
 const r=engine.validateCloudPlan({meaning:'隨遇而安的閒適',focus:t,representation:'literal',note:'山行偶遇',elements:[{id:'person',evidence:'偶然值林叟'},{id:'cloud',evidence:'坐看雲起時'},{id:'river',evidence:'行到水窮處'},{id:'mountain',evidence:'終南山'}],yijing:{emotion:'serene',time:'day',season:'none',weather:'clear',viewpoint:'shenyuan',scale:'medium',emptiness:.6,focal:'person',reading:'水窮雲起，於無路處見新境，偶遇林叟談笑忘歸，寫隨緣自在的閒適心境。',composition:'山徑盡處一人坐看雲起，林叟相伴。'}},t,l);
 const ids=r.scenePlan.elements.map(e=>e.id);assert(ids.includes('person')&&ids.includes('cloud'),'林叟 is a person');assert(!ids.includes('mountain'),'evidence not in text dropped');assert.equal(r.meaning,'隨遇而安的閒適');assert.equal(r.yijing.emotion,'serene');}
const inkPlum=find('墨梅');const inkText=engine.sourceText(inkPlum),inkPlan=engine.analyzeLiteraryConcept(inkText);
const alternate={meaning:'花枝',focus:inkText,representation:'literal',note:'花色',elements:[{id:'flower',evidence:'個個花開淡墨痕'}]};
assert.deepEqual(engine.validateCloudPlan(alternate,inkText,inkPlan).scenePlan,inkPlan.scenePlan,'pasted editorial classics cannot be changed by cloud');
// 意境層：時令、天色、留白、主體與筆墨
function yj(title,author,i=0){return engine.analyzeLiteraryConcept(find(title,author),'','','',i).yijing;}
function strokes(title,author,i=0){const a=engine.analyzeLiteraryConcept(find(title,author),'','','',i),out=[];render({rr:(x,y)=>(x+y)/2,S:(p,o)=>out.push(o),D:(x,y,o)=>out.push(o)},a.scenePlan);return out;}
{const j=yj('江雪');assert.equal(j.sky,'snow');assert.equal(j.focal,'boat');assert(j.emptiness>=.8,'江雪 needs vast emptiness');assert(strokes('江雪').some(o=>o.motif==='snow'&&o.r>=.02),'江雪 snow expressed by 烘托 sky wash');}
{const j=yj('靜夜思');assert.equal(j.time,'night');assert.notEqual(j.sky,'snow');assert(j.hints.lookUp);}
{const j=yj('楓橋夜泊');assert.equal(j.time,'night');assert(j.hints.boatLight);assert(!strokes('楓橋夜泊').some(o=>o.motif==='moon'),'月落：夜色中不得留月');}
{const j=yj('天淨沙・秋思');assert.equal(j.time,'dusk');assert.equal(j.season,'autumn');assert(j.warmth>=.3);}
{const j=yj('望廬山瀑布');assert.equal(j.viewpoint,'gaoyuan');assert.equal(j.focal,'waterfall');}
{const j=yj('黃鶴樓送孟浩然');assert(j.emptiness>=.85&&j.viewpoint==='pingyuan');}
{const j=yj('前赤壁賦');assert(j.hints.calm);assert.equal(j.time,'night');}
assert.equal(yj('小雅・采薇','',0).weather,'snow');assert.equal(yj('小雅・采薇','',1).season,'spring');
assert(!/夜/.test(yj('山行').timeLabel),'二月花不是月夜');assert(!engine.analyzeLiteraryConcept(find('山行')).scenePlan.elements.some(e=>e.id==='moon'),'二月不是月亮');
{const base=yj('江雪'),styled=Y.applyStyle(base,'heroic');assert.equal(styled.sky,'snow');assert.equal(styled.time,base.time);}
{const local=yj('靜夜思'),ids=['house','moon','person'];const m=Y.mergeCloudYijing(local,{weather:'snow',viewpoint:'gaoyuan',emotion:'longing',focal:'boat',reading:'x'},ids);assert.notEqual(m.weather,'snow');assert.notEqual(m.viewpoint,'gaoyuan');assert.notEqual(m.focal,'boat');assert.equal(m.reading,local.reading);}
// 新增敘事能力：數量、主客體位置、比喻時辰、原文指紋及可重現構圖。
function capture(item,index=0){const out=[];render({S:(p,o)=>out.push({p,o}),D:(x,y,o)=>out.push({p:[[x,y]],o})},engine.analyzeLiteraryConcept(item,'','','',index).scenePlan);return out;}
const weaver=engine.analyzeLiteraryConcept(data[75]);
assert(weaver.scenePlan.options.layout['person:0'].x+.3<weaver.scenePlan.options.layout['person:1'].x,'牛女不得畫成團聚');
assert(!weaver.scenePlan.elements.some(e=>e.id==='rain'),'泣涕如雨是比喻');
const protect=engine.analyzeLiteraryConcept(data[25]).scenePlan.options.layout;
assert(protect['person:1'].h<protect['person:0'].h*.6,'井旁幼童的身形須小於成人');
assert(protect['person:1'].x<protect.well.x,'孺子將入井，未落入井中');
const chariot=capture(data[34]);
assert.equal(new Set(chariot.filter(m=>m.o.motif==='horse').map(m=>m.o.instance)).size,4,'駟馬必須實際畫四匹');
assert.equal(new Set(chariot.filter(m=>m.o.motif==='person').map(m=>m.o.instance)).size,2,'御者與晏子各一人');
for(const i of [88,90,183])assert.equal(engine.analyzeLiteraryConcept(data[i]).yijing.time,'day','月喻、暮年、夜光杯不能判夜暮');
assert.equal(engine.analyzeLiteraryConcept(data[454]).yijing.time,'day','快哉亭選晝不混夜');
assert(engine.analyzeLiteraryConcept(data[435]).scenePlan.focus.includes('獨與邁乘小舟'),'石鐘山選親歷句，不取拒絕夜泊句');
assert.equal(engine.analyzeLiteraryConcept(data[413]).sceneOptions.length,3);
assert.deepEqual(capture(data[75]),capture(data[75]),'同一篇與場景的構圖須穩定');
assert.equal(engine.analyzeLiteraryConcept({...data[75],lines:[...data[75].lines,'異文測試。']}).confidence,'保守文本取景','同名異文不可套用舊配方');
console.log(JSON.stringify({works:data.length,editorialProfiles:Object.keys(profiles).length,yijingOverrides:Y.OVERRIDE_KEYS.length,scenes,brushMarks:marks,ambientWashes:washes,result:'PASS'},null,2));
