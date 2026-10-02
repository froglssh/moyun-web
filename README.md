# 墨韻 Moyun · 一張會呼吸的宣紙

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Live-Demo-B03A2A.svg)](https://froglssh.github.io/moyun-web/)

一張會呼吸的宣紙。水墨在 GPU 即時流體模擬上自由流動洇散，每一筆落筆皆響起古琴五聲音階之韻，一隻看不見的無形之手在眼前揮灑一幅從未存在過的古典山水——並題詩鈐印。

**[點此立即線上體驗 →](https://froglssh.github.io/moyun-web/)**

![墨韻預覽圖](media/preview.jpg)

---

## 🎨 作品特色

- **靜觀其變（自動揮灑）**：載入頁面時，由程序化演算法遵循古人畫理——先遠山，後主峰；先勾勒輪廓，再行皴擦、渲染、點苔；復以林木、水波、漁舟、翔鳥點綴，最後落一筆朱砂作朝陽，題詩、鈐印。每一次生成皆獨一無二。
- **隨心揮毫（互動創作）**：按住滑鼠或觸控筆拖曳即可作畫。運筆緩慢則墨色濃重洇潤；行筆迅疾則筆鋒纖細乾枯。每落一筆相當於蘸一次墨，墨盡自然呈現「飛白」之趣。
- **清水攪動（流體把玩）**：切換至「清水」筆刷，可在已完成的水墨畫上攪動水流，靜賞墨色隨渦流旋轉化開的動態美感。
- **撫琴和鳴（物理建模）**：筆觸與點苔皆觸發宮、商、角、徵、羽五聲音階的古琴撥弦聲，無半音之躁，無論如何揮灑皆悠揚和諧。
- **高畫質典藏（新增功能）**：支援一鍵點擊「典藏」，將當前水墨畫布、落款詩詞與朱砂印章合成匯出為高解析度 PNG 圖片保存。
- **日夜雙色主題（新增功能）**：支援「宣紙素白」與「月夜水墨」主題即時切換，暗色模式下宣紙化為夜空，墨色轉為銀月之光。
- **印章切換（新增功能）**：點擊朱砂印章可即時切換「墨韻心賞」、「克勞德印」、「逸筆草草」、「悠然見山」等多款經典篆刻款式。

---

## 🔬 技術運作原理

整件作品為**單一 HTML 檔案**，零外部套件庫依賴、無外部圖片資產、無預錄音訊檔案，純粹仰賴數學與瀏覽器原生算力即時生成。

| 模組 | 實現技術與算法 |
|---|---|
| **流體動力學 (Fluid)** | 在 WebGL2 片元著色器（Fragment Shader）中求解不可壓縮 Navier–Stokes 方程：旋度 (curl) → 渦量約束 (vorticity confinement) → 散度 (divergence) → 24 次 Jacobi 壓力迭代 → 梯度相減投影 → 半拉格朗日平流 (semi-Lagrangian advection)。 |
| **水墨洇散 (Bleeding)** | 墨層紋理（RGBA）分別儲存游離墨、朱砂、水分與定著墨。水分依程序化紙張纖維噪聲進行非等向性擴散與指數蒸發；乾燥墨色定著於紙上，直至再次遇水被喚醒。 |
| **毛筆筆觸 (Brush)** | 沿筆劃路徑等距壓印高斯印章，墨量隨間距歸一化。行筆速度動態調節筆徑，墨量隨距離衰減；墨竭時沿法線以 1D 噪聲刻劃刷毛條紋，再現「飛白」。 |
| **宣紙纖維 (Paper)** | 程序化生成紙張纖維紋理與顆粒噪聲，每次畫布縮放或切換主題時烘焙一次至紋理。 |
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
