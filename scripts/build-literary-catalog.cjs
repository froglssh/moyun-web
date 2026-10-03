'use strict';
const fs=require('node:fs'),path=require('node:path');
require('../classical_data.js');require('../literary_profiles.js');require('../literary_objects.js');require('../literary_yijing.js');const engine=require('../literary_engine.js');require('../literary_catalog.js');
const data=globalThis.CLASSICAL_LITERATURE_DATA;
let text='# 詩文創作分析索引\n\n本索引從內建原典與現行分析器產生，涵蓋 '+data.length+' 篇。全庫均有逐篇編輯的關鍵語詞、釋義、取景物象、敘事層次與畫面安排，共 584 個場景。這是畫意所需的關鍵語詞分析，不是逐字訓詁。原文不改寫。\n\n「原文明示」「篇名與專篇釋義」「專篇語義推定」分別標示用字與解讀依據。想像、回憶、夢境及象徵圖景亦標明。程式測試只能檢查約束，不能代替文學與畫作評鑑。\n';
for(const [i,item] of data.entries()){
 const a=engine.analyzeLiteraryConcept(item);
 text+='\n## '+(i+1)+'. '+item.title+' · '+item.author+'\n\n';
 text+='- 分析層級：'+a.confidence+'。\n- 主旨：'+a.meaning+'。\n';
 for(let j=0;j<a.sceneOptions.length;j++){
  const b=engine.analyzeLiteraryConcept(item,'','','',j);
  text+='\n取景 '+(j+1)+'：'+b.archetypeTitle+'（'+engine.representationLabel(b.scenePlan.representation)+'）。'+b.scenePlan.note+'\n\n';
  for(const w of b.scenePlan.words)text+='- 語詞「'+w.quote+'」：'+w.meaning+'；畫面：'+w.visual+'。\n';
  for(const e of b.scenePlan.elements)text+='- '+e.label+' ← '+e.evidence.replace(/\n/g,' ')+'（'+e.evidenceKind+'）\n';
  if(b.scenePlan.constraints.length)text+='\n限制：'+b.scenePlan.constraints.join('；')+'。\n';
  const y=b.yijing;
  if(y){text+='\n意境（'+y.source+'）：'+y.emotionLabel+'・'+[y.seasonLabel!=='未明言'?y.seasonLabel:'',y.timeLabel,y.weatherLabel].filter(Boolean).join('・')+'・'+y.viewpointLabel+'・'+y.realm+'・留白 '+Math.round(y.emptiness*100)+'%。\n\n> '+y.reading+'\n\n構圖：'+y.composition+'\n';}
  text+='\n題字（'+b.inscriptionMode+'）：'+b.poemLines.join('／')+'。\n';
 }
 text+='\n[原典出處]('+item.url+')\n';
}
fs.writeFileSync(path.join(__dirname,'../docs/詩文創作分析索引.md'),text);
console.log('已產生 '+data.length+' 篇分析索引。');
