/* 古文敘事筆墨：人事、動植物與器物。每個圖元均有獨立識別及原文用語。 */
(function(root){
  'use strict';
  const definitions={
    rat:['鼠','鼠'],
    apricot:['杏枝','杏'],arrow:['箭矢','箭|矢'],bag:['行囊','囊|行李|旅|戍'],banner:['旌旗','旌|旗|兵|軍|戈'],basket:['竹籃','籃|籠|擔|捕'],bed:['床榻','床|牀|榻|枕|衾|蓐'],
    bee:['蜜蜂','蜂'],bell:['鐘','鐘'],bone:['骨','骨|肋'],bow:['弓','弓|射|彫弧|雕弧'],box:['匣篋','匣|篋|櫝|櫃|函|封'],broom:['掃帚','掃|帚'],brush:['毛筆','筆|翰|書|文|詩'],
    cangue:['枷','枷'],cart:['車輿','車|輿|轍|軾|鞅'],cat:['貓','貓'],cave:['洞穴','洞|穴|隧|窟'],chisel:['刀鑿','刀|鑿|琢|鍥|割|磨'],cicada:['蟬','蟬'],clam:['蚌','蚌'],clothing:['衣帛','衣|裳|被|衾|裘|綿|布|袍|帶'],coin:['錢幣','錢|銀|金|幣'],
    deer:['鹿','鹿'],desk:['几案','几|案|桌'],dog:['犬','狗|犬|牽黃'],donkey:['驢','驢|蹇'],drum:['鼓','鼓'],duckweed:['浮萍','萍'],earth:['土','土|地|泥|塵|窪|埋'],face:['面容','口|鼻|眉|眼|面'],fan:['團扇','扇'],fire:['火','火|燃|燒|炬|薪'],firefly:['螢火蟲','螢'],frog:['蛙','蛙'],fruit_peach:['桃實','桃'],gourd:['葫蘆','葫蘆|瓠|瓢'],grain:['穀物','米|穀|粟|黍|稷|麥|豆|禾|餐'],grass:['草','草|苔|薇|芹|萋|麥'],grave:['墓碑','墓|墳|塚|冢|陵|奠|祭'],hairpin:['簪','簪|釵'],hammer:['鐵椎','椎|杵'],hoe:['鋤耒','鋤|耒|耕|鑿'],inkstone:['硯','硯|墨'],insect:['微蟲','蟲|蚊|蟻'],jade:['玉珠','玉|珠|璧|玦'],kite:['紙鳶','紙鳶|風鳶'],ladle:['杓','杓|酌'],loom:['織機','機|杼|織'],lotus_root:['蓮藕','藕'],lychee:['荔枝','荔枝'],map:['輿圖','圖|地|土|割'],mat:['席簟','席|簟'],mirror:['鏡','鏡|妝'],monkey:['猴','猴|悟空|大聖'],needle:['針線','針|線|縫'],nest:['鳥巢','巢'],orange:['橙橘柑','橙|橘|柑'],ox:['牛','牛'],pear:['梨','梨'],picture:['畫屏','畫|壁'],pig:['豬','豬|彘|豚'],pillar:['柱','柱'],reed_pen:['荻筆','荻畫地'],redbean:['紅豆','紅豆'],rod:['鐵杵','杵'],rope:['繩索','繩|索|縋'],ruler:['量尺','度|尺'],screen:['屏風','屏|帷|幕'],scroll:['文卷','書|文|詩|卷|簡|編|表|圖|札|稿|箴|議|典|盟|名實|陰'],seedpod:['蓮蓬','蓮|蓬'],sheep:['羊','羊'],shoe:['履鞋','履|鞋|屨'],silk:['絲帛','絲|帛|織|絮|練'],silkworm:['蠶','蠶'],snake:['蛇','蛇'],spear:['戈矛','戈|矛|戟|兵|虎旅'],sprout:['幼苗','苗|毫末|葵|芽|瓜|荑'],star:['星河','星|河漢|銀漢|星漢'],stump:['樹樁','株'],swing:['鞦韆','鞦韆'],target:['箭靶','的|鵠|射'],tent:['帳幕','帳|幕|幙|營'],tiger:['虎','虎'],tracks:['爪印','指爪|迹|跡'],trigrams:['卦爻','八卦|剛柔|乾坤'],trough:['馬槽','槽|櫪|食不飽'],vessel:['盂甕','甕|缽|瓶|壺|羹|食|器|釜|盤|盎|湯|簞|豆|缶|爐|奠|膳'],web:['蛛網','蛛網'],well:['井','井'],wheel:['車輪','轂|輪'],wood:['木器','木|薪|桃|板|築|竿|業']
  };
  const MOTIFS=Object.fromEntries(Object.entries(definitions).map(([id,[label,re]])=>[id,[label,new RegExp(re)]]));
  function draw(id,ctx,opts={}){
    const {S,D}=ctx;
    const line=(p,o={})=>S(p,{r:.0018,ink:.9,dry:.32,water:.15,...o});
    const dot=(x,y,r=.003,o={})=>D(x,y,{r,ink:.95,...o});
    const ellipse=(x,y,rx,ry,o={},n=32)=>line(Array.from({length:n+1},(_,i)=>[x+rx*Math.cos(i*2*Math.PI/n),y+ry*Math.sin(i*2*Math.PI/n)]),o);
    const box=(x,y,w,h,o={})=>line([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],o);
    const hatch=(x,y,w,h,n=7)=>{for(let i=0;i<n;i++)line([[x+i*w/n,y],[x+i*w/n+.04,y+h]],{r:.0007,ink:.3});};
    const leaf=(x,y,s=.15)=>{line([[x,y],[x+s*.6,y+s*.6],[x+s,y+s],[x+s*.25,y+s*.4],[x,y]],{ink:.65});};
    const animal=['dog','cat','rat','ox','sheep','pig','donkey','tiger','deer','monkey'].includes(id);
    if(id==='bag'){line([[.3,.73],[.15,.39],[.23,.12],[.72,.12],[.86,.39],[.65,.73],[.3,.73]],{r:.003});line([[.3,.74],[.63,.74],[.69,.88],[.48,.82],[.3,.9],[.3,.74]]);line([[.29,.75],[.63,.68],[.77,.8]],{r:.002});return;}
    if(id==='banner'){line([[.22,.06],[.22,.97]],{r:.003});line([[.24,.9],[.61,.85],[.89,.94],[.73,.68],[.88,.45],[.54,.49],[.23,.56]],{r:.0028});line([[.32,.81],[.68,.67],[.36,.65]],{r:.0015,ink:.5});return;}
    if(animal){
      if(id==='monkey'){
        ellipse(.53,.67,.15,.15);ellipse(.34,.68,.04,.065);ellipse(.71,.68,.04,.065);ellipse(.53,.34,.15,.21);
        line([[.41,.42],[.25,.58],[.19,.8]]);line([[.66,.43],[.78,.57],[.71,.68]]);
        line([[.46,.17],[.31,.1],[.26,.15]]);line([[.61,.17],[.78,.12],[.8,.2]]);
        line([[.67,.27],[.88,.32],[.9,.52],[.82,.56]],{r:.0025});dot(.48,.71);dot(.58,.71);line([[.46,.61],[.54,.58],[.62,.62]]);return;
      }
      const thin=id==='rat'||id==='dog'||id==='deer'||id==='donkey', reclining=opts.recliningAnimal;
      ellipse(.46,.47,.28,thin?.11:.17,{r:.0026,dry:.45});
      line([[.64,.5],[.72,.7],[.84,.67],[.94,.57],[.89,.52],[.77,.55],[.7,.46]],{r:.0026});
      dot(.83,.625,.0038);line([[.75,.68],[.74,id==='donkey'?.97:.81],[.8,.7]]);line([[.82,.7],[.86,id==='donkey'?.94:.81],[.87,.68]]);
      for(const [k,x] of [.24,.35,.56,.64].entries())line(reclining?[[x,.38],[x+.1,.19],[x+.21,.2]]:[[x,.38],[x+(k%2?.015:-.025),.2],[x+(k%2?.02:-.04),.06],[x+.02,.06]],{r:.0022});
      if(id==='pig')ellipse(.93,.57,.06,.04);
      if(id==='ox'){line([[.76,.71],[.67,.84],[.66,.92],[.73,.88]]);line([[.84,.7],[.96,.84],[.95,.93],[.9,.87]]);}
      if(id==='deer')for(const x of [.75,.83]){line([[x,.73],[x-.02,.92],[x-.1,.98]]);line([[x-.02,.89],[x+.04,.98]]);}
      if(id==='sheep')for(let i=0;i<9;i++)ellipse(.22+(i%5)*.105,.44+Math.floor(i/5)*.13,.09,.075,{ink:.6});
      if(id==='tiger'){for(let i=0;i<6;i++)line([[.23+i*.067,.56],[.25+i*.067,.45]],{r:.003,ink:1.2});}
      line(id==='cat'?[[.19,.45],[.05,.6],[.08,.82],[.2,.83]]:id==='rat'?[[.18,.43],[.05,.3],[.06,.1],[.19,.03]]:[[.19,.49],[.08,.45],[.02,.57]],{r:.0018});return;
    }
    if(['bee','cicada','firefly','insect','silkworm'].includes(id)){
      ellipse(.5,.48,.075,.2,{r:.0022});ellipse(.5,.74,.07,.055);dot(.47,.76);dot(.53,.76);
      if(id!=='silkworm'){ellipse(.33,.57,.17,.18,{ink:.4});ellipse(.67,.57,.17,.18,{ink:.4});line([[.47,.8],[.42,.92]]);line([[.53,.8],[.59,.91]]);}
      for(let i=0;i<5;i++)line([[.43,.35+i*.057],[.57,.35+i*.057]],{ink:.65,r:.001});
      for(const z of [-1,1])for(let i=0;i<3;i++)line([[.5+z*.06,.57-i*.1],[.5+z*.18,.53-i*.1],[.5+z*.23,.44-i*.1]],{r:.0008});
      if(id==='firefly')dot(.5,.28,.025,{ink:0,cin:.55,water:.7});return;
    }
    if(['pear','orange','lychee','fruit_peach','redbean','apricot'].includes(id)){
      if(id==='redbean'||id==='apricot'){
        line([[.22,.08],[.37,.45],[.69,.92]],{r:.0025});for(let i=0;i<6;i++){const x=.3+i*.055,y=.26+i*.1;line([[x,y],[x+.2,y+.02]]);leaf(x+.03,y+.02,.15);ellipse(x+.23,y,.06,.055,{ink:.35,cin:.8});}return;
      }
      const centers=id==='lychee'?[[.35,.35],[.62,.3],[.5,.58]]:[[.46,.43]];
      for(const [x,y] of centers){const r=id==='lychee'?.2:.31;
        if(id==='pear')line([[x,y-.26],[x-.23,y-.2],[x-.28,y],[x-.15,y+.25],[x-.09,y+.42],[x+.07,y+.42],[x+.16,y+.22],[x+.28,y],[x+.2,y-.23],[x,y-.26]],{r:.0025});
        else ellipse(x,y,r,r*.9,{r:.0025,cin:id==='lychee'?.6:.2});
        line([[x,y+r*.85],[x+.02,y+r+ .1]],{r:.002});leaf(x+.02,y+r,.15);
        if(id==='lychee')for(let j=0;j<16;j++){const t=j*2.4;dot(x+Math.cos(t)*r*.8,y+Math.sin(t)*r*.7,.002,{cin:.6});}
        if(id==='orange'){ellipse(x,y,r*.65,r*.6,{ink:.4});if(opts.spoiledFruit)hatch(x-r*.45,y-r*.4,r*.9,r*.8,11);else for(let j=0;j<7;j++)line([[x,y],[x+Math.cos(j*.9)*r*.6,y+Math.sin(j*.9)*r*.56]],{r:.001,cin:.5});}
        if(id==='fruit_peach')line([[x,y-r*.8],[x+.08,y],[x,y+r*.8]],{ink:.4});
      }return;
    }
    if(['grass','sprout','grain','duckweed'].includes(id)){
      if(id==='duckweed'){for(let i=0;i<14;i++)ellipse(.15+(i%5)*.14,.2+Math.floor(i/5)*.2,.07,.025,{ink:.45});return;}
      const n=id==='sprout'?3:id==='grain'?5:18;for(let i=0;i<n;i++){const x=.1+(i%9)*.09,y=.08+Math.floor(i/9)*.12,h=id==='sprout'?.35:id==='grain'?.65:.12+(i%4)*.08;line([[x,y],[x+.02,y+h*.5],[x+.04,y+h]],{r:.0014});leaf(x+.02,y+h*.45,.1);if(id==='grain')for(let j=0;j<5;j++){ellipse(x+.04-(j%2?-.035:.035),y+h-j*.06,.025,.045,{ink:.6});}else line([[x,y],[x-.04,y+h*.6]],{r:.0012});}return;
    }
    if(['scroll','book','map','picture'].includes(id)){
      box(.14,.16,.7,.64);if(id==='scroll'){for(const x of [.12,.86]){line([[x,.06],[x,.92]],{r:.004});ellipse(x,.92,.035,.02);}}
      if(id==='map'){line([[.24,.24],[.45,.48],[.32,.57],[.65,.72],[.76,.57],[.57,.42],[.72,.27]],{ink:.6});line([[.28,.73],[.45,.54],[.5,.3]],{r:.001,ink:.4});}
      else if(id==='picture'){
        if(opts.pictureSubject==='battle'){for(let i=0;i<4;i++){const x=.25+i*.15;dot(x,.55,.012);line([[x,.52],[x-.03,.36],[x+.04,.36],[x,.52]],{r:.0018});line([[x-.02,.45],[x+.065,.6]],{r:.0012});line([[x-.015,.36],[x-.04,.26]]);line([[x+.02,.36],[x+.05,.26]]);}line([[.28,.61],[.28,.74],[.48,.7],[.29,.67]],{r:.001});}
        else{line([[.17,.3],[.4,.65],[.53,.4],[.7,.71],[.83,.33]],{ink:.4});for(let i=0;i<4;i++){line([[.25+i*.13,.3],[.29+i*.13,.46]],{r:.0015});dot(.29+i*.13,.49);}}
      }
      else for(let j=0;j<7;j++)for(let k=0;k<6;k++)line([[.22+j*.08,.26+k*.073],[.24+j*.08,.28+k*.073],[.25+j*.08,.25+k*.073]],{r:.00075,ink:.4});return;
    }
    if(['desk','bed','cart','wheel'].includes(id)){
      if(id!=='wheel'){box(.16,.36,.66,.14);line([[.12,.52],[.88,.52]],{r:.003});for(const x of [.2,.76])line([[x,.36],[x,.1]],{r:.003});}
      if(id==='bed'){line([[.14,.35],[.14,.8],[.3,.8]]);box(.25,.5,.18,.08);line([[.44,.54],[.58,.61],[.8,.54]],{ink:.35});}
      if(id==='cart'||id==='wheel')for(const x of id==='cart'?[.26,.72]:[.5]){ellipse(x,.27,id==='wheel'?.37:.17,id==='wheel'?.37:.17);for(let i=0;i<10;i++){let t=i*Math.PI/5,r=id==='wheel'?.34:.15;line([[x+.035*Math.cos(t),.27+.035*Math.sin(t)],[x+r*Math.cos(t),.27+r*Math.sin(t)]],{r:.0011});}ellipse(x,.27,.035,.035);}
      if(id==='cart'){line([[.16,.5],[.26,.9],[.72,.9],[.82,.5]],{r:.002});line([[.82,.45],[1,.3]]);}return;
    }
    if(['vessel','well','trough','gourd','inkstone'].includes(id)){
      if(id==='well'){ellipse(.5,.57,.39,.17);ellipse(.5,.57,.28,.105);line([[.11,.57],[.16,.2],[.84,.2],[.89,.57]]);for(let i=0;i<5;i++)line([[.18+i*.13,.22],[.18+i*.13,.45]],{ink:.45,r:.001});return;}
      if(id==='trough'||id==='inkstone'){line([[.1,.55],[.83,.55],[.94,.3],[.2,.3],[.1,.55],[.14,.15],[.86,.15],[.94,.3]],{r:.0025});ellipse(.52,.39,.24,.05,{ink:.45});return;}
      if(id==='gourd'){line([[.5,.06],[.22,.12],[.14,.3],[.25,.53],[.36,.61],[.29,.78],[.38,.92],[.56,.92],[.65,.78],[.58,.6],[.74,.46],[.84,.27],[.72,.08],[.5,.06]],{r:.0025});ellipse(.47,.92,.08,.02);return;}
      ellipse(.5,.75,.26,.06);line([[.24,.75],[.18,.38],[.3,.12],[.68,.12],[.83,.38],[.76,.75]],{r:.0027});ellipse(.5,.15,.2,.045,{ink:.5});line([[.74,.65],[.94,.66],[.96,.44],[.81,.36]],{r:.002});return;
    }
    if(['tent','cave','screen','box','basket'].includes(id)){
      if(id==='tent'){line([[.03,.12],[.47,.93],[.55,.93],[.97,.12],[.03,.12]],{r:.003});line([[.5,.9],[.5,.13],[.25,.13],[.5,.64],[.77,.13]],{r:.002});line([[.1,.14],[.02,.03]]);line([[.9,.14],[.99,.03]]);}
      if(id==='cave'){line([[.06,.12],[.12,.52],[.35,.9],[.62,.97],[.91,.71],[.97,.13]],{r:.008,ink:.65,dry:.65});line([[.25,.12],[.29,.43],[.4,.65],[.61,.72],[.74,.57],[.79,.14]],{r:.005});if(opts.caveHoles===3)for(let i=0;i<3;i++)ellipse(.34+i*.16,.78,.04,i===2?.1:.055);}
      if(id==='screen')for(let i=0;i<3;i++){box(.1+i*.27,.18,.26,.67);line([[.11+i*.27,.18],[.11+i*.27,.03]],{r:.0025});leaf(.17+i*.27,.27,.13);line([[.18+i*.27,.25],[.25+i*.27,.64]],{ink:.4});}
      if(id==='box'){box(.15,.16,.72,.4);line([[.15,.56],[.27,.76],[.88,.76],[.87,.56]],{r:.0025});box(.46,.4,.09,.12);}
      if(id==='basket'){ellipse(.5,.55,.37,.15);line([[.14,.55],[.23,.1],[.77,.1],[.87,.55]]);ellipse(.5,.66,.22,.29);hatch(.26,.15,.46,.25,8);}return;
    }
    if(['bow','target','arrow','spear','chisel','hammer','hoe','rod','needle','brush','ruler','broom','reed_pen','hairpin','ladle'].includes(id)){
      if(id==='target'){for(const r of [.36,.25,.12])ellipse(.5,.54,r,r);line([[.5,.18],[.3,.01]]);line([[.5,.18],[.7,.01]]);return;}
      if(id==='bow'){line([[.2,.04],[.53,.22],[.68,.51],[.53,.78],[.2,.97]],{r:.003});line([[.2,.04],[.22,.5],[.2,.97]],{r:.0008});line([[.22,.5],[.94,.5]],{r:.0012});return;}
      if(id==='arrow'){for(let i=0;i<(opts.arrowCount||3);i++){const x=.12+(i%10)*.075,y=Math.floor(i/10)*.025;line([[x,.1+y],[x+.24,.86-y]],{r:.001});line([[x+.18,.77-y],[x+.24,.86-y],[x+.26,.76-y]]);line([[x-.02,.13+y],[x+.06,.18+y]]);}return;}
      line([[.26,.1],[.68,.88]],{r:['rod','hammer','brush','hoe'].includes(id)?.004:.002});
      if(id==='spear')line(opts.brokenWeapon?[[.6,.77],[.67,.81],[.73,.8]]:[[.6,.77],[.7,.99],[.78,.78],[.6,.77]],{r:.0026});
      if(id==='hammer')box(.47,.7,.36,.2);if(id==='hoe')line([[.58,.82],[.89,.81],[.83,.64]],{r:.004});if(id==='chisel')line([[.17,.13],[.3,.06],[.38,.24]],{r:.003});
      if(id==='brush'||id==='reed_pen')line([[.26,.1],[.12,.015],[.21,.19]],{r:.004,ink:1.2});
      if(id==='broom')for(let i=0;i<8;i++)line([[.38,.32],[.05+i*.058,.02]],{r:.0017});
      if(id==='hairpin')ellipse(.71,.9,.1,.075);if(id==='ladle')ellipse(.68,.83,.2,.11);
      if(id==='needle')line([[.62,.82],[.83,.85],[.92,.6],[.75,.35]],{r:.0006});if(id==='ruler')for(let i=0;i<8;i++)line([[.3+i*.05,.17+i*.09],[.34+i*.05,.15+i*.09]],{r:.001});return;
    }
    if(['silk','clothing','mat','rope'].includes(id)){
      if(id==='rope'){line([[.47,.95],[.45,.7],[.48,.45],[.42,.1]],{r:.0025});for(let i=0;i<9;i++)line([[.43,.15+i*.08],[.49,.18+i*.08]],{ink:.4});return;}
      if(id==='clothing'){line([[.34,.9],[.12,.76],[.02,.5],[.19,.42],[.3,.61],[.19,.06],[.81,.06],[.7,.61],[.81,.42],[.98,.5],[.88,.76],[.66,.9],[.5,.7],[.34,.9]],{r:.0025});line([[.34,.9],[.6,.49],[.72,.4]],{r:.0012});line([[.29,.38],[.72,.38]],{r:.0018});}
      else {box(.1,.18,.8,.55);for(let i=0;i<12;i++)line([[.12+i*.063,.19],[.12+i*.063,.71]],{ink:.3,r:.0008});if(id==='silk')for(let i=0;i<7;i++)line([[.1+i*.08,.18],[.2+i*.08,.08],[.4+i*.05,.13]],{r:.0007});}return;
    }
    if(id==='loom'){box(.15,.18,.7,.66);line([[.1,.08],[.24,.92],[.34,.95]]);line([[.87,.08],[.72,.92],[.62,.95]]);for(let i=0;i<10;i++)line([[.26+i*.048,.81],[.26+i*.048,.35]],{r:.0006});box(.21,.24,.57,.13);line([[.27,.5],[.75,.55]],{r:.003});return;}
    if(id==='fan'){ellipse(.5,.61,.3,.32);line([[.5,.31],[.5,.05]],{r:.003});leaf(.45,.46,.23);return;}
    if(id==='mirror'){ellipse(.5,.59,.31,.33);ellipse(.5,.59,.27,.29,{ink:.4});line([[.5,.25],[.5,.09],[.25,.09],[.76,.09]],{r:.0026});line([[.38,.7],[.53,.82]],{ink:.2});return;}
    if(id==='bell'){line([[.15,.24],[.23,.63],[.38,.82],[.39,.92],[.59,.92],[.62,.82],[.78,.62],[.86,.24],[.15,.24]],{r:.003});ellipse(.5,.24,.35,.09);line([[.29,.58],[.7,.58]],{ink:.5});return;}
    if(id==='drum'){ellipse(.5,.71,.38,.15);line([[.12,.71],[.15,.23],[.35,.1],[.67,.1],[.87,.25],[.88,.71]]);ellipse(.5,.26,.34,.11);line([[.2,.82],[.53,.91]],{r:.004});return;}
    if(id==='jade'||id==='coin'){const n=id==='jade'?(opts.jadeCount||1):3;for(let i=0;i<n;i++){const x=n===1?.5:.27+(i%3)*.23;ellipse(x,.46,.16,.16,{r:.0022});if(id==='coin')box(x-.045,.415,.09,.09);else ellipse(x,.46,.055,.055,{ink:.3});}return;}
    if(id==='grave'){const n=opts.graveCount||1;for(let i=0;i<n;i++){let x=n===1?.3:.04+i*.18,w=n===1?.4:.13;box(x,.13,w,.62);line([[x,.75],[x+w/2,.87],[x+w,.75]],{r:.002});for(let j=0;j<4;j++)line([[x+w*.45,.29+j*.1],[x+w*.6,.29+j*.1]],{ink:.4,r:.001});}return;}
    if(id==='fire'){for(let i=0;i<6;i++){let x=.16+i*.12;line([[x,.08],[x-.03,.28],[x+.06,.65+(i%2)*.17],[x+.1,.3],[x+.2,.07]],{r:.003,ink:.1,cin:.65});}return;}
    if(id==='star'){for(let i=0;i<18;i++){let x=.1+((i*37)%83)/100,y=.12+((i*23)%71)/100;dot(x,y,i%6===0?.005:.002,{ink:.4});}return;}
    if(id==='trigrams'){for(let i=0;i<6;i++)if(i%2){line([[.12,.17+i*.12],[.43,.17+i*.12]],{r:.004});line([[.57,.17+i*.12],[.88,.17+i*.12]],{r:.004});}else line([[.12,.17+i*.12],[.88,.17+i*.12]],{r:.004});return;}
    if(id==='face'){ellipse(.5,.5,.29,.4);line([[.29,.65],[.42,.68]]);line([[.58,.68],[.72,.65]]);dot(.36,.59);dot(.65,.59);line([[.5,.57],[.46,.4],[.54,.4]]);line([[.4,.29],[.5,.26],[.6,.3]]);return;}
    if(id==='swing'){line([[.15,.95],[.22,.23],[.79,.23],[.85,.95]],{r:.002});line([[.19,.2],[.82,.2]],{r:.004});return;}
    if(id==='web'){for(let i=0;i<8;i++){let t=i*Math.PI/4;line([[.5,.5],[.5+.43*Math.cos(t),.5+.43*Math.sin(t)]],{r:.00065,ink:.45});}for(const r of [.13,.25,.37])ellipse(.5,.5,r,r,{r:.00065,ink:.35},8);return;}
    if(id==='kite'){line([[.5,.95],[.12,.62],[.5,.3],[.88,.62],[.5,.95],[.5,.3],[.68,.17],[.49,.04]],{r:.002});line([[.12,.62],[.88,.62]]);line([[.5,.3],[.16,.02]],{r:.0007});return;}
    if(id==='shoe'){line([[.14,.4],[.21,.7],[.37,.6],[.57,.22],[.84,.2],[.9,.12],[.13,.12],[.14,.4]],{r:.003});return;}
    if(id==='nest'){for(let j=0;j<8;j++)line([[.08,.2+j*.034],[.27,.08+j*.032],[.75,.09+j*.036],[.94,.23+j*.034]],{ink:.5,r:.0015});for(let i=0;i<(opts.chickCount||4);i++){let x=.25+i*.15;ellipse(x,.48,.05,.055);line([[x-.05,.52],[x,.61],[x+.05,.52]],{r:.001,cin:.4});}return;}
    if(id==='clam'){line([[.13,.18],[.19,.72],[.47,.84],[.85,.69],[.87,.18],[.13,.18]],{r:.0025});for(let i=0;i<6;i++)line([[.5,.2],[.22+i*.12,.7]],{r:.001});return;}
    if(id==='frog'){ellipse(.5,.5,.22,.15);ellipse(.35,.65,.08,.09);ellipse(.65,.65,.08,.09);dot(.35,.67);dot(.65,.67);for(const f of [-1,1])line([[.5+f*.17,.48],[.5+f*.35,.3],[.5+f*.29,.13],[.5+f*.43,.12]],{r:.0025});return;}
    if(id==='snake'){line([[.1,.15],[.26,.4],[.49,.23],[.67,.38],[.44,.62],[.55,.8],[.8,.74]],{r:.006});for(let i=0;i<7;i++)line([[.23+i*.07,.4+(i%2)*.15],[.25+i*.07,.43+(i%2)*.15]],{ink:.15});ellipse(.82,.74,.09,.035);dot(.85,.76);return;}
    if(id==='lotus_root'){for(let i=0;i<3;i++){ellipse(.3+i*.2,.48,.18,.12);ellipse(.3+i*.2,.48,.035,.028,{ink:.4});}return;}
    if(id==='seedpod'){ellipse(.5,.64,.32,.19);line([[.18,.64],[.43,.3],[.56,.3],[.82,.64]]);for(let i=0;i<7;i++)ellipse(.32+(i%3)*.16,.59+Math.floor(i/3)*.075,.026,.019);line([[.5,.3],[.48,.04]]);return;}
    if(id==='cangue'){line([[.13,.55],[.8,.65],[.91,.31],[.2,.24],[.13,.55]],{r:.003});ellipse(.5,.46,.1,.08);return;}
    if(id==='tracks'){for(let i=0;i<5;i++){let x=.2+i*.13,y=.16+i*.15;line([[x-.06,y+.05],[x,y],[x,y+.09],[x,y],[x+.06,y+.05]],{r:.0017});}return;}
    if(id==='stump'){line([[.25,.12],[.34,.35],[.31,.7],[.68,.7],[.65,.3],[.8,.12]],{r:.0035});ellipse(.5,.7,.19,.065);ellipse(.5,.7,.11,.033,{ink:.4});hatch(.37,.26,.23,.33,4);return;}
    if(id==='pillar'){box(.38,.12,.2,.75);line([[.26,.11],[.72,.11]],{r:.004});return;}
    if(id==='wood'){
      if(opts.woodForm==='tablet'){for(const x of [.23,.62]){box(x,.1,.16,.78);for(let j=0;j<5;j++)line([[x+.04,.25+j*.1],[x+.11,.29+j*.1]],{r:.001});}return;}
      if(opts.woodForm==='block'){box(.13,.32,.75,.17);line([[.13,.49],[.23,.61],[.98,.61],[.88,.49],[.98,.61],[.98,.43],[.88,.32]],{r:.002});return;}
      if(opts.woodForm==='rammer'){box(.15,.13,.67,.27);for(const x of [.26,.71])line([[x,.4],[x,.96]],{r:.004});return;}
      for(let i=0;i<3;i++){line([[.1,.15+i*.1],[.84,.55+i*.12]],{r:.007,dry:.65});line([[.2,.25+i*.1],[.67,.46+i*.12]],{r:.001,ink:.4});}return;
    }
    if(id==='bone'){line([[.26,.21],[.35,.29],[.72,.68],[.82,.71]],{r:.006});ellipse(.25,.2,.08,.07);ellipse(.83,.74,.08,.07);return;}
    if(id==='earth'){for(let i=0;i<10;i++)line([[.08+i*.018,.08+i*.018],[.3,.15+i*.025],[.66,.14+i*.032],[.92-i*.01,.08+i*.02]],{r:.002,ink:.35,dry:.8});return;}
    throw new Error('未實作繪圖元件：'+id);
  }
  function drawPerson(ctx,action='',opts={}){
    const {S,D}=ctx,line=(p,o={})=>S(p,{r:.0012,ink:.78,water:.07,dry:.45,...o});
    const seated=['qin','pipa','sit','study','write','sew','listen','beg','mourn'].includes(action);
    const bent=['farm','work','inspect','search','sweep','pick_flower'].includes(action);
    const dx=bent?.12:0,headX=.44+dx,headY=.9-(bent?.05:0);
    const h=Array.from({length:25},(_,i)=>[headX+.064*Math.cos(i*Math.PI/12),headY+.075*Math.sin(i*Math.PI/12)]);
    line(h,{r:.0014});line([[headX-.061,headY],[headX-.058,headY+.06],[headX,headY+.082],[headX+.048,headY+.063]],{r:.003,ink:.95});
    D(headX-.035,headY+.09,{r:.004,ink:.8,water:.04});D(headX+.035,headY+.016,{r:.0013,ink:.85,water:.01});
    line([[headX+.057,headY+.003],[headX+.078,headY-.02],[headX+.052,headY-.03]],{r:.0007});
    if(opts.squareHat)line([[headX-.085,headY+.06],[headX-.085,headY+.15],[headX+.055,headY+.15],[headX+.055,headY+.06]],{r:.002});
    const waist=seated?.4:.35;
    line([[headX-.04,headY-.07],[.28,.77],[.3,waist],[.21,.09],[.6,.09],[.52,waist],[.52,.78],[headX+.025,headY-.07]]);
    line([[.34,.8],[.46,.59],[.53,.52]],{r:.001});line([[.31,waist],[.51,waist]],{r:.002});
    for(let i=0;i<3;i++)line([[.34+i*.055,waist-.015],[.29+i*.105,.13]],{r:.0008,ink:.45});
    const gestures={refuse:[.68,.81],stop:[.69,.84],protect:[.88,.41],care:[.75,.59],write:[.86,.54],study:[.81,.56],sew:[.76,.58],
      present:[.91,.61],serve:[.9,.59],help:[.9,.61],comfort:[.9,.76],hold_back:[.9,.72],archer:[.96,.75],point:[.95,.88],
      strike:[.84,1],inspect:[.91,.26],show_hands:[.91,.75],hold_chest:[.53,.66],mirror:[.88,.84],touch:[.9,.55],pour:[.9,.64],
      fish:[.86,.61],farm:[.91,.32],work:[.9,.4],pick_flower:[.9,.32],reach:[.91,.65],look_moon:[.79,.93],mourn:[.52,.86],beg:[.85,.5],
      hang:[.86,1],practice:[.87,.92],cover:[.94,.8],descend:[.75,.99],ascend:[.85,.94],sweep:[.91,.31],swim:[.96,.77]};
    const hand=gestures[action]||[.73,.57],elbow=[.61,Math.min(.72,hand[1]-.04)];
    line([[.51,.76],elbow,hand,[hand[0]-.02,hand[1]-.04],[elbow[0]-.04,elbow[1]-.14],[.48,.58]]);
    line([[hand[0],hand[1]],[hand[0]+.043,hand[1]+.012]],{r:.0008});
    if(['care','protect','sew','archer','show_hands','hold_back','qin'].includes(action))line([[.3,.74],[.39,.5],[hand[0]-.025,hand[1]-.1]],{r:.0011});
    if(seated)line([[.3,.13],[.75,.2],[.8,.12]],{r:.0016});
    else{line([[.27,.08],[.22,.025],[.37,.025]],{r:.0018});line([[.53,.08],[.6,.03],[.72,.03]],{r:.0018});}
    if(['walk','lead'].includes(action))line([[.73,.58],[.81,.02]],{r:.001});
  }
  // 所有座標採左側畫區的歸一化座標（y 向上）；編譯時保存於各篇場景。
  function layout(stage,ids,opts={}){
    const boxes={},has=id=>ids.includes(id),put=(id,x,y,w,h,extra={})=>{if(has(id.split(':')[0]))boxes[id]={x,y,w,h,...extra};};
    const n=opts.personCount||1,actors=Array.from({length:n},(_,i)=>'person:'+i);
    const props=ids.filter(id=>MOTIFS[id] && !['grass','sprout','star','tent','cave'].includes(id));
    const cast=(x,y,w,h,gap=.13)=>actors.forEach((id,i)=>put(id,n>3?.08+i*.76/(n-1):x+i*Math.min(gap,(.95-x-w)/Math.max(1,n-1)),y,n>3?Math.min(w,.14):w,h,{flip:i%2===1}));
    const propRow=(x=.18,y=.2,w=.24,h=.27)=>props.forEach((id,i)=>put(id,x+(i%3)*.25,y+Math.floor(i/3)*.25,w,h));
    if(['object','portrait','duet','study','court','gathering','interior'].includes(stage)){
      propRow();
      if(stage==='object'){
        const objects=ids.filter(id=>!['person','moon','sun','rain','snow','cloud'].includes(id));
        objects.forEach((id,i)=>put(id,.12+(i%2)*.43,.22+Math.floor(i/2)*.34,.38,.36));
        if(objects.length===1)put(objects[0],.18,.2,.64,.6);
        cast(.6,.16,.15,.34,.16);
      }else if(stage==='portrait'){cast(.32,.14,.32,.55,.22);props.forEach((id,i)=>put(id,.63,.21+i*.16,.23,.23));}
      else if(['study','gathering'].includes(stage)){
        actors.forEach((id,i)=>put(id,n===1?.22:.15+i*.52/Math.max(1,n-1),.28,n<=2?.23:.16,.36,{flip:i>0}));
        put('desk',.28,.17,.44,.3);put('book',.37,.42,.24,.075);put('scroll',.36,.41,.25,.17);
        put('chess',.31,.29,.36,.14);put('cup',.36,.35,.3,.07);put('brush',.43,.43,.12,.15);put('qin',.3,.31,.4,.1);
      }else if(['duet','court'].includes(stage)){
        actors.forEach((id,i)=>put(id,n===1?.23:.15+i*.6/Math.max(1,n-1),.16,.17,.43,{flip:i>0}));
        props.forEach((id,i)=>put(id,.36+(i%2)*.18,.15+Math.floor(i/2)*.2,.23,.25));
        put('ox',.39,.13,.29,.31);put('dog',.53,.14,.24,.24);put('cave',.05,.09,.9,.74);
      }else{
        cast(.29,.17,.17,.33,.2);put('house',.1,.08,.78,.7);put('pavilion',.05,.06,.78,.78);put('tent',.1,.12,.76,.62);
        put('bed',.36,.12,.37,.3);put('lamp',.65,.4,.08,.13);put('rain',.81,.2,.15,.68);put('snow',.82,.3,.14,.55);
        put('moon',.8,.77,.11,.11);put('sun',.8,.77,.1,.1);
      }
    }else{
      // 戶外保留既有山水空間；新器物依敘事前景落位。
      propRow(.15,.12,.2,.23);
      if(stage==='journey'||stage==='war'){
        cast(.35,.2,.08,.19,.1);put('cart',.42,.14,.32,.28);put('banner',.7,.2,.15,.4);put('tent',.09,.26,.28,.3);
        if(has('horse'))for(let i=0;i<(opts.horseCount||1);i++)put('horse:'+i,.08+(i%2)*.16,.1+Math.floor(i/2)*.18,.16,.17);
        if(has('cart'))actors.forEach((id,i)=>put(id,.47+i*.095,.34,.08,.16,{flip:i%2===1}));
      }
      if(stage==='mountain'){cast(.36,.56,.065,.15,.1);put('cloud',.02,.35,.9,.15);}
      if(stage==='garden'){cast(.61,.12,.1,.25,.16);put('grave',.27,.1,.3,.28);}
      if(stage==='village'){cast(.55,.12,.1,.22,.13);put('hoe',.65,.14,.17,.15);}
      if(stage==='river' && has('person') && has('boat') && opts.onBoat!==false && !opts.emptyBoat){put('boat',.29,.16,.42,.16);cast(.42,.26,.055,.1,.08);}
      if(['separated','farewell','celestial'].includes(stage)){
        actors.forEach((id,i)=>put(id,i===0?.15:.72,.23+i*.09,.13,.29,{flip:i>0}));
        put('boat',.61,.2,.31,.11);put('loom',.12,.14,.36,.32);put('star',.04,.49,.92,.39);
      }
      if(stage==='rescue'){put('river',.25,.04,.7,.3);put('person:0',.55,.1,.25,.13,{rotate:Math.PI/2});actors.slice(1).forEach((id,i)=>put(id,.08+i*.16,.24,.13,.29));put('coin',.64,.09,.08,.04);}
      if(stage==='hierarchy'){put('pine',.21,.08,.36,.38);put('sprout',.67,.61,.11,.16);put('mountain',.37,.06,.61,.61);}
      if(stage==='vast_figure')cast(.41,.09,.035,.08,.06);
    }
    if(opts.personAction==='protect'){put('person:0',.18,.17,.24,.42);put('person:1',.49,.18,.11,.2);put('well',.62,.12,.25,.23);}
    if(opts.personAction==='care'){put('person:0',.32,.18,.22,.44);put('person:1',.53,.31,.085,.14);}
    if(opts.personAction==='archer'){put('person:0',.14,.14,.22,.44);put('bow',.36,.27,.2,.36);put('target',.76,.31,.17,.25);put('arrow',.45,.38,.29,.17);}
    if(opts.personAction==='descend'||opts.personAction==='ascend'){put('wall',.1,.08,.43,.7);put('person:0',.54,.3,.14,.31);put('rope',.51,.16,.1,.6);}
    if(opts.personAction==='sleep'){put('person:0',.33,.23,.37,.12,{rotate:Math.PI/2});put('bed',.22,.12,.56,.3);}
    if(opts.personAction==='sew'){put('person:0',.24,.18,.2,.4);put('clothing',.47,.19,.27,.21);put('needle',.43,.38,.17,.07);}
    if(opts.personAction==='write'){put('person:0',.24,.22,.23,.41);put('desk',.35,.12,.45,.27);put('scroll',.46,.39,.25,.12);put('book',.46,.39,.25,.07);put('brush',.43,.39,.1,.17);}
    if(opts.personAction==='mirror'){put('mirror',.57,.37,.18,.23);}
    if(opts.personAction==='cover'){put('person:0',.15,.26,.22,.4);put('person:1',.47,.2,.2,.29);put('clothing',.44,.29,.28,.2);}
    if(opts.personAction==='hang'){put('house',.16,.13,.66,.55);put('person:0',.32,.1,.16,.3);put('wood',.39,.35,.14,.17);}
    if(opts.personAction==='look_back')for(const id of actors)if(boxes[id])boxes[id].flip=true;
    if(opts.personAction==='hold_back'){put('person:0',.17,.18,.2,.39);put('person:1',.4,.17,.19,.35);}
    if(opts.personAction==='help'){put('person:0',.22,.19,.23,.39);put('person:1',.43,.18,.17,.31);}
    if(opts.borrowedLight){put('wall',.44,.07,.38,.71);put('book',.3,.25,.2,.1);put('person:0',.12,.17,.17,.35);put('lamp',.66,.34,.09,.16);}
    if(opts.birdAction==='falcon')put('bird',.44,.48,.14,.15);
    if(opts.birdAction==='clam'){put('bird',.19,.22,.37,.37);put('clam',.57,.15,.25,.21);}
    if(opts.birdAction==='chase'){put('bird',.67,.14,.12,.13);put('cat',.3,.12,.3,.27);}
    if(opts.smallTree)for(const id of ['pine','tree'])put(id,.25,.12,.3,.35);
    if(opts.lowMoon)put('moon',.65,.38,.09,.09);
    if(opts.distantBoat)put('boat',.7,.38,.12,.035);
    if(opts.distantPerson && stage!=='separated')put('person:'+(n-1),.76,.38,.055,.12);
    if(opts.splitWeather){put('rain',.58,.36,.37,.51);put('sun',.12,.74,.12,.12);}
    if(opts.crescent&&stage==='object')put('moon',.37,.42,.22,.26);
    if(opts.reflection){put('mountain',.06,.38,.86,.45);put('pond',.07,.1,.86,.25);}
    for(const b of Object.values(boxes)){b.w=Math.min(.94,b.w);b.h=Math.min(.94,b.h);b.x=Math.max(.02,Math.min(.98-b.w,b.x));b.y=Math.max(.02,Math.min(.98-b.h,b.y));}
    return boxes;
  }
  root.MoyunObjects={MOTIFS,draw,drawPerson,layout};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.MoyunObjects;
})(typeof window!=='undefined'?window:globalThis);
