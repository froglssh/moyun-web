# 墨韻 Moyun · 一張會呼吸的宣紙

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Live-Demo-B03A2A.svg)](https://froglssh.github.io/moyun-web/)

一張會呼吸的宣紙。水墨在 GPU 即時流體模擬上自由流動洇散，每一筆落筆皆響起古琴五聲音階之韻，一隻看不見的無形之手在眼前揮灑一幅從未存在過的古典山水——並題詩鈐印。

更進一步支援**文字輸入、圖片上傳或 PDF 文件上傳**，系統將深度析鑑其文學哲思與視覺意象，自動創作出一幅包含**書法文字（五言絕句題詠、落款題名、朱砂鈐印）**與**書法圖畫（水墨山川、遠岫松石、江渚孤舟）**的合璧之作！

**[點此立即線上體驗 →](https://froglssh.github.io/moyun-web/)**

![墨韻預覽圖](media/preview.jpg)

---

## 🎨 作品特色

- **【強大新功能】神思賦畫 · 意境創作**：
  - **✍️ 文思詩意輸入**：可輸入任意詩詞文句、心情隨筆或長篇散文，系統自動感知其情懷主旨（空靈清幽、寒江獨釣、落霞秋水、崇山萬壑、春水初生、大江豪情），自動創作專屬書法畫。若直接輸入古體詩句，亦能精確提取並直接題詠落款。
  - **🖼️ 圖片意境感知**：支援上傳 JPG、PNG、WEBP 圖片，自動分析畫面色彩溫度、明暗對比與構圖張力，轉化為水墨畫境氛圍（如夕照秋林、幽寒積雪、春山新綠等）。
  - **📄 PDF / 文章文件析鑑**：透過瀏覽器原生 PDF.js 解析 PDF 論文或散文檔案，自動汲取核心意象與文學哲思，提煉凝縮為水墨意境。
  - **🧠 雙重 AI 創作大腦**：預設內建「**本機神思意境推演引擎**」（零延遲、免金鑰、100% 離線可用）；亦可選填輸入 Google Gemini API Key，調用雲端多模態大模型進行更深層之原創古體詩賦創作。
  - **📜 詩畫合璧呈現**：生成專屬山水圖畫後，無形之手以毛筆書法字形在宣紙上題詠詩句、署名落款，並鈐蓋篆刻朱砂印章。
- **隨心揮毫（互動創作）**：按住滑鼠或觸控筆拖曳即可作畫。運筆緩慢則墨色濃重洇潤；行筆迅疾則筆鋒纖細乾枯。每落一筆相當於蘸一次墨，墨盡自然呈現「飛白」之趣。
- **清水攪動（流體把玩）**：切換至「清水」筆刷，可在已完成的水墨畫上攪動水流，靜賞墨色隨渦流旋轉化開的動態美感。
- **撫琴和鳴（物理建模）**：筆觸與點苔皆觸發宮、商、角、徵、羽五聲音階的古琴撥弦聲，無半音之躁，無論如何揮灑皆悠揚和諧。
- **高畫質典藏（匯出 PNG）**：支援一鍵點擊「典藏」，將當前水墨畫布、書法題詩、落款署名與朱砂印章完整合成，匯出為高解析度 PNG 圖檔保存。
- **日夜雙色主題**：支援「宣紙素白」與「月夜水墨」主題即時切換，暗色模式下宣紙化為夜空，墨色轉為銀月之光。
- **印章款式切換**：點擊朱砂印章可即時切換「墨韻心賞」、「克勞德印」、「逸筆草草」、「悠然見山」、「寒江孤寂」、「落霞秋水」等多款經典篆刻款式。

---

## 🔬 技術運作原理

整件作品為**單一 HTML 檔案**，零外包打包依賴，純粹仰賴數學與瀏覽器原生算力即時生成。

| 模組 | 實現技術與算法 |
|---|---|
| **流體動力學 (Fluid)** | 在 WebGL2 片元著色器（Fragment Shader）中求解不可壓縮 Navier–Stokes 方程：旋度 (curl) → 渦量約束 (vorticity confinement) → 散度 (divergence) → 24 次 Jacobi 壓力迭代 → 梯度相減投影 → 半拉格朗日平流 (semi-Lagrangian advection)。 |
| **水墨洇散 (Bleeding)** | 墨層紋理（RGBA）分別儲存游離墨、朱砂、水分與定著墨。水分依程序化紙張纖維噪聲進行非等向性擴散與指數蒸發；乾燥墨色定著於紙上，直至再次遇水被喚醒。 |
| **毛筆筆觸 (Brush)** | 沿筆劃路徑等距壓印高斯印章，墨量隨間距歸一化。行筆速度動態調節筆徑，墨量隨距離衰減；墨竭時沿法線以 1D 噪聲刻劃刷毛條紋，再現「飛白」。 |
| **多模態意境大腦 (Semantic)** | 結合客戶端純前端語義情感分類、圖像直方圖與明暗分佈感知、PDF.js 文字抽取技術，以及選配的 Gemini 多模態 API，將任意輸入轉換為精確的繪畫參數與五言絕句題詩。 |
| **古琴合成 (Guqin)** | Karplus–Strong 撥弦物理合成演算法離線生成 AudioBuffer；透過 `playbackRate` 自動化調節實現上滑音與吟猱；空間混響採用程序化指數衰減之脈衝響應卷積。 |
| **山水畫理 (Landscape)** | 隨機數種子生成山脈脊線、褶皺、皴法、苔點、松樹、水紋與構圖，自適應橫幅與直幅螢幕版面。 |

---

## 🚀 本機執行方式

只需透過任何本機 HTTP 伺服器開啟目錄：

```bash
# 複製儲存庫
git clone https://github.com/froglssh/moyun-web.git
cd moyun-web

# 啟動本機伺服器
python3 -m http.server 8000

# 於瀏覽器開啟 http://127.0.0.1:8000/
```

> **環境需求**：支援 WebGL2 與半精度浮點渲染目標（EXT_color_buffer_half_float）的現代瀏覽器（Chrome、Edge、Safari、Firefox）。

---

## 📜 授權與致敬 (Acknowledgments)

- **原始專案與靈感**：由 [Axton Liu](https://github.com/axtonliu) 發布之開源作品 [axtonliu/moyun](https://github.com/axtonliu/moyun)，特此深致謝意。
- **流體求解器理論**：Jos Stam, *Stable Fluids* (SIGGRAPH 1999) 與 Mark Harris, *Fast Fluid Dynamics Simulation on the GPU* (GPU Gems, ch. 38)。
- **著色器架構參考**：Pavel Dobryakov 的 [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)。
- **物理聲音合成**：Kevin Karplus & Alex Strong, *Digital Synthesis of Plucked-String and Drum Timbres* (1983)。
- **中文字型**：Google Fonts（Ma Shan Zheng 馬善政楷體、Noto Serif TC 思源宋體、Noto Sans TC、IBM Plex Mono）。
- **授權條款**：本專案採用 [MIT License](LICENSE) 開源授權。
