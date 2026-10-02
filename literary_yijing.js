/* 墨韻・意境解析層
 * 原文 → 物象（literary_engine）之外，再解析「情、時、氣、境、法」：
 *   情：情感基調與情景關係（孤寂、蕭瑟、閒適、空靈、雄渾、離愁、明麗、沉鬱、家國、曠達）
 *   時：時辰、季節、天候
 *   境：郭熙三遠（平遠・高遠・深遠）、空間尺度、主體與留白比例、有我／無我之境
 *   法：墨色濃淡乾濕、皴法、設色、烘托與留白手法
 * 輸出只影響構圖與筆墨，不新增任何未經原文核定的物象。
 */
(function (root) {
  'use strict';

  /* ───────── 情感詞庫：權重越高越具判別力；導賞與專篇主旨另乘 2 ───────── */
  const EMOTION = {
    solitude: { label: '孤寂清寒', lex: [[/孤舟|孤帆|孤城|孤鴻|孤雲|獨釣|獨坐|獨酌|獨上|獨立|獨自/, 3], [/孤|獨|寂寥|寂寞|寂|絕|滅|空/, 1.2], [/寒江|冷落|淒清|清冷/, 1.5], [/寒山/, .6], [/天涯|一身|隻影|形單/, 1.5]] },
    desolate: { label: '蕭瑟羈愁', lex: [[/斷腸|昏鴉|瘦馬|西風|古道|蕭蕭|蕭瑟|衰草|荒|枯藤|落木/, 2.2], [/秋|枯|殘|老樹|瘦|黃葉|霜/, 1], [/羈|旅|客|天涯|漂泊|飄零/, 1.3]] },
    serene: { label: '閒適恬淡', lex: [[/悠然|采菊|東籬|歸園|田園|守拙|閒|自得|自在|漁樵|桑麻/, 2.2], [/南山|清泉|松|竹|柴門|雞犬|炊煙/, 1], [/歸|樂|適|安|恬/, .8]] },
    zen: { label: '空靈禪寂', lex: [[/空山|深林|人閒|不見人|但聞|返景|明月松間|鳥鳴澗|萬籟/, 3], [/幽|靜|禪|寺|鐘|僧|山寂|松|苔/, 1.3]] },
    heroic: { label: '雄渾豪放', lex: [[/大江東去|飛流直下|黃河|長風|萬里|千里|驚濤|捲起|雄|壯|豪|會當|一覽/, 2.2], [/萬|千|奔|湧|天門|九天|浪|劍|戰|馬|鵬/, .9]] },
    longing: { label: '思念離愁', lex: [[/思故鄉|故鄉|相思|故人|歸期|遊子|離別|送別|寄|憶|何當|不見|唯見/, 2.2], [/思|鄉|別|送|歸|遠|望|盡|長江天際/, .9]] },
    joyful: { label: '明麗生機', lex: [[/春風|花開|鶯|燕|新綠|欣欣|笑|喜|歡|晴|暖|生機|兩個黃鸝|一行白鷺/, 2], [/春|花|綠|紅|青|鮮|樂|嬌/, .7], [/紅於|坐愛|爛漫|豔|勝似|如畫/, 1.6]] },
    melancholy: { label: '沉鬱悲愴', lex: [[/艱難|潦倒|淚|斷腸|憔悴|悲|哀|愁|恨|傷心|淒淒慘慘/, 2.2], [/苦|病|白髮|霜鬢|殘|傷|泣|怨/, 1]] },
    patriotic: { label: '家國憂思', lex: [[/國破|山河|烽火|社稷|天下|先憂|家國|戍|胡|塞|兵|戰/, 2.2], [/國|城|民|憂|征|關/, .8]] },
    transcendent: { label: '超然曠達', lex: [[/一蓑煙雨|也無風雨|任平生|逍遙|物與我|乘風|千里共嬋娟|人生如夢|何妨|寄蜉蝣|變者|天地/, 2.6], [/曠|達|悠|仙|清風|明月|超|飄/, .8]] }
  };
  const EMOTION_STYLE = {
    // E 留白比例；still 靜穆程度；ink 墨量；wet 水分；dry 枯筆；warm 赭朱暖意；tex 預設皴法
    solitude:     { E: .82, still: .95, ink: .82, wet: .38, dry: .3, warm: 0, tex: 'pima', scale: 'vast' },
    desolate:     { E: .55, still: .55, ink: .98, wet: .15, dry: .62, warm: .35, tex: 'fupi', scale: 'medium' },
    serene:       { E: .62, still: .85, ink: .85, wet: .42, dry: .2, warm: .12, tex: 'pima', scale: 'medium' },
    zen:          { E: .78, still: 1, ink: .7, wet: .58, dry: .12, warm: 0, tex: 'pima', scale: 'medium' },
    heroic:       { E: .3, still: .2, ink: 1.18, wet: .25, dry: .48, warm: .1, tex: 'fupi', scale: 'vast' },
    longing:      { E: .74, still: .75, ink: .82, wet: .5, dry: .18, warm: .05, tex: 'pima', scale: 'vast' },
    joyful:       { E: .48, still: .5, ink: .88, wet: .5, dry: .1, warm: .45, tex: 'pima', scale: 'medium' },
    melancholy:   { E: .52, still: .6, ink: 1.05, wet: .55, dry: .3, warm: 0, tex: 'midian', scale: 'medium' },
    patriotic:    { E: .48, still: .45, ink: 1.1, wet: .3, dry: .5, warm: .15, tex: 'fupi', scale: 'medium' },
    transcendent: { E: .72, still: .7, ink: .85, wet: .45, dry: .2, warm: .05, tex: 'pima', scale: 'vast' }
  };

  /* ───────── 時令天候：先看取景段落，再看全篇；修辭與否定先剔除 ───────── */
  const METAPHOR_STRIP = /疑是地上霜|千堆雪|香腮雪|不是雪|如雪|似雪|梨花開|春風來|疑是銀河|月兩回圓|人比黃花瘦|花千樹|星如雨|鬢雲|雪滿頭/g;
  const TIME = [
    ['night', '夜', /夜|(?<![一二三四五六七八九十正臘歲年])月(?!初)|宵|燭|燈|星|更深|眠|宿|夢|嬋娟|中秋|既望|漁火|鐘聲到客船|明月/],
    ['dusk', '暮', /夕陽|落日|殘陽|斜陽|日暮|日夕|暮|黃昏|昏鴉|晚|返景|向晚|夕/],
    ['dawn', '晨', /曉|晨|朝辭|朝雨|日出|初陽|拂曉|平明|清晨|旦|破曉/]
  ];
  const SEASON = [
    ['winter', '冬', /雪|冰|寒梅|冬|臘|朔風|北風捲地/],
    ['autumn', '秋', /秋|楓|菊|黃花|落木|落葉|黃葉|西風|雁|霜|蟬鳴|九月|重陽/],
    ['summer', '夏', /荷|蓮|蟬|夏|梅子黃|芙蕖|菡萏|五月|蛙/],
    ['spring', '春', /春|桃|杏|鶯|燕|柳|新綠|清明|花開|三月|芳草/]
  ];
  const WEATHER = [
    ['snow', '雪', /雪(?!頭)|霏霏/],
    ['rain', '雨', /雨/],
    ['wind', '風', /急風|風急|狂風|西風|長風|怒號|陰風|風雷|蕭蕭/],
    ['mist', '煙霧', /煙|霧|雲深|嵐|靄|霏|朦朧|紫煙|煙波|煙花/]
  ];
  const VIEW = {
    gaoyuan: { label: '高遠', note: '自山下仰望山巔，主峰挺立、上不見頂，表現崇高與力量', lex: [[/瀑|飛流|直下|峰|嶽|絕頂|千仞|登|高|險|危|天門|九天|崔嵬|壁立/, 1.6]] },
    shenyuan: { label: '深遠', note: '自山前窺山後，層巒重疊、雲氣隔斷，表現幽深與重複', lex: [[/深|幽|曲徑|深林|谷|澗|萬重|重山|松間|竹裏|竹里|禪房|蒼苔|空山/, 1.5]] },
    pingyuan: { label: '平遠', note: '自近山望遠山，水天相接、地平線低，表現開闊、悠遠與淡泊', lex: [[/江|湖|河|川|天際|盡|平野|野曠|大漠|長河|平沙|千里|萬里|極目|遠|洲|渚|煙波/, 1.2]] }
  };
  const TIME_LABEL = { night: '夜', dusk: '黃昏', dawn: '清晨', day: '白晝' };
  const SEASON_LABEL = { spring: '春', summer: '夏', autumn: '秋', winter: '冬', '': '未明言' };
  const WEATHER_LABEL = { clear: '晴明', rain: '雨', snow: '雪', wind: '風', mist: '煙霧' };
  const TEX_LABEL = { pima: '披麻皴（長線柔潤，宜江南平和）', fupi: '斧劈皴（方折剛健，宜雄奇蒼勁）', midian: '米點皴（橫點積墨，宜煙雨迷濛）', none: '不皴，以淡墨勾勒、烘托留白' };

  const LANDSCAPE = ['mountain', 'river', 'pond', 'sea', 'waves', 'desert', 'field', 'waterfall'];
  const FOCAL_PRIORITY = ['waterfall', 'boat', 'person', 'moon', 'horse', 'house', 'pavilion', 'plum', 'lotus', 'bamboo', 'chrysanthemum', 'peach', 'pine', 'bare_tree', 'willow', 'goose', 'bird', 'tree', 'mountain', 'sunset', 'river', 'pond', 'waves', 'desert', 'stone'];

  /* ───────── 名篇意境校訂：依文學史共識與詩意精讀，人工校定構圖與意境解讀 ───────── */
  const OVERRIDES = {};
  function O(author, titlePrefix, spec) { OVERRIDES[author + '|' + titlePrefix] = spec; }
  O('柳宗元', '江雪', { emotion: 'solitude', time: 'day', season: 'winter', weather: 'snow', viewpoint: 'pingyuan', scale: 'vast', E: .86, focal: 'boat', side: 'left', realm: '有我之境', tex: 'none', hints: { hat: true },
    composition: '高處俯瞰：千山只以淡墨勾出雪線，天空與江面以灰墨烘托，山體留白即是積雪；孤舟落在畫面右下三分點，僅佔極小比例。',
    reading: '前兩句以「千山」「萬徑」的極大空間配上「絕」「滅」的極度寂靜，鋪出無鳥無人的冰雪天地；後兩句鏡頭驟然收束到一葉孤舟、一位蓑笠翁。天地愈大，人愈小；萬物皆寂，唯此人獨釣。所釣的是「寒江雪」而非魚，寄寓柳宗元貶謫永州後孤高自守、不肯屈從的心境。' });
  O('李白', '靜夜思', { emotion: 'longing', time: 'night', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .72, focal: 'person', side: 'left', realm: '有我之境', tex: 'none', hints: { lookUp: true },
    composition: '夜色以淡墨通染，留出一輪明月與地面清光；屋舍只作簡筆退居一側，人物在屋前仰首望月，月與人遙遙相對構成視線。',
    reading: '「疑是地上霜」寫月色清冷如霜的錯覺，暗示夜深難眠；「舉頭」與「低頭」兩個動作，把外在的月光轉為內在的鄉思。畫面不畫霜雪，只以烘雲托月留出一地清光，讓仰望的人與明月之間的大片空白承載說不出的思鄉。' });
  O('馬致遠', '天淨沙', { emotion: 'desolate', time: 'dusk', season: 'autumn', weather: 'wind', viewpoint: 'pingyuan', scale: 'medium', E: .5, focal: 'person', side: 'left', realm: '有我之境', tex: 'fupi', hints: { crows: true },
    composition: '近景左側枯藤老樹、昏鴉棲枝，以焦墨枯筆；中景小橋流水人家淡墨溫潤，作為「家」的反襯；古道自前景斜出，瘦馬旅人背向人家走向天涯；夕陽低懸遠天。',
    reading: '前三句九個名詞並置，如電影蒙太奇：枯、老、昏、瘦寫盡蕭瑟，而「小橋流水人家」的溫暖恰是旅人歸不得的家園。結句「斷腸人在天涯」點出全篇主體，景語皆情語。畫面以乾澀焦墨寫秋風，以夕陽一點朱色收束一日將盡、歸期無望的悲涼。' });
  O('李白', '望廬山瀑布', { emotion: 'heroic', time: 'day', season: '', weather: 'mist', viewpoint: 'gaoyuan', scale: 'vast', E: .32, focal: 'waterfall', side: 'center', realm: '無我之境', tex: 'fupi',
    composition: '高遠構圖：香爐峰巨嶂居中直上畫頂，瀑布自峰間一線垂落三千尺，底部以水霧留白；紅日高懸一側，紫煙以淡墨暈染繚繞山腰。',
    reading: '「日照香爐生紫煙」以光色寫山氣，「遙看」點出遠觀距離；「飛流直下三千尺」以誇飾寫力度，「疑是銀河落九天」以想像把瀑布推向天外。意境雄奇奔放，畫面以高遠法讓瀑布成為貫穿上下的主線，不另畫天河。' });
  O('張繼', '楓橋夜泊', { emotion: 'melancholy', time: 'night', season: 'autumn', weather: 'mist', viewpoint: 'pingyuan', scale: 'medium', E: .62, focal: 'boat', side: 'right', realm: '有我之境', tex: 'midian', hints: { boatLight: true },
    composition: '月已落，夜空以重墨通染不留月；江岸楓樹與寺宇剪影淡入夜霧，客船泊於江心，篷下一點漁火以朱砂點出，是全畫唯一的暖光。',
    reading: '「月落烏啼霜滿天」三種感受疊出深秋夜半的寒氣；「江楓漁火對愁眠」以一點火光映照旅人不眠的愁。後兩句以寒山寺的夜半鐘聲由遠而近傳到客船，以聲寫靜、以靜寫愁。畫面以濃夜襯一點漁火，正是愁眠的視覺焦點。' });
  O('杜甫', '登高', { emotion: 'melancholy', time: 'day', season: 'autumn', weather: 'wind', viewpoint: 'gaoyuan', scale: 'vast', E: .5, focal: 'person', side: 'left', realm: '有我之境', tex: 'fupi', hints: { fallingLeaves: true, onHeight: true },
    composition: '詩人孤立高處坡岸，身形極小；近處枯樹落葉紛飛，遠處長江以平遠法橫亙天際，飛鳥兩點迴旋，風勢以斜向筆觸統一畫面。',
    reading: '前四句以「風急天高」「無邊落木」「不盡長江」寫出宇宙的浩大與時間的無盡；後四句轉入「萬里悲秋」「百年多病」，個人的衰病潦倒在天地中更顯渺小。被譽為古今七律第一，意境沉鬱頓挫。畫面以極小的孤影對極闊的江天，使悲秋之情有空間可依。' });
  O('李白', '黃鶴樓送孟浩然', { emotion: 'longing', time: 'day', season: 'spring', weather: 'mist', viewpoint: 'pingyuan', scale: 'vast', E: .88, focal: 'boat', side: 'left', realm: '有我之境', tex: 'none', hints: { vanishingSail: true },
    composition: '極端平遠：近岸只留一抹坡腳，長江自畫面中段向右上天際延伸，水天以淡墨相接；孤帆縮成天邊一點，其餘盡皆留白。',
    reading: '「孤帆遠影碧空盡，唯見長江天際流」不寫離情而離情自見：詩人久久佇立目送，直到帆影消失，只剩江水流向天邊。畫面以大片空白承載這段凝望的時間，帆影越小、留白越大，惜別越深。' });
  O('王維', '山居秋暝', { emotion: 'serene', time: 'night', season: 'autumn', weather: 'mist', viewpoint: 'shenyuan', scale: 'medium', E: .58, focal: 'pine', side: 'left', realm: '無我之境', tex: 'pima',
    composition: '深遠構圖：雨後空山層層淡入，近景松樹之間懸一輪明月；清泉自石上流出，下方蓮動舟行、浣女歸來作點景，人事融於山水之中。',
    reading: '「空山新雨後」先寫洗淨後的清新，「明月松間照，清泉石上流」以光與聲寫出澄明幽靜；「竹喧」「蓮動」以動寫靜，引出人間的淳樸。結句「王孫自可留」表明此境可安居，是王維禪意與田園理想的融合。' });
  O('王維', '鹿柴', { emotion: 'zen', time: 'dusk', season: '', weather: 'mist', viewpoint: 'shenyuan', scale: 'medium', E: .76, focal: 'tree', side: 'right', realm: '無我之境', tex: 'pima',
    composition: '深林層疊淡入雲氣，不見一人；一束夕照斜入林間，以朱赭淡點落在青苔上，畫面九成以上是靜謐的留白與淡墨。',
    reading: '「空山不見人，但聞人語響」以聲音反襯山的空寂；「返景入深林，復照青苔上」以一束斜光寫出瞬間的幽明變化。空而不死、靜中有動，是王維以禪入詩的典範。畫面不畫人物，只以光點落苔表現那一刻的寂照。' });
  O('王維', '竹里館', { emotion: 'zen', time: 'night', season: '', weather: 'clear', viewpoint: 'shenyuan', scale: 'intimate', E: .64, focal: 'person', side: 'left', realm: '無我之境', tex: 'none',
    composition: '幽篁自一側高聳出畫，竹影濃淡交疊；隱者於竹下撫琴，明月在竹梢之外以烘托法留出，月光與琴聲同構寂然自得之境。',
    reading: '「獨坐幽篁裏，彈琴復長嘯」寫獨處的自在；「深林人不知，明月來相照」以無人知與明月照對比，孤獨不是寂寞，而是與自然相知。意境清幽空明，人與月相照而無需言語。' });
  O('王維', '鳥鳴澗', { emotion: 'zen', time: 'night', season: 'spring', weather: 'clear', viewpoint: 'shenyuan', scale: 'medium', E: .8, focal: 'moon', side: 'right', realm: '無我之境', tex: 'pima',
    composition: '春山以極淡墨層層退後，桂花細點散落；明月初出山頭，以烘雲托月留白，兩隻驚起的山鳥點在月下，是靜夜裡唯一的動態。',
    reading: '「人閒桂花落，夜靜春山空」以花落無聲寫心之閒、夜之靜；「月出驚山鳥，時鳴春澗中」以月光驚鳥、鳥鳴回盪反襯山的空寂。以動寫靜、以聲寫寂，意境空靈。' });
  O('孟浩然', '宿建德江', { emotion: 'longing', time: 'dusk', season: '', weather: 'mist', viewpoint: 'pingyuan', scale: 'vast', E: .78, focal: 'boat', side: 'right', realm: '有我之境', tex: 'none',
    composition: '野曠天低：地平線壓得極低，遠樹低於天邊；煙渚旁泊一小舟，江水清澈映月，畫面上方大片暮色淡墨。',
    reading: '「移舟泊煙渚，日暮客愁新」日暮觸動客愁；「野曠天低樹，江清月近人」以曠野的空闊與江月的親近對照，天地無親，唯月相伴，客愁更顯孤清。' });
  O('杜甫', '旅夜書懷', { emotion: 'solitude', time: 'night', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .78, focal: 'boat', side: 'left', realm: '有我之境', tex: 'none',
    composition: '平野極闊、大江橫流，月影在江面湧動；危檣孤舟只佔角落，星垂天際以淡墨夜空烘托。',
    reading: '「星垂平野闊，月湧大江流」寫天地壯闊，反襯「細草微風岸，危檣獨夜舟」的渺小孤危。結句「飄飄何所似，天地一沙鷗」自比沙鷗，飄零之感與天地之大相映成悲。' });
  O('李白', '獨坐敬亭山', { emotion: 'transcendent', time: 'day', season: '', weather: 'clear', viewpoint: 'gaoyuan', scale: 'medium', E: .7, focal: 'person', side: 'right', realm: '有我之境', tex: 'pima',
    composition: '敬亭山自一側巍然而起，空中無鳥無雲；詩人獨坐對岸坡石，與山遙遙相看，兩者之間的空白就是「相看兩不厭」。',
    reading: '「眾鳥高飛盡，孤雲獨去閒」連鳥雲都離去，世界只剩詩人與山；「相看兩不厭，只有敬亭山」把山人格化為知己。孤獨被轉化為與自然的相知，寂寞中見超然。' });
  O('李白', '早發白帝城', { emotion: 'joyful', time: 'dawn', season: '', weather: 'mist', viewpoint: 'shenyuan', scale: 'vast', E: .45, focal: 'boat', side: 'right', realm: '有我之境', tex: 'fupi', hints: { speed: true },
    composition: '兩岸萬重山以斧劈皴層層向後疊去，江峽蜿蜒；清晨彩雲在山頂以朱色淡染，輕舟以疾速的長筆飛出峽口。',
    reading: '「朝辭白帝彩雲間」寫清晨啟程的明麗；「千里江陵一日還」以時空壓縮寫歸心似箭；「輕舟已過萬重山」以「輕」字寫出遇赦後身心的輕快。意境明快飛動。' });
  O('李白', '月下獨酌', { emotion: 'transcendent', time: 'night', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .66, focal: 'person', side: 'left', realm: '有我之境', tex: 'none',
    composition: '花間一人舉杯對月，月以烘托留白，身後以淡墨拖出長影；月、人、影三點成勢，其餘留白。',
    reading: '「花間一壺酒，獨酌無相親」先寫孤獨；「舉杯邀明月，對影成三人」以想像化孤為眾，月與影成了酒伴。歡樂之中藏著無人相親的寂寞，最終以「永結無情遊」走向超脫。' });
  O('蘇軾', '水調歌頭', { emotion: 'transcendent', time: 'night', season: 'autumn', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .8, focal: 'moon', side: 'right', realm: '有我之境', tex: 'none',
    composition: '中秋明月高懸，以重疊淡墨烘雲托月；地面只留遠處低平坡岸，詞人獨立舉杯，人與月之間是大片清光。',
    reading: '上片由問月、欲乘風歸去到「起舞弄清影」，在出世與入世之間徘徊；下片由月照無眠的怨，轉為「人有悲歡離合，月有陰晴圓缺」的了悟，終以「千里共嬋娟」化解離別。意境由悵惘而曠達。' });
  O('蘇軾', '念奴嬌', { emotion: 'heroic', time: 'day', season: '', weather: 'wind', viewpoint: 'gaoyuan', scale: 'vast', E: .3, focal: 'waves', side: 'left', realm: '有我之境', tex: 'fupi',
    composition: '赤壁亂石以斧劈皴濃墨直插天際，驚濤拍岸以奔放線條捲起浪花（浪花留白，不畫雪）；大江自崖下東去。',
    reading: '「大江東去，浪淘盡，千古風流人物」以江流比歷史；「亂石穿空，驚濤拍岸，捲起千堆雪」寫赤壁的雄奇壯闊。下片遙想周瑜英姿，反照自身「早生華髮」，終以「人生如夢」作結。豪放之中有深沉的歷史感慨。' });
  O('蘇軾', '前赤壁賦', { emotion: 'transcendent', time: 'night', season: 'autumn', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .8, focal: 'boat', side: 'left', realm: '有我之境', tex: 'none', hints: { calm: true },
    composition: '江面水波不興，大片留白；赤壁淡淡立於一側，明月出於東山之上，小舟泛於江心，客與蘇子舉杯，水天一色。',
    reading: '「清風徐來，水波不興」「白露橫江，水光接天」寫出秋夜江上的澄明開闊；客之悲在「哀吾生之須臾，羨長江之無窮」，蘇子以「變與不變」之理化解，終於「共適」江上清風與山間明月。意境由悲轉曠，清空而深遠。' });
  O('蘇軾', '記承天寺夜遊', { emotion: 'serene', time: 'night', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .6, focal: 'moon', side: 'right', realm: '有我之境', tex: 'none',
    composition: '庭院以淡墨夜色通染，地面留白如積水空明；竹柏的影子以淡墨斜拖滿地，月在一角以烘托留出。',
    reading: '「庭下如積水空明，水中藻荇交橫，蓋竹柏影也」以一連串比喻寫月光之清透；結句「但少閒人如吾兩人者耳」，閒字中有貶謫的自嘲，也有賞景的自得。' });
  O('蘇軾', '定風波', { emotion: 'transcendent', time: 'day', season: 'spring', weather: 'rain', viewpoint: 'pingyuan', scale: 'medium', E: .62, focal: 'person', side: 'right', realm: '有我之境', tex: 'midian', hints: { hat: true },
    composition: '斜雨以細長淡筆貫穿畫面，遠山以米點皴迷濛；一人策杖穿雨徐行，步態從容，是風雨中的定點。',
    reading: '「莫聽穿林打葉聲，何妨吟嘯且徐行」寫遇雨不避的從容；「一蓑煙雨任平生」把當下的雨提升為人生態度；「也無風雨也無晴」則是超越順逆的曠達。' });
  O('杜甫', '春望', { emotion: 'patriotic', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .46, focal: 'house', side: 'left', realm: '有我之境', tex: 'fupi',
    composition: '殘破城屋以焦墨枯筆寫出，春草雜生；花鳥只作淡筆，白頭詩人立於一側，以樂景寫哀。',
    reading: '「國破山河在，城春草木深」以山河依舊、草木瘋長反襯人事全非；「感時花濺淚，恨別鳥驚心」是以樂景寫哀，花鳥皆隨人悲。家國之痛與個人離散交織，沉鬱頓挫。' });
  O('杜甫', '望嶽', { emotion: 'heroic', time: 'day', season: '', weather: 'mist', viewpoint: 'gaoyuan', scale: 'vast', E: .28, focal: 'mountain', side: 'center', realm: '有我之境', tex: 'fupi',
    composition: '泰山主峰居中頂天，陰陽兩面以濃淡分割昏曉；層雲在山腰以留白橫斷，歸鳥小點飛入雲中。',
    reading: '「造化鍾神秀，陰陽割昏曉」寫泰山的神奇與高大；「盪胸生曾雲，決眥入歸鳥」寫凝望之久；結句「會當凌絕頂，一覽眾山小」由景入志，見青年杜甫的抱負。' });
  O('岑參', '磧中作', { emotion: 'solitude', time: 'dusk', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .84, focal: 'person', side: 'right', realm: '有我之境', tex: 'none',
    composition: '平沙萬里，地平線壓到極低，以乾筆淡墨拖出沙丘起伏；一人一馬極小，向天邊行去，上方大片空白即是無處投宿的茫然。',
    reading: '「走馬西來欲到天」寫行程之遠；「今夜不知何處宿，平沙萬里絕人煙」以空間的無邊寫內心的茫然。意境荒寒蒼茫。' });
  O('白居易', '暮江吟', { emotion: 'joyful', time: 'dusk', season: 'autumn', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .72, focal: 'sunset', side: 'left', realm: '無我之境', tex: 'none', warm: .9,
    composition: '一道殘陽鋪在水面，以朱砂淡染半江，另半江淡墨青碧；落日低垂遠岸，水天開闊。',
    reading: '「一道殘陽鋪水中，半江瑟瑟半江紅」以「鋪」字寫出夕陽貼近水面的柔和，色彩一冷一暖，畫面感極強。全詩是對自然光色細膩的欣賞，意境明麗安詳。' });
  O('韋應物', '滁州西澗', { emotion: 'zen', time: 'dusk', season: 'spring', weather: 'rain', viewpoint: 'pingyuan', scale: 'medium', E: .66, focal: 'boat', side: 'right', realm: '無我之境', tex: 'midian',
    composition: '澗邊幽草、深樹黃鸝作近景；春潮帶雨以斜筆淡墨鋪滿，野渡空舟斜橫水面，無人。',
    reading: '「春潮帶雨晚來急」寫水勢之急，「野渡無人舟自橫」寫渡口之閒；急與閒、動與靜相對，一隻自橫的空舟寄託恬淡無為、不得其用的心境。' });
  O('張志和', '漁歌子', { emotion: 'serene', time: 'day', season: 'spring', weather: 'rain', viewpoint: 'pingyuan', scale: 'medium', E: .55, focal: 'person', side: 'left', realm: '無我之境', tex: 'midian', hints: { hat: true },
    composition: '西塞山以米點淡墨在遠處，白鷺一點；桃花流水以朱砂細點，斜風細雨中漁父戴箬笠披蓑衣獨立水邊。',
    reading: '「西塞山前白鷺飛，桃花流水鱖魚肥」色彩清麗；「青箬笠，綠蓑衣，斜風細雨不須歸」寫漁父樂在其中，不以風雨為苦，意境閒適自在。' });
  O('孟浩然', '春曉', { emotion: 'joyful', time: 'dawn', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .6, focal: 'house', side: 'left', realm: '有我之境', tex: 'none',
    composition: '清晨窗外，枝頭鳥鳴以淡墨點出，地上落花以朱砂細點散落；屋舍半掩一側，其餘留白如晨光。',
    reading: '「春眠不覺曉，處處聞啼鳥」以聽覺寫春晨的生機；「夜來風雨聲，花落知多少」由回憶轉為惜春，明快之中帶一絲淡淡的憐惜。' });
  O('陶潛', '飲酒', { emotion: 'serene', time: 'dusk', season: 'autumn', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .6, focal: 'person', side: 'right', realm: '無我之境', tex: 'pima',
    composition: '近景東籬黃菊，隱者俯身採菊；抬頭時南山悠然橫在遠處，日夕山氣以淡墨暈開，飛鳥結伴歸山。',
    reading: '「結廬在人境，而無車馬喧」以「心遠地自偏」點出關鍵在心境；「采菊東籬下，悠然見南山」是無意間的相遇，王國維舉為「無我之境」的典範。人與景不分主客，此中真意只可體會、不須言說。' });
  O('李清照', '聲聲慢', { emotion: 'melancholy', time: 'dusk', season: 'autumn', weather: 'rain', viewpoint: 'pingyuan', scale: 'intimate', E: .55, focal: 'tree', side: 'left', realm: '有我之境', tex: 'none',
    composition: '黃昏細雨斜落，梧桐以濕墨暈開；滿地憔悴黃花以淡赭點染，窗戶半掩，畫面沉鬱低垂。',
    reading: '開篇十四疊字層層加深孤寂；「滿地黃花堆積」「梧桐更兼細雨，到黃昏、點點滴滴」把愁具象化為可聽可見的細雨。結句「怎一個愁字了得」，愁之深重不可言盡。' });
  O('《詩經》', '秦風・蒹葭', { emotion: 'longing', time: 'dawn', season: 'autumn', weather: 'mist', viewpoint: 'pingyuan', scale: 'vast', E: .74, focal: 'person', side: 'left', realm: '有我之境', tex: 'none',
    composition: '近岸蘆葦以淡墨濕筆寫出，白露凝霜；秋水以留白橫隔畫面，伊人只是對岸遠處迷濛的一個小影。',
    reading: '「蒹葭蒼蒼，白露為霜」以清寒秋景起興；「所謂伊人，在水一方」寫可望不可即，溯洄、溯游都追不到。距離與霧氣構成朦朧的追尋之美。' });
  O('李商隱', '夜雨寄北', { scenes: [
    { emotion: 'longing', time: 'night', season: 'autumn', weather: 'rain', viewpoint: 'pingyuan', scale: 'medium', E: .62, focal: 'house', side: 'left', realm: '有我之境', tex: 'midian',
      composition: '巴山夜雨以濕墨米點與細雨斜筆籠罩，秋池漲滿；一間屋舍在雨中，是寄信人此刻的處境。',
      reading: '「君問歸期未有期」直答無奈；「巴山夜雨漲秋池」以景寫愁，雨漲的是池水，也是思念。' },
    { emotion: 'joyful', time: 'night', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .58, focal: 'lamp', side: 'right', realm: '有我之境', tex: 'none',
      composition: '想像的團聚：西窗燭光以朱砂溫暖點出，兩人對坐剪燭，屋外不畫雨。',
      reading: '「何當共剪西窗燭，卻話巴山夜雨時」把此刻的孤苦變成未來談話的材料，時空在想像中折返，愁中有盼。' }] });
  O('《詩經》', '小雅・采薇', { scenes: [
    { emotion: 'desolate', time: 'day', season: 'winter', weather: 'snow', viewpoint: 'pingyuan', scale: 'vast', E: .78, focal: 'person', side: 'left', realm: '有我之境', tex: 'none',
      composition: '雨雪霏霏的歸途，天色灰濛，以烘托法留白為雪；征人步履遲遲，小而孤。', reading: '「今我來思，雨雪霏霏。行道遲遲，載渴載飢」，歸途的苦寒與飢渴；「我心傷悲，莫知我哀」，無人能解。' },
    { emotion: 'longing', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .66, focal: 'willow', side: 'left', realm: '有我之境', tex: 'none',
      composition: '回憶中的出征：楊柳依依以濕潤淡墨下垂，行人回望，春色反襯離別。', reading: '「昔我往矣，楊柳依依」以樂景寫哀，柳絲的依依正是不捨之情。' }] });
  O('范仲淹', '岳陽樓記', { scenes: [
    { emotion: 'joyful', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'vast', E: .7, focal: 'pond', side: 'left', realm: '有我之境', tex: 'none',
      composition: '洞庭一碧萬頃，上下天光，水面大片留白；沙鷗翔集作小點，岸芷汀蘭淡淡點綴。', reading: '「春和景明，波瀾不驚」，登樓者「心曠神怡，寵辱偕忘」；此喜仍是以物喜，為後文「不以物喜」作鋪墊。' },
    { emotion: 'melancholy', time: 'day', season: '', weather: 'rain', viewpoint: 'pingyuan', scale: 'vast', E: .4, focal: 'waves', side: 'left', realm: '有我之境', tex: 'midian',
      composition: '霪雨連月，濁浪排空，以濕墨重染壓低天色，日星山岳皆隱沒。', reading: '「陰風怒號，濁浪排空」，登樓者「感極而悲」；此悲是以己悲，與後文「先天下之憂而憂」對照。' },
    { emotion: 'patriotic' }] });
  O('辛棄疾', '破陣子', { scenes: [
    { emotion: 'patriotic', time: 'night', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .6, focal: 'sword', side: 'left', realm: '有我之境', tex: 'none',
      composition: '燈下一人挑燈看劍，燈火以朱砂點出，四周夜色深沉。', reading: '「醉裏挑燈看劍，夢回吹角連營」，醉與夢之間是壯志難酬；結句「可憐白髮生」把豪情跌回現實。' },
    { emotion: 'heroic', time: 'day', season: 'autumn', weather: 'wind', viewpoint: 'pingyuan', scale: 'vast', E: .45, focal: 'horse', side: 'right', realm: '有我之境', tex: 'fupi',
      composition: '夢境：的盧飛馳，以疾筆濃墨寫出動勢，畫面標示為夢。', reading: '「馬作的盧飛快，弓如霹靂弦驚」是夢中的沙場，速度與聲響寫盡壯懷。' }] });
  O('王冕', '墨梅', { emotion: 'serene', time: 'day', season: 'winter', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .6, focal: 'plum', side: 'left', realm: '有我之境', tex: 'none',
    composition: '一枝墨梅自畫面一側斜出，花以淡墨圈出，不著顏色；洗硯池只作下方淡淡水痕。', reading: '「不要人誇好顏色，只留清氣滿乾坤」以淡墨梅花自喻不慕虛榮、只求清白的品格。' });
  O('王安石', '梅花', { emotion: 'solitude', time: 'day', season: 'winter', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .7, focal: 'plum', side: 'left', realm: '有我之境', tex: 'none',
    composition: '牆角一隅，數枝寒梅凌寒獨開；牆垣只作淡墨轉角，大片留白襯出暗香。', reading: '「牆角數枝梅，凌寒獨自開」寫處境與品格；「遙知不是雪，為有暗香來」以香辨梅，寫出不畏寒、不同俗的高潔。' });
  O('陸游', '卜算子', { emotion: 'melancholy', time: 'dusk', season: 'winter', weather: 'rain', viewpoint: 'pingyuan', scale: 'intimate', E: .64, focal: 'plum', side: 'left', realm: '有我之境', tex: 'none',
    composition: '驛外斷橋邊，一枝梅寂寞開放，黃昏風雨斜打，落花以淡墨零落。', reading: '「已是黃昏獨自愁，更著風和雨」寫處境之苦；「零落成泥碾作塵，只有香如故」寫品格之堅。' });
  O('鄭燮', '竹石', { emotion: 'heroic', time: 'day', season: '', weather: 'wind', viewpoint: 'gaoyuan', scale: 'intimate', E: .5, focal: 'bamboo', side: 'left', realm: '有我之境', tex: 'fupi',
    composition: '竹根咬定破岩，竹竿挺立、竹葉在風中勁挺不亂；岩石以斧劈濃墨寫出堅硬。', reading: '「咬定青山不放鬆，立根原在破岩中」寫扎根之堅；「千磨萬擊還堅勁，任爾東西南北風」寫不屈的意志。' });
  O('蘇軾', '題西林壁', { emotion: 'transcendent', time: 'day', season: '', weather: 'mist', viewpoint: 'gaoyuan', scale: 'vast', E: .45, focal: 'mountain', side: 'center', realm: '無我之境', tex: 'pima',
    composition: '同一座廬山，以多重峰形並列：橫看成嶺、側看成峰，雲霧把山體切成不同面貌。', reading: '「橫看成嶺側成峰，遠近高低各不同」寫觀看角度改變所見；「不識廬山真面目，只緣身在此山中」寫認識受立場所限，理趣蘊於景中。' });
  O('杜甫', '絕句', { emotion: 'joyful', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .52, focal: 'willow', side: 'left', realm: '無我之境', tex: 'none',
    composition: '近景翠柳兩鸝，中景白鷺一行上青天，遠景西嶺雪山以留白勾出，門前泊船；四句四景，由近而遠層層展開。', reading: '四句各寫一景，色彩明麗、對仗工整：黃與翠、白與青、千秋雪與萬里船，空間由近及遠、時間由今及古，意境開闊明快。' });
  O('王維', '渭城曲', { emotion: 'longing', time: 'dawn', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .6, focal: 'cup', side: 'left', realm: '有我之境', tex: 'none',
    composition: '朝雨初歇，客舍青青、柳色新潤；兩人舉杯相送，大片留白指向西出陽關的遠方。', reading: '「勸君更盡一杯酒，西出陽關無故人」不直說不捨，而以勸酒寫深情；清新的雨後景色反襯離別。' });
  O('蘇軾', '飲湖上', { emotion: 'joyful', time: 'day', season: '', weather: 'rain', viewpoint: 'pingyuan', scale: 'vast', E: .62, focal: 'pond', side: 'left', realm: '有我之境', tex: 'midian',
    composition: '雨中西湖，遠山以米點皴迷濛，湖面留白，空濛山色如淡妝。', reading: '「水光瀲灩晴方好，山色空濛雨亦奇」晴雨皆美；以西子淡妝濃抹作比，寫西湖無時不美。' });
  O('楊萬里', '小池', { emotion: 'joyful', time: 'day', season: 'summer', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .7, focal: 'dragonfly', side: 'left', realm: '無我之境', tex: 'none',
    composition: '小池一角，泉眼細流以極淡筆寫；初露的荷尖立一隻蜻蜓，其餘盡是水面留白。', reading: '「小荷才露尖尖角，早有蜻蜓立上頭」捕捉初夏一瞬的新生，細小而充滿生機。' });
  O('周敦頤', '愛蓮說', { emotion: 'serene', time: 'day', season: 'summer', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .58, focal: 'lotus', side: 'left', realm: '有我之境', tex: 'none',
    composition: '數莖蓮花亭亭淨植於水面，荷葉以濕墨大筆、花以淡墨勾出，水面留白清潔。', reading: '「出淤泥而不染，濯清漣而不妖」以蓮喻君子，清高而不孤傲。' });
  O('白居易', '問劉十九', { emotion: 'serene', time: 'dusk', season: 'winter', weather: 'clear', viewpoint: 'pingyuan', scale: 'intimate', E: .58, focal: 'lamp', side: 'left', realm: '有我之境', tex: 'none', warm: .6,
    composition: '暮色天欲雪，屋外以灰墨淡染寒天；屋內紅泥小火爐以朱砂點出，新酒一杯，冷暖相襯。', reading: '「綠蟻新醅酒，紅泥小火爐」色彩溫暖；「晚來天欲雪，能飲一杯無」以將雪之寒襯出邀友的溫情。' });
  O('杜牧', '山行', { emotion: 'joyful', time: 'dusk', season: 'autumn', weather: 'clear', viewpoint: 'shenyuan', scale: 'medium', E: .52, focal: 'tree', side: 'left', realm: '有我之境', tex: 'pima', hints: { redLeaves: true },
    composition: '石徑自近景斜向寒山深處，白雲生處隱約人家；近景楓林以朱砂點葉，暮色中紅葉比二月春花更豔，是全畫最濃的色彩。',
    reading: '「遠上寒山石徑斜，白雲生處有人家」以深遠之景引人入勝；「停車坐愛楓林晚，霜葉紅於二月花」以「坐愛」點出為美停駐，秋色不衰颯反而比春花更絢爛，意境明麗而有生機。' });
  O('陶潛', '歸園田居（其一）', { emotion: 'serene', time: 'day', season: '', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .55, focal: 'house', side: 'left', realm: '無我之境', tex: 'pima',
    composition: '方宅草屋掩映榆柳，遠人村炊煙依依；田畦平展，大片留白是回歸本性的舒坦。', reading: '「久在樊籠裏，復得返自然」以籠鳥返林作比，寫擺脫官場的解脫，田園的平凡景物皆成真趣。' });
  O('陶潛', '桃花源記', { scenes: [
    { emotion: 'serene', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'pingyuan', scale: 'medium', E: .5, focal: 'house', side: 'left', realm: '有我之境', tex: 'pima',
      composition: '土地平曠、屋舍儼然，良田美池桑竹之屬井然；村人耕作，安樂自足。', reading: '桃源的平和自足與外面的戰亂相對，是理想社會的寄託；結尾「不復得路」使此境更顯珍貴而不可求。' },
    { emotion: 'joyful', time: 'day', season: 'spring', weather: 'clear', viewpoint: 'shenyuan', scale: 'medium', E: .55, focal: 'peach', side: 'left', realm: '無我之境', tex: 'none',
      composition: '溪流深入，兩岸桃林以朱砂點花、落英繽紛；漁舟溯溪而入，前方山口留白。', reading: '「芳草鮮美，落英繽紛」，奇境的入口美得不真實，引人「欲窮其林」。' }] });

  function findOverride(item, sceneIndex) {
    const key = Object.keys(OVERRIDES).find(k => { const [a, t] = k.split('|'); return item.author === a && String(item.title || '').startsWith(t); });
    if (!key) return null;
    const spec = OVERRIDES[key];
    if (spec.scenes) return spec.scenes[sceneIndex] || null;
    return spec;
  }

  /* ───────── 基本工具 ───────── */
  const strip = s => String(s || '').replace(METAPHOR_STRIP, '');
  const clauses = s => String(s || '').split(/[，。！？；、\n]+/u).map(x => x.trim()).filter(Boolean);
  function scoreLex(lex, text) { let s = 0; const hits = []; for (const [re, w] of lex) { const g = new RegExp(re.source, 'g'); const m = text.match(g); if (m) { s += w * Math.min(m.length, 3); hits.push(...m); } } return { s, hits }; }
  function pickFirst(table, text) { for (const [id, , re] of table) if (re.test(text)) return id; return ''; }
  function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function detectEmotion(full, meaning, focus, prose) {
    // 詩詞以全篇定基調；散文、小說篇幅長，以取景段落與主旨為主，全篇只作微調。
    const scores = {}, wf = prose ? .25 : 1, wc = prose ? 1.6 : (focus === full ? 0 : .6);
    for (const [id, def] of Object.entries(EMOTION)) {
      const a = scoreLex(def.lex, full), b = scoreLex(def.lex, meaning), c = scoreLex(def.lex, focus);
      scores[id] = { s: a.s * wf + b.s * 2 + c.s * wc, hits: [...new Set([...c.hits, ...a.hits, ...b.hits])] };
    }
    const ranked = Object.entries(scores).sort((a, b) => b[1].s - a[1].s);
    const top = ranked[0][1].s > 0 ? ranked[0][0] : 'serene';
    return { id: top, ranked: ranked.slice(0, 3).filter(r => r[1].s > 0).map(([id, v]) => ({ id, label: EMOTION[id].label, score: +v.s.toFixed(1), hits: v.hits.slice(0, 4) })) };
  }

  function detectViewpoint(full, ids) {
    let best = 'pingyuan', bs = -1;
    for (const [id, def] of Object.entries(VIEW)) { const s = scoreLex(def.lex, full).s; if (s > bs) { bs = s; best = id; } }
    if (ids.includes('waterfall')) best = 'gaoyuan';
    else if (ids.includes('mountain') && !ids.some(i => ['river', 'pond', 'sea', 'desert', 'field'].includes(i)) && best === 'pingyuan') best = 'gaoyuan';
    if (!ids.includes('mountain') && best === 'gaoyuan' && !ids.includes('waterfall')) best = 'pingyuan';
    return best;
  }

  /* ───────── 主分析 ───────── */
  function analyzeYijing(item, ctx = {}) {
    const fullRaw = typeof item === 'string' ? item : (item.lines || []).join('\n');
    const full = strip(fullRaw), focus = strip(ctx.focus || fullRaw);
    // 本機無法確定主旨時的預設說明不參與情感判讀。
    const meaning = /保留未能確定|以原文關鍵段落/.test(ctx.meaning || '') ? '' : String(ctx.meaning || '');
    const ids = (ctx.elements || []).map(e => typeof e === 'string' ? e : e.id);
    const ov = typeof item === 'object' ? findOverride(item, ctx.sceneIndex || 0) : null;

    const prose = typeof item === 'object' && ['文', '小說', '辭賦'].includes(item.form);
    const emo = detectEmotion(full, meaning, focus, prose);
    const emotion = ov?.emotion || emo.id;
    const st = EMOTION_STYLE[emotion];
    const time = ov?.time || pickFirst(TIME, focus) || (prose ? '' : pickFirst(TIME, full)) || 'day';
    let season = ov?.season ?? (pickFirst(SEASON, focus) || (prose ? '' : pickFirst(SEASON, full)));
    let weather = ov?.weather || pickFirst(WEATHER, focus) || 'clear';
    // 物象核定優先：已排除雪景的段落，不以全篇的雪字改成雪天。
    if (!ov && weather === 'snow' && !ids.includes('snow')) weather = /雪/.test(focus) ? 'clear' : weather;
    if (!ov && ids.includes('snow')) { weather = 'snow'; season = season || 'winter'; }
    if (!ov && ids.includes('rain') && weather !== 'snow') weather = 'rain';
    const viewpoint = ov?.viewpoint || detectViewpoint(full, ids);
    const landscape = ids.some(i => LANDSCAPE.includes(i));
    let scale = ov?.scale || (!landscape ? 'intimate' : /千|萬|天地|天際|極目|無邊|不盡|平野|大漠|長江|萬頃/.test(full) ? 'vast' : st.scale);
    const solitary = /孤|獨|隻|一身|一葉|無人/.test(focus) || emotion === 'solitude';
    let E = ov?.E ?? st.E;
    if (!ov) { if (solitary) E = Math.min(.9, E + .08); if (scale === 'intimate') E = Math.max(.5, E - .05); if (ids.length >= 7) E = Math.max(.35, E - .12); }
    const focal = ov?.focal && ids.includes(ov.focal) ? ov.focal
      : (solitary && ids.includes('boat') ? 'boat' : FOCAL_PRIORITY.find(id => ids.includes(id)) || '');
    const side = ov?.side || ((hashStr((item.title || '') + (item.author || '')) & 1) ? 'right' : 'left');
    let tex = ov?.tex || st.tex;
    if (weather === 'snow') tex = 'none'; else if (!ov && (weather === 'rain' || weather === 'mist') && emotion !== 'heroic') tex = 'midian';
    const warm = ov?.warm ?? Math.min(1, st.warm + (time === 'dusk' ? .4 : 0) + (season === 'autumn' ? .1 : 0));
    const sky = weather === 'snow' ? 'snow' : time === 'night' ? 'night' : weather === 'rain' ? 'rain' : time === 'dusk' ? 'dusk' : weather === 'mist' ? 'mist' : 'plain';
    const realm = ov?.realm || (/我|吾|余|予|君|獨|愁|思|悲|淚|憶/.test(full) ? '有我之境' : '無我之境');
    const inkGain = +(st.ink * (time === 'night' ? .95 : 1) * (sky === 'snow' ? .85 : 1)).toFixed(2);

    // 筆墨細節提示：只修飾已核定物象的畫法，不增加物象。
    const hints = Object.assign({
      boatLight: /漁火|燈火/.test(full) && ids.includes('boat'),
      redLeaves: /楓|紅葉|霜葉/.test(focus) && ids.some(i => ['tree', 'bare_tree'].includes(i)) && time !== 'night',
      fallingLeaves: /落木|落葉|蕭蕭下|葉落/.test(full) && ids.some(i => ['tree', 'bare_tree'].includes(i)),
      hat: /蓑|笠/.test(full) && ids.includes('person'),
      lookUp: /望明月|望月|舉頭|仰/.test(full) && ids.includes('person'),
      crows: /鴉|烏/.test(focus) && ids.includes('bird'),
      calm: /波不興|波瀾不驚|平|靜/.test(focus),
      speed: /輕舟|千里|一日|疾|飛/.test(focus) && ids.includes('boat'),
      vanishingSail: /遠影|天際|盡/.test(focus) && ids.includes('boat')
    }, ov?.hints || {});

    const vlabel = VIEW[viewpoint].label;
    const composition = ov?.composition || autoComposition({ ids, focal, viewpoint, E, side, sky, solitary, scale });
    const keyPhrases = clauses(fullRaw).filter(c => emo.ranked[0]?.hits.some(h => c.includes(h))).slice(0, 2);
    const reading = ov?.reading || autoReading({ emotion, keyPhrases, time, season, weather, viewpoint, solitary, meaning, focal, scale });
    const brush = [
      `墨色${inkGain >= 1.05 ? '濃重' : inkGain <= .8 ? '清淡' : '濃淡相宜'}、${st.wet >= .5 ? '水分淋漓' : st.dry >= .45 ? '乾筆枯澀' : '乾濕並用'}`,
      TEX_LABEL[tex],
      sky === 'snow' ? '以灰墨烘染天空與江水，留白為雪' : sky === 'night' ? '夜色通染，明月以烘雲托月留出' : sky === 'dusk' ? '暮色淡赭，朱砂點日' : sky === 'rain' ? '細雨斜筆、濕墨迷濛' : sky === 'mist' ? '雲氣以留白橫斷山腰' : '天空不著墨，以空白為天',
      `留白約 ${Math.round(E * 100)}%`
    ].join('；');

    return {
      emotion, emotionLabel: EMOTION[emotion].label, emotionRanking: emo.ranked,
      time, timeLabel: TIME_LABEL[time], season: season || '', seasonLabel: SEASON_LABEL[season || ''], weather, weatherLabel: WEATHER_LABEL[weather],
      viewpoint, viewpointLabel: vlabel, viewpointNote: VIEW[viewpoint].note, scale, solitary,
      emptiness: +E.toFixed(2), stillness: st.still, focal, side, realm, texture: tex, sky,
      ink: { gain: inkGain, wet: st.wet, dry: st.dry }, warmth: +warm.toFixed(2), hints,
      composition, reading, brush, source: ov ? '名篇意境校訂' : '詞彙意境推定'
    };
  }

  function autoComposition({ ids, focal, viewpoint, E, side, sky, solitary, scale }) {
    const sideTxt = side === 'right' ? '右' : '左', openTxt = side === 'right' ? '左' : '右';
    const parts = [];
    if (scale === 'intimate') parts.push(`近景小品：主體集中在畫面${sideTxt}側，${openTxt}側留白`);
    else if (viewpoint === 'gaoyuan') parts.push(`高遠法：主峰${sideTxt}側拔起，山腰以雲氣斷開，${openTxt}側讓出天空`);
    else if (viewpoint === 'shenyuan') parts.push('深遠法：山巒前後重疊，層層淡入雲氣');
    else parts.push(`平遠法：地平線偏低，遠山淡如一抹，${openTxt}側水天相接`);
    if (focal) parts.push(`以「${(root.MoyunLiterary?.MOTIFS?.[focal]?.[0]) || focal}」為視覺焦點，置於三分點`);
    if (solitary) parts.push('主體縮小以突顯孤獨');
    parts.push(`留白約 ${Math.round(E * 100)}%`);
    return parts.join('；') + '。';
  }
  function autoReading({ emotion, keyPhrases, time, season, weather, viewpoint, solitary, meaning, scale }) {
    const lead = keyPhrases.length ? `由「${keyPhrases.join('」「')}」等語，` : '';
    const when = [season && SEASON_LABEL[season] !== '未明言' ? SEASON_LABEL[season] + '日' : '', time !== 'day' ? TIME_LABEL[time] : '', weather !== 'clear' ? WEATHER_LABEL[weather] + '中' : ''].filter(Boolean).join('、');
    return `${lead}可感全篇以「${EMOTION[emotion].label}」為基調${when ? '，時令為' + when : ''}。${meaning ? '主旨：' + meaning + '。' : ''}畫面採${VIEW[viewpoint].label}，${scale === 'intimate' ? '以近景小品聚焦物象' : '以空間的開合承載情感'}${solitary ? '，主體小而孤，留白越大情越深' : ''}，力求情景交融而不只是物象羅列。（詞彙推定，複雜用典仍須精讀）`;
  }

  /* ───────── 介面風格覆寫：只改筆墨情調，不改時令物象 ───────── */
  const STYLE_TO_EMOTION = { ethereal: 'zen', snow_winter: 'solitude', autumn_sunset: 'desolate', vast_river: 'longing', majestic_peaks: 'heroic', spring_breeze: 'joyful', heroic: 'heroic' };
  function applyStyle(yj, style) {
    const emo = STYLE_TO_EMOTION[style];
    if (!yj || !emo) return yj;
    const st = EMOTION_STYLE[emo];
    return { ...yj, emptiness: st.E, ink: { gain: st.ink, wet: st.wet, dry: st.dry }, texture: yj.sky === 'snow' ? 'none' : st.tex,
      warmth: style === 'autumn_sunset' ? Math.max(.6, yj.warmth) : yj.warmth, brush: yj.brush + `；使用者指定筆墨情調：${EMOTION[emo].label}`, styleOverride: style };
  }

  /* ───────── 雲端意境欄位驗證 ───────── */
  const ENUMS = { emotion: Object.keys(EMOTION), time: ['dawn', 'day', 'dusk', 'night'], season: ['spring', 'summer', 'autumn', 'winter', ''], weather: ['clear', 'rain', 'snow', 'wind', 'mist'], viewpoint: ['pingyuan', 'gaoyuan', 'shenyuan'], scale: ['vast', 'medium', 'intimate'] };
  function mergeCloudYijing(local, cloud, ids = []) {
    if (!cloud || typeof cloud !== 'object') return local;
    // 名篇意境已人工校訂：雲端只作回查，不覆寫
    if (local.source === '名篇意境校訂') return { ...local, source: local.source + '・雲端已回查' };
    if (cloud.season === 'none') cloud = { ...cloud, season: '' };
    const out = { ...local };
    for (const [k, vals] of Object.entries(ENUMS)) if (typeof cloud[k] === 'string' && vals.includes(cloud[k])) out[k] = cloud[k];
    // 已核定物象否決：無雪物象不得改為雪天；無山不得高遠。
    if (out.weather === 'snow' && !ids.includes('snow') && local.weather !== 'snow') out.weather = local.weather;
    if (out.viewpoint === 'gaoyuan' && !ids.some(i => ['mountain', 'waterfall'].includes(i))) out.viewpoint = local.viewpoint;
    if (typeof cloud.emptiness === 'number' && cloud.emptiness >= .2 && cloud.emptiness <= .92) out.emptiness = +cloud.emptiness.toFixed(2);
    if (typeof cloud.focal === 'string' && ids.includes(cloud.focal)) out.focal = cloud.focal;
    if (typeof cloud.reading === 'string' && cloud.reading.trim().length >= 20 && cloud.reading.length <= 600) out.reading = cloud.reading.trim();
    if (typeof cloud.composition === 'string' && cloud.composition.trim().length >= 10 && cloud.composition.length <= 300) out.composition = cloud.composition.trim();
    out.emotionLabel = EMOTION[out.emotion].label; out.timeLabel = TIME_LABEL[out.time]; out.seasonLabel = SEASON_LABEL[out.season || ''];
    out.weatherLabel = WEATHER_LABEL[out.weather]; out.viewpointLabel = VIEW[out.viewpoint].label; out.viewpointNote = VIEW[out.viewpoint].note;
    out.sky = out.weather === 'snow' ? 'snow' : out.time === 'night' ? 'night' : out.weather === 'rain' ? 'rain' : out.time === 'dusk' ? 'dusk' : out.weather === 'mist' ? 'mist' : 'plain';
    out.source = local.source === '名篇意境校訂' ? local.source + '＋雲端補充' : '雲端意境釋讀・本機校驗';
    return out;
  }

  const api = { analyzeYijing, applyStyle, mergeCloudYijing, ENUMS, EMOTION_LABELS: Object.fromEntries(Object.entries(EMOTION).map(([k, v]) => [k, v.label])), OVERRIDE_KEYS: Object.keys(OVERRIDES) };
  root.MoyunYijing = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
