'use strict';
// 編譯的是逐篇編輯稿，絕不以關鍵字為缺漏篇目自動補答案。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('../classical_data.js');require('../literary_profiles.js');require('../literary_objects.js');
const Y=require('../literary_yijing.js'),E=require('../literary_engine.js');
const data=global.CLASSICAL_LITERATURE_DATA,old=global.LITERARY_WORK_PROFILES;
const output={},seen=new Set(),stages={
  object:'器物近景：主物居中放大，次物分置左右，以物的狀態呈現篇義。',
  study:'書案近景：人物面向書卷，筆、冊、几案與手部相接，留白承接思考。',
  duet:'人物對景：人物相向而留出對話距離，關鍵器物置於互動之間。',
  court:'進言場景：主客分居兩側，書卷或信物居中，以手勢與姿態表現權力關係。',
  portrait:'人物小品：放大單一人物與身邊關鍵物，背景留白表心境。',
  interior:'室內外分層：窗、門、帷幕界定空間，人物在內，天候与遠景在外。',
  journey:'行旅章法：道路斜向遠處，行者與車馬沿路；回望與前行保留方向差異。',
  gathering:'相聚章法：人物圍坐，器物居中，依篇義區分歡宴、清談或悲感。',
  village:'村野章法：屋舍為中景、耕作為前景，人物與生計器具構成關係。',
  garden:'庭園小品：花木依原文狀態落筆，人物與花枝呼應，庭牆不遮核心。',
  river:'水面章法：水連遠近，主體舟岸位置分明，水天留白延伸情緒。',
  mountain:'山勢章法：峰巒前後高低分層，人物縮小，以遠近與高度承載情感。',
  war:'軍旅章法：人物、車馬或帳幕形成行列，依文本保留疲憊、戒備或悲壯。',
  separated:'隔景章法：人物分在兩端，以水面或留白隔開，不能畫成團聚。',
  farewell:'送別章法：舟與岸分開配置，送者望向行者，手勢與視線相接。',
  rescue:'水岸章法：危急者在水中、援者在岸上，留出不可混淆的空間關係。',
  hierarchy:'高低反置：小苗居山上，大松沉澗底，物的大小與地勢高低形成反諷。',
  celestial:'天上想像：以疏星與帶状留白區分銀河，人神相望，無地面河岸。',
  vast_figure:'天地小我：人物居畫面下方而極小，上方大片留白呈現時間與天地無限。'
};
function fingerprint(t){let h=2166136261;for(const c of t){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function setting(s){return Object.fromEntries((s||'').split(';').filter(Boolean).map(x=>{let [k,v]=x.split('=');return [k,v==='true'?true:v==='false'?false:/^-?\d+(\.\d+)?$/.test(v)?+v:v];}));}
function focusAt(item,anchor){const t=E.sourceText(item),p=t.indexOf(anchor);assert(p>=0,`${item.title}: 引句不存在 ${anchor}`);let start=p,end=p+anchor.length;while(start>0&&!/[。！？\n]/.test(t[start-1]))start--;while(end<t.length&&!/[。！？\n]/.test(t[end]))end++;return t.slice(start,end).trim();}
function createScene(item,anchor,note,ids,emotion,representation,stage,settings={}){
  const focus=focusAt(item,anchor),text=E.sourceText(item);
  const motifs=ids.map(id=>{assert(E.MOTIFS[id],`${item.title}: 未支援物象 ${id}`);const re=E.MOTIFS[id][1];const inFocus=focus.split(/[，。；\n]/).find(s=>re.test(s));const elsewhere=text.split(/[，。；\n]/).find(s=>re.test(s));return {id,evidence:(inFocus||elsewhere||anchor).trim(),evidenceKind:inFocus?'原文語詞':elsewhere?'同篇語境':'專篇語義推定'};});
  const opts={...settings,staging:stage,layout:global.MoyunObjects.layout(stage,ids,settings)};
  const meaning=note.split('；')[0];
  const y=Y.analyzeYijing(item,{focus,meaning,elements:motifs});
  const landscape=ids.some(id=>['river','sea','pond','mountain','desert','field'].includes(id));
  const clockText=focus.replace(/暮年|夜光杯|團團似明月|朝如青絲暮成雪/g,'');
  const localTime=/暮|夕陽|殘陽|落日/.test(clockText)?'dusk':/夜|更深|[三五]更|月明|明月|月色/.test(clockText)?'night':/晨|曉|平明|日出|朝露/.test(clockText)?'dawn':'day';
  const overrides={emotion,time:settings.time||localTime,timeUnspecified:!settings.time&&localTime==='day',season:settings.season||'',weather:settings.weather||(ids.includes('rain')?'rain':ids.includes('snow')?'snow':'clear'),
    viewpoint:stage==='mountain'||stage==='hierarchy'?'gaoyuan':'pingyuan',scale:stage==='vast_figure'?'vast':landscape?'medium':'intimate',
    focal:ids.find(id=>!['house','wall','river','pond','cloud','rain','snow'].includes(id))||ids[0]||'',
    E:stage==='vast_figure'?.88:stage==='war'?.42:stage==='object'?.62:.56,side:'left',reading:note,composition:stages[stage]+note,
    hints:{...(settings.redLeaves?{redLeaves:true}:{}),...(settings.weather==='clear'&&ids.includes('snow')?{snowCover:true}:{}),...(settings.reflection?{reflection:true}: {})}};
  return {label:anchor.slice(0,18)+'・'+E.representationLabel(representation),focus,motifs,options:opts,representation,exclude:[],note,
    composition:overrides.composition,yijing:overrides,words:[{quote:anchor,meaning:note,visual:ids.map(id=>E.MOTIFS[id][0]).join('、')}]};
}
for(const line of fs.readFileSync(path.join(__dirname,'../data/blueprints.tsv'),'utf8').split('\n')){
  if(!line||line.startsWith('#'))continue;
  assert.equal(line.split('|').length,8,'畫意欄位須完整：'+line.slice(0,40));
  const [index,anchor,note,motifs,emotion,representation,stage,settings]=line.split('|');
  const i=+index,item=data[i];assert(item&&!seen.has(i),'編輯序號重複或失效 '+index);seen.add(i);assert(stages[stage],stage);assert(Y.ENUMS.emotion.includes(emotion),emotion);
  output[E.keyOf(item)]={meaning:note.split('；')[0],scenes:[createScene(item,anchor,note,motifs.split(','),emotion,representation,stage,setting(settings))],constraints:[note.split('；').slice(1).join('；')].filter(Boolean)};
}
// 既有 96 篇保留其分景與限制；補齊可讀的逐篇語詞資料及固定意境。
for(const item of data){const key=E.keyOf(item);if(output[key])continue;assert(old[key],`未逐篇編輯：${key}`);const p=JSON.parse(JSON.stringify(old[key]));
  p.scenes.forEach((s,i)=>{const a=E.analyzeLiteraryConcept(item,'','','',i),y=a.yijing;
    s.words=[{quote:(s.focus||E.sourceText(item)).split(/[，。\n]/).find(x=>x.trim())||item.lines[0],meaning:p.meaning+'；'+(s.note||''),visual:a.scenePlan.elements.map(e=>e.label).join('、')}];
    s.yijing={emotion:y.emotion,time:y.time,season:y.season,weather:y.weather,viewpoint:y.viewpoint,scale:y.scale,focal:y.focal,side:y.side,E:y.emptiness,tex:y.texture,warm:y.warmth,hints:y.hints,reading:s.note?p.meaning+'；'+s.note:p.meaning,composition:y.composition};
  });output[key]=p;
}
// 原本以題跋替代的具體物象，現在有對應筆墨元件。
function replace(i,anchor,note,ids,emotion='serene',rep='literal',stage='object',opts={}){const item=data[i],p=output[E.keyOf(item)];p.meaning=note.split('；')[0];p.scenes=[createScene(item,anchor,note,ids,emotion,rep,stage,opts)];p.constraints=[note];}
replace(35,'提刀而立','庖丁解牛由技入道，順結構而行；取解畢收刀的從容，不以暴力切割作主體。',['person','sword'],'serene','literal','portrait');
replace(75,'札札弄機杼','牛女隔銀河相思，織而不成；織女在機旁、牽牛在對岸星域，淚如雨不下雨。',['star','loom','person'],'longing','imagined','celestial',{personCount:2,time:'night'});
replace(176,'紅豆生南國','紅豆寄相思，願多採擷；豆枝與紅豆近景，保留種實而不套山水。',['redbean'],'longing','symbolic');
replace(304,'古之學者必有師','師生相學重在傳道解惑；以師生對卷作教育理念插圖，不偽稱歷史授課現場。',['person','book'],'serene','symbolic','study',{personCount:2});
replace(512,'淚珠和筆墨齊下','臨別書信將至愛推及天下人；寫信者忍悲落筆，妻在遠處不畫成現場團聚。',['person','scroll','brush'],'longing','literal','study',{personAction:'write'});
replace(540,'萬馬齊喑究可哀','萬馬齊喑比喻社會噤聲，呼喚人才不拘一格；以立筆與封閉書卷寓破除束縛，不實畫馬群天公。',['brush','scroll'],'patriotic','symbolic');
// 跨時地、多首、夢境／回憶的重點作品提供可選的獨立場景。
const extra=[
 [12,'小國寡民','小國寡民的社會理想；鄰屋相望、田家自足，舟車雖有而不用。','house,field,person','serene','imagined','village','personCount=3'],
 [41,'呦呦鹿鳴','鹿群食野草作起興；獨立呈現鹿鳴，不與賓客宴席混場。','deer,grass','joyful','symbolic','garden',''],
 [73,'胡馬依北風','依北風、巢南枝寄思本；只作馬與南枝鳥的比興圖，非遊子所見實景。','horse,bird,tree','longing','symbolic','garden','birdCount=1'],
 [93,'父子相保','父子因跛足免戰而保全；父扶傷腿兒子，與失馬得馬分時。','person','serene','literal','duet','personCount=2;personAction=help'],
 [121,'過門更相呼','第二首：閒暇鄰友過門邀飲；相聚田家，以真誠取代排場。','person,cup,house','serene','literal','gathering','personCount=3'],
 [124,'木欣欣以向榮','春日萬物得時引生命感悟；新木與細泉，非之前的夕陽孤松。','tree,river','transcendent','literal','garden','season=spring'],
 [138,'明月何灼灼','第二首夜不成眠，想聽戀人呼喚；月下只有一人，回應的是想像。','moon,person','longing','literal','portrait','time=night'],
 [139,'當窗理雲鬢','歸家恢復女兒裝，引伙伴驚訝；鏡前梳妝，不把雲鬢畫為雲。','person,mirror,clothing','joyful','literal','interior','personAction=mirror'],
 [144,'白馬負而來','第二則白馬寺得名敘事；白馬負經函，日月光明是金神夢兆另層。','horse,box,scroll','serene','recollection','journey',''],
 [154,'白日麗飛甍','初登時白日照京邑屋脊；與後段江霞暮色分開。','house,sun','joyful','literal','river','time=day'],
 [159,'顧我無衣搜藎篋','第一首回憶貧時妻子搜尋衣物；妻在衣箱旁，標示往昔。','person,clothing,box','longing','recollection','interior',''],
 [170,'窮且益堅','窮而益堅的自勉；書生與卷筆寄志，不按青雲字面畫升天。','person,scroll,brush','heroic','symbolic','study',''],
 [194,'可憐九月初三夜','後半轉至初三夜；弓形新月與江邊露光，珠露不畫珠寶。','moon,river','serene','literal','river','time=night;crescent=true;season=autumn'],
 [206,'直掛雲帆濟滄海','終章未來抱負，長風破浪會有時；高帆向海明示願景。','boat,sea,waves','heroic','imagined','river','fastBoat=true'],
 [211,'高堂明鏡悲白髮','鏡中白髮照見生命短促；僅人與鏡，暮成雪是白髮誇喻。','person,mirror','melancholy','symbolic','portrait',''],
 [234,'點水蜻蜓款款飛','第二首取穿花蝶、點水蜻蜓；細小活動寄暫賞風光。','butterfly,dragonfly,flower,river','serene','literal','garden','season=spring'],
 [258,'豆蔻梢頭二月初','第一首以初生豆蔻喻少女風姿；人物肖像，花的比喻不混成真盆景。','person','serene','symbolic','portrait',''],
 [281,'江潭落月復西斜','終段月將沉、江樹搖情；月低而隱於霧，不與初升明月同景。','moon,river,tree,cloud','longing','literal','river','time=night;lowMoon=true'],
 [315,'恰似一江春水向東流','不盡春水比亡國愁；獨立江水象徵圖，勿偽稱囚居窗外江景。','river','melancholy','symbolic','river','season=spring'],
 [322,'明妃初出漢宮時','第一首初離漢宮；昭君回首而淚下，塞地琵琶另時。','person,pavilion','longing','literal','portrait',''],
 [343,'幾家飄散在他州','漂散者在他州望同一月；獨旅與團聚版本分開閱讀。','moon,person,path','longing','symbolic','journey','time=night'],
 [353,'云何漸漸如鉤','追問月相變化，鉤月為另一時間；不將蟾蜍玉兔和鯨畫入物理月行。','moon','zen','imagined','object','time=night;crescent=true'],
 [378,'楊柳岸','別後酒醒的預想；柳岸残月孤舟，與執手送別分開。','willow,moon,boat,river','longing','imagined','river','time=dawn;crescent=true;emptyBoat=true'],
 [390,'樓船夜雪瓜洲渡','早歲軍旅回憶：瓜洲夜雪樓船；不與大散關鐵馬同地。','boat,river,snow','patriotic','recollection','river','time=night;weather=snow'],
 [397,'明日落紅應滿徑','對明日的推想；落花滿徑是預期結果，清楚標示想像。','path,flower','melancholy','imagined','garden','fallenFlowers=true;season=spring'],
 [413,'少年聽雨歌樓上','少年雨夜歌樓，紅燭帳暖；與晚年的僧廬清冷形成對照。','pavilion,lamp,person,rain','joyful','recollection','interior','time=night'],
 [413,'壯年聽雨客舟中','壯年漂泊江闊雲低，斷雁寄身世；舟中一客。','boat,river,cloud,bird,person','desolate','recollection','river','birdCount=1;season=autumn'],
 [419,'人約黃昏後','去年元夕回憶：兩人柳下相約；與今年獨人分時。','moon,lamp,willow,person','joyful','recollection','duet','personCount=2;time=night'],
 [426,'太守歸而賓客從也','夕陽下太守與賓客歸去；鳥樂在其後，宴席已散。','person,path,mountain,sunset','serene','literal','journey','personCount=4;time=dusk;personAction=walk'],
 [436,'短松岡','遙想亡妻孤墳在明月短松下；夢中梳妝的妻不放在墓旁。','grave,pine,moon','longing','imagined','garden','time=night;smallTree=true'],
 [478,'變做赤腳大仙模樣','悟空變為赤腳大仙赴宴；以人形與雲閣標示神話變化，非猴身原形。','person,pavilion,cloud','joyful','imagined','interior',''],
 [491,'有心情那夢兒還去不遠','夢醒仍眷戀夢中愛情；麗娘獨坐欲重眠，柳生不在現實旁側。','person,bed,house','longing','literal','interior',''],
 [498,'或憑几學書','妻來軒中學書為往昔回憶；几案邊夫妻相伴，與妻死後荒屋分開。','person,desk,book,brush','longing','recollection','study','personCount=2;personAction=write'],
 [510,'私擬作群鶴舞空','夏蚊被童心擬為群鶴；畫實際小蚊與觀察童，釋義保留想像，非真白鶴。','insect,person','joyful','recollection','object',''],
 [517,'風一更','帳內夢不成、帳外風雪喧；只取帳內聽雪者，故園不在眼前。','tent,person,lamp,snow','longing','literal','interior','time=night;weather=snow'],
];
for(const [i,q,n,m,e,r,s,o] of extra)output[E.keyOf(data[i])].scenes.push(createScene(data[i],q,n,m.split(','),e,r,s,setting(o)));
output[E.keyOf(data[372])].scenes[2]=createScene(data[372],'先天下之憂而憂','憂樂超越一己得失，先憂後樂是政治倫理；以執卷沉思者寄責任，不把論述偽作登樓實錄。',['person','scroll'],'patriotic','symbolic','study');
for(const item of data){const p=output[E.keyOf(item)];p.sourceFingerprint=fingerprint(E.sourceText(item));p.sourceUrl=item.url;p.reviewBasis='逐篇畫意編輯・原文校驗';
 p.scenes.forEach(s=>{s.yijing.source='逐篇內建畫意';});
}
assert.equal(Object.keys(output).length,data.length);
const js='/* 由 scripts/build-work-catalog.cjs 與 data/blueprints.tsv 編譯；請勿手改。 */\n(function(root){\n"use strict";\nconst catalog='+JSON.stringify(output,null,2)+';\nroot.LITERARY_WORK_PROFILES=catalog;\nroot.MOYUN_CATALOG_INFO={works:'+data.length+',scenes:'+Object.values(output).reduce((n,p)=>n+p.scenes.length,0)+',version:2};\nif(typeof module!=="undefined"&&module.exports)module.exports=catalog;\n})(typeof window!=="undefined"?window:globalThis);\n';
fs.writeFileSync(path.join(__dirname,'../literary_catalog.js'),js);
console.log(`已編譯 ${data.length} 篇、${Object.values(output).reduce((n,p)=>n+p.scenes.length,0)} 個專屬場景。`);
