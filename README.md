# MeBacktest — XAUUSD Manual Backtest & Bar Replay Terminal

โปรแกรมจำลองการเทรดทองคำ (XAUUSD) และระบบ Bar Replay เสมือนจริงสไตล์ **TradingView** ทำงานบนเว็บเบราว์เซอร์แบบ Local 100% พร้อมระบบสุ่มสถานการณ์ (Mystery Drill) และโหมดซ่อนเวลา (Blind Mode) สำหรับฝึกฝน Price Action และระบบเทรดโดยไร้ Hindsight Bias

---

## 🌟 ฟีเจอร์เด่น (Key Features)

### 1. กราฟระดับมืออาชีพ (TradingView Lightweight Charts v4)
* อินเทอร์เฟซธีมมืด (Dark Theme) สไตล์ TradingView แท้
* ขยาย ย่อ เลื่อน (Pan/Zoom) กราฟได้อย่างลื่นไหล
* **Visual Orders**: ลากเส้นระดับราคาออเดอร์บนกราฟ (Entry เส้นฟ้า, SL เส้นประแดง, TP เส้นประเขียว)
* **Candle Markers**: แสดงเครื่องหมายลูกศร Buy (เขียว) / Sell (แดง) และจุดปิดออเดอร์บนแท่งเทียน
* **Click-to-Fill**: คลิกบนระดับราคาของกราฟเพื่อดึงราคานั้นมากรอกเป็น SL หรือ TP อัตโนมัติ

### 2. กลไก Bar Replay & สุ่มสถานการณ์ (Replay & Random Engine)
* **Step-by-Step Execution**: กดดูแท่งเทียนถัดไปทีละแท่งด้วยปุ่ม หรือกดปุ่ม `Spacebar` / `Right Arrow`
* **Auto-Play Speed**: ปรับความเร็วในการเล่นอัตโนมัติได้ตั้งแต่ 0.1s, 0.25s, 0.5s, 1.0s, ไปจนถึง 2.0s ต่อแท่ง
* **สุ่มสถานการณ์ (Mystery Drill)**: กดปุ่มเดียวเพื่อสุ่มช่วงเวลาจากประวัติกราฟทองคำจริงขึ้นมาฝึกฝน
* **Blind Mode**: ซ่อนวันที่และเวลาบนแกนกราฟ เพื่อฝึกอ่าน Price Action ล้วนๆ ป้องกันจิตวิทยาจำกราฟได้
* **Jump to Date**: เลือกวันที่และเวลาที่ต้องการเจาะจงเพื่อย้อนกลับไปศึกษาเหตุการณ์สำคัญ

### 3. ระบบจำลองการเทรดและคำนวณทองคำ (Gold Risk & Math Engine)
* วางคำสั่ง **Buy Market** และ **Sell Market**
* กำหนด **Lot Size** (0.01 - 100) พร้อมปุ่มเลือกขนาดลอตด่วน
* กำหนด **Stop Loss (SL)** และ **Take Profit (TP)** ด้วยราคาเจาะจง หรือกดปุ่ม Quick Pips (+20p, +50p, +100p, +200p)
* **คำนวณ Risk : Reward (R:R)**, จำนวนเงินที่เสี่ยง ($ Risk) และผลตอบแทนที่คาดหวัง ($ Reward) ให้เห็นทันทีก่อนเข้าออเดอร์
* **Gold Contract Specs**: คำนวณตามมาตรฐานทองคำแท้ (1 Standard Lot = 100 oz / การขยับราคา $1.00 = 100 Pips = $100 กำไร/ขาดทุนต่อ 1 Lot)
* **SL/TP Trigger**: ตรวจจับและปิดออเดอร์ให้อัตโนมัติเมื่อแท่งเทียนถัดไปแตะระดับราคา

### 4. บันทึกและวิเคราะห์ผลการเทรด (Trade Journal & Analytics)
* แสดงยอดเงินแบบเรียลไทม์: **Balance**, **Equity**, **Floating PnL**, **Realized Net PnL**
* สรุปสถิติรอบด้าน: **Win Rate %**, **Profit Factor**, **Max Drawdown ($ และ %)**
* บันทึกรายการเทรดทั้งหมดลงในตารางประวัติ และกด **Export CSV** เพื่อนำไปบันทึก Trading Journal ได้ทันที

### 5. รองรับชุดข้อมูล (Data Ingestion)
* มีชุดข้อมูลแท่งเทียนทองคำคุณภาพสูงติดตั้งมาในตัว: **M5, M15, H1, D1**
* มีปุ่ม **Upload CSV** สามารถลากไฟล์ CSV จาก MetaTrader 5 หรือ TradingView มาเปิดเทรดได้ทันที

---

## ⌨️ คีย์ลัด (Keyboard Shortcuts)

| ปุ่ม | คำสั่ง |
| :--- | :--- |
| **`Spacebar`** หรือ **`→`** | ขยับแท่งเทียนถัดไป (Next Bar) |
| **`P`** | เล่นอัตโนมัติ / หยุดชั่วคราว (Play / Pause) |
| **`R`** | สุ่มช่วงเวลาและสถานการณ์ใหม่ (Random Scenario) |
| **`M`** | เปิด / ปิด Blind Mode (ซ่อนวันที่บนแกนเวลา) |
| **`B`** | เปิดออเดอร์ Buy ทันที |
| **`S`** | เปิดออเดอร์ Sell ทันที |
| **คลิกบนกราฟ** | นำระดับราคานั้นมากรอกเป็น SL หรือ TP อัตโนมัติ |

---

## 🚀 วิธีติดตั้งและเปิดใช้งาน (Quick Start)

### ความต้องการของระบบ:
* [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)

### ขั้นตอนการรัน:
```bash
# 1. ติดตั้ง dependencies
npm install

# 2. เริ่มต้นรัน Dev Server
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่: **`http://localhost:3000`**

### การบิลด์สำหรับ Production:
```bash
npm run build
npm run preview
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* **Frontend Framework**: React 19 + TypeScript + Vite
* **Chart Engine**: TradingView Lightweight Charts v4
* **Styling**: Tailwind CSS (TradingView Dark Theme Palette)
* **Icons**: Lucide React
* **Data Processing**: PapaParse (CSV Streaming & Parsing)
* **Testing Suite**: Vitest (Unit Tested 100% at Seams)

---

## 📄 License
MIT License
