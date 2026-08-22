# ☕ BrewLog 萃取日記
### 精品咖啡手沖調校與風味趨勢追蹤器 (Specialty Coffee Extraction & Flavor Tracker)

> **「每一次注水，都是追尋極致風味的科學實驗。」**
> BrewLog 是一款專為手沖咖啡愛好者與咖啡師量身打造的 **Local-First PWA 萃取調校與風味追蹤應用**。

---

## ✨ 核心特色 (Core Features)

1. **手沖沖煮駕駛艙 (Pour-Over Brew Cockpit)**
   - 內建世界冠軍經典手法預設：
     - 粕谷哲 4:6 法 (Tetsu Kasuya 4:6 Method)
     - James Hoffmann 單杯 V60 法 (Hoffmann 1-Cup)
     - April Brewer 雙段沖煮法 (Patrik Rolf)
     - Lance Hedrick 低擾動極簡法 (1-2 Pour Low Agitation)
     - 傳統三段式注水 (Traditional 3-Stage)
   - 即時互動注水碼錶：階段目標水重、累計進度條、建議流速提示 (g/s)、Web Audio 離線換段提示音效。

2. **手沖萃取智慧診斷教練 (Dial-in Barista Diagnostic Engine)**
   - 根據杯測感官特徵（酸質、甜感、醇厚度、苦味、乾澀度、流速與萃取率），自動診斷萃取狀態：
     - **萃取不足 (Under-Extracted)**：提供調細研磨度、提升水溫、拉大粉水比建議。
     - **過度萃取 (Over-Extracted)**：提供調粗研磨度、降溫、簡化注水段數建議。
     - **通道效應 (Channeling Detected)**：提供柔化水流衝擊、十字撥勻悶蒸粉層建議。
     - **完美甜蜜點 (Optimal Extraction)**：一鍵標記為此豆之「神參數 (Golden Recipe)」。

3. **咖啡豆庫存與黃金賞味期追蹤 (Bean Vault & Days Off Roast)**
   - 自動計算養豆天數（Days off roast）與當前熟豆狀態（排氣期、風味漸開、黃金賞味期、適飲期）。
   - 剩餘克數自動扣抵與可沖杯數預估（≈ X 杯）。
   - 官方標示風味筆記標籤與神參數快速沖煮。

4. **感官杯測風味輪與雷達圖 (Sensory Radar & Flavor Wheel)**
   - 6 軸精品咖啡 SCA 杯測雷達圖（酸質、甜感、醇厚度、乾淨度、平衡度、餘韻）。
   - 分類風味輪標籤選擇器（花香、柑橘、莓果核果、熱帶水果、茶感草本、甜感堅果可可、酒香發酵）。
   - 自動計算折射率光學濃度 TDS % 與萃取率 (Extraction Yield EY %)。

5. **養豆天數與研磨調校趨勢分析 (Flavor Trend Curves)**
   - **養豆天數 vs 風味評分演變曲線**：掌握每支豆子在開袋 3 至 30 天之間的風味變化高點。
   - **研磨刻度 vs 萃取評分校準分布**：直觀收斂最佳研磨刻度區間。
   - **雙把沖煮參數對比 (Comparison View)**：雙雷達圖與參數對比表。

6. **100% 離線可用與資料備份 (Local-First & Bilingual)**
   - 資料自動保存於瀏覽器 LocalStorage，無需伺服器或聯網。
   - 一鍵完整下載 JSON 備份檔與 CSV 沖煮數據表格。
   - 完整繁體中文 (zh-TW) 與英文 (en) 雙語一鍵切換。

---

## 🚀 快速啟動 (Quick Start)

### 1. 安裝相依套件
```bash
npm install
```

### 2. 本地開發運行
```bash
npm run dev
```
瀏覽器開啟 `http://localhost:5173` 即可立即開始使用。

### 3. 生產環境打包
```bash
npm run build
```

---

## 🛠 技術堆疊 (Tech Stack)

- **前端框架**: React 18 + TypeScript + Vite
- **樣式設計**: Tailwind CSS (Specialty Coffee Warm Palette)
- **圖表引擎**: Recharts (Radar, Line, Bar)
- **圖標庫**: Lucide React
- **音效系統**: Web Audio API (零外部依賴離線音效)
- **視覺效果**: Canvas Confetti
