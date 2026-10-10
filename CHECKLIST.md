# MeBacktest — Master Production Checklist & Progress Tracker

> 📌 **เอกสารเช็กลิสต์ความคืบหน้าระบบ MeBacktest (Commercial SaaS Edition)**  
> ใช้สำหรับติดตาม ตรวจสอบ และทำเครื่องหมาย `[x]` เมื่อพัฒนาฟังก์ชันแต่ละส่วนเสร็จสิ้น เพื่อควบคุมคุณภาพก่อนปล่อยสู่ตลาดจริง

---

## 📊 สรุปความคืบหน้าภาพรวม (Progress Dashboard)

| หมวดหมู่ (Milestone) | รายละเอียด | จำนวนงานทั้งหมด | เสร็จสิ้นแล้ว | ความคืบหน้า (%) | สถานะปัจจุบัน |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **M0: Terminal Foundation** | แกนกลาง Replay Engine, TradingView Chart, M1 Data, Trade Logic | 7 | 7 | 100% | ✅ สมบูรณ์ 100% |
| **M1: Pro Trader Suite** | FTMO Challenge HUD, Drawing Tools, Setup Tagging & Journal Analytics | 6 | 6 | 100% | ✅ สมบูรณ์ 100% |
| **M2: Cloud & Database** | Next.js App Router, Supabase Auth (OAuth), Cloud PostgreSQL, RLS | 8 | 0 | 0% | 🟡 Sprint ถัดไป |
| **M3: Monetization & Billing** | Stripe Subscriptions, PromptPay QR Top-up, Paywall Feature Gating | 8 | 0 | 0% | ⚪ รอคิว |
| **M4: Data Lake & CDN** | Cloudflare R2 Bucket, Multi-Pair Streaming, IndexedDB Cache | 6 | 0 | 0% | ⚪ รอคิว |
| **M5: Launch & Marketing** | Landing Page, P&L Social Cards, Affiliate Referral System, Custom Domain | 6 | 0 | 0% | ⚪ รอคิว |
| **QA, Security & Audit** | OWASP Security, WCAG AAA Contrast, Anti-Cheat, Automated CI/CD | 7 | 4 | 57% | 🔵 อยู่ระหว่างดำเนินการ |
| **รวมทั้งสิ้น (Total)** | **โครงสร้างระบบทั้งหมดของ MeBacktest** | **48** | **17** | **35.4%** | 🚀 **Sprint 1 เสร็จสิ้น** |

---

## 🛠️ รายการเช็กลิสต์แยกตามโมดูล (Detailed Actionable Checklist)

### 🔹 Milestone 0: Core Terminal Foundation (M0) — [✅ เสร็จสิ้น 100%]
แกนหลักของโปรแกรมจำลองการเทรดความเร็วสูงระดับออฟไลน์

- [x] **0.1 Lightweight Charts Integration**
  - ติดตั้ง TradingView Lightweight Charts v4.2.1 แบบ High-DPI Canvas Rendering
  - ปรับธีมมืดมืออาชีพ (Midnight Theme `#0b0e14`, Candlestick `#10b981` / `#ef4444`)
  - ไฟล์: [`src/components/TradingChart.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/TradingChart.tsx)
- [x] **0.2 Bar Replay Engine & State Machine**
  - ตัวนับเวลา Replay ก้าวหน้าแท่งต่อแท่ง (Play, Pause, Step Forward, Speed 1x-10x)
  - Timeframe Switcher (M1, M5, M15, H1, D1) พร้อม Time-alignment อัตโนมัติ
  - ระบบ Random Jump สุ่มจังหวะตลาดเพื่อฝึกเทรด Blind Drill
  - ไฟล์: [`src/core/ReplayEngine.ts`](file:///D:/METHA/Projects/mebacktest/src/core/ReplayEngine.ts) | เทสต์: `tests/ReplayEngine.test.ts`
- [x] **0.3 100,000 M1 Candles Dataset Parsing**
  - สตรีมและแปลงข้อมูล CSV 100,000 แท่งเทียนด้วย PapaParse ประมวลผลเสร็จใน ~320ms
  - ตรวจจับ Timestamp ซ้ำและจัดเรียงข้อมูลเวลาอย่างถูกต้อง
  - ไฟล์: [`src/core/DataParser.ts`](file:///D:/METHA/Projects/mebacktest/src/core/DataParser.ts) | ไฟล์ข้อมูล: `public/data/XAUUSD_M1.csv`
- [x] **0.4 60 FPS Incremental Rendering Optimization**
  - ปรับปรุงการอัปเดตแท่งเทียนโดยใช้ `series.update()` แทน `series.setData()` ขณะเล่น Replay
  - ขจัดอาการกระตุก (0 Lag) แม้รันที่ความเร็วสูงสุด
  - ไฟล์: [`src/components/TradingChart.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/TradingChart.tsx)
- [x] **0.5 Order Execution & Position Engine**
  - คำนวณ PnL แบบ Real-time ตามขนาด Lot และ Contract Size ทองคำ (100 oz)
  - รองรับคำสั่ง Buy, Sell, Stop Loss (SL), Take Profit (TP)
  - ระบบจำลองค่า Spread (Ask = Bid + Spread) ที่สมจริง
  - ไฟล์: [`src/core/GoldTradingEngine.ts`](file:///D:/METHA/Projects/mebacktest/src/core/GoldTradingEngine.ts)
- [x] **0.6 Pro Trade Management: Break-Even & Partial Close**
  - ปุ่ม **Break-Even (BE)** ย้าย Stop Loss ไปที่ราคาเปิด พร้อมระบบป้องกัน (Anti-Exploit Guard: ห้ามเลื่อนถ้าออเดอร์ยังติดลบ)
  - ปุ่ม **Partial Close (50%)** ปิดครึ่งหนึ่ง ล็อกกำไรเข้ากระเป๋า และแบ่งออเดอร์อัตโนมัติ
  - ไฟล์: [`src/components/PositionList.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/PositionList.tsx)
- [x] **0.7 Technical Indicators & Chart Shift**
  - เส้นค่าเฉลี่ย EMA 20 (Cyan), EMA 50 (Yellow), EMA 200 (Magenta) บนชาร์ต
  - แถบเลื่อนปรับระยะ Shift ขอบขวาของกราฟ (Right Offset) เพื่อให้แท่งเทียนไม่ชนขอบจอ
  - ปุ่ม Toggle Auto-scroll ล็อกตำแหน่งแท่งเทียนล่าสุด
  - ไฟล์: [`src/core/indicators.ts`](file:///D:/METHA/Projects/mebacktest/src/core/indicators.ts)

---

### 🔹 Milestone 1: Pro Trader Suite & Prop Firm Engine (M1) — [✅ เสร็จสิ้น 100%]
ฟังก์ชันขั้นสูงสำหรับเทรดเดอร์มือโปรและสายสอบกองทุนระดับโลก (เทียบเท่า FX Replay / TradeZella)

- [x] **1.1 Deep Module: `PropFirmEngine.ts`**
  - ติดตาม High-Watermark Equity ตลอดเวลา
  - คำนวณ Daily Drawdown: ผลขาดทุนเทียบกับ Balance เริ่มต้นของวัน ห้ามเกิน 5.0%
  - คำนวณ Max Total Drawdown: ผลขาดทุนรวมเทียบกับยอดพอร์ตตั้งต้น ห้ามเกิน 10.0%
  - คำนวณ Profit Target: ตรวจสอบเป้ากำไร 8.0% ($10,000 -> $10,800)
  - ระบบเปลี่ยนสถานะอัตโนมัติ: `PASSED` / `BREACHED` / `ACTIVE`
  - ไฟล์: [`src/core/PropFirmEngine.ts`](file:///D:/METHA/Projects/mebacktest/src/core/PropFirmEngine.ts) | เทสต์: `tests/PropFirmEngine.test.ts` (5/5 Passing)
- [x] **1.2 Prop Firm Live HUD Dashboard**
  - กล่องแสดงผลสถานะสอบกองทุนแบบเรียลไทม์บนหัวกราฟ
  - แถบ Progress Bar วัด Daily DD, Max DD, และ Profit Target
  - ปุ่มสลับขนาดพอร์ตจำลอง ($10,000 / $25,000 / $50,000 / $100,000 / $200,000)
  - แบนเนอร์เตือนตัวโตเมื่อสอบผ่าน (Challenge Passed) หรือพอร์ตแตก (Account Breached)
  - ไฟล์: [`src/components/PropFirmHUD.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/PropFirmHUD.tsx)
- [x] **1.3 Left-Side Canvas Drawing Toolbar**
  - เครื่องมือวาด **Horizontal Ray (Key Level)**: วาดเส้นแนวรับ-แนวต้านแนวนอน
  - เครื่องมือวาด **Supply Zone (Red Box)**: ลากตีกรอบโซนขาย
  - เครื่องมือวาด **Demand Zone (Emerald Box)**: ลากตีกรอบโซนซื้อ
  - ปุ่ม **Clear Drawings**: ลบภาพวาดทั้งหมดบนชาร์ต
  - ไฟล์: [`src/components/TradingChart.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/TradingChart.tsx)
- [x] **1.4 Setup Model Tagging**
  - เมนูเลือกประเภท Setup ก่อนกดเข้าออเดอร์: `Liquidity Sweep`, `Break of Structure`, `Fair Value Gap`, `Trend Pullback`, `Supply/Demand Bounce`, `Other`
  - บันทึก Setup Tag ลงในประวัติออเดอร์ทุกไม้
  - ไฟล์: [`src/components/OrderEntryPanel.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/OrderEntryPanel.tsx)
- [x] **1.5 Strategy Breakdown Analytics Modal**
  - ตารางสรุปผลงานแยกตาม Setup Tag (Trade Count, Win Rate %, Net PnL, Profit Factor)
  - กราฟิกจำแนกว่ากลยุทธ์ไหนสร้างกำไรสูงสุด และกลยุทธ์ไหนทำให้ขาดทุน
  - ไฟล์: [`src/components/PerformanceModal.tsx`](file:///D:/METHA/Projects/mebacktest/src/components/PerformanceModal.tsx)
- [x] **1.6 Comprehensive Unit Test Suite**
  - เขียนเทสต์ครอบคลุม 5 Suite รวม 27 การทดสอบ (Vitest 100% Pass)
  - ไฟล์: `tests/DataParser.test.ts`, `tests/GoldTradingEngine.test.ts`, `tests/indicators.test.ts`, `tests/PropFirmEngine.test.ts`, `tests/ReplayEngine.test.ts`

---

### 🔹 Milestone 2: Cloud Sync, Supabase Auth & PostgreSQL (M2) — [🟡 ถัดไป]
ย้ายระบบสู่คลาวด์เพื่อให้ผู้ใช้สมัครสมาชิก ล็อกอิน และบันทึกประวัติเทรดข้ามอุปกรณ์ได้

- [ ] **2.1 สถาปัตยกรรม Next.js App Router Migration**
  - รวมแพ็กเกจ React 19 เข้ากับ Next.js 15 App Router หรือสร้าง Cloud API Bridge
  - จัดการ Server Components และ Client Components เพื่อความปลอดภัยของข้อมูล
- [ ] **2.2 Supabase Project & Database Migration**
  - รันคำสั่ง SQL สร้างตาราง `profiles`, `subscriptions`, `transactions`, `replay_sessions`, `trades` ตาม `BLUEPRINT.md`
  - ติดตั้ง Row-Level Security (RLS) เพื่อป้องกันไม่ให้ผู้ใช้แอบดูข้อมูลกันและกัน
- [ ] **2.3 Authentication Flow (Email & Social OAuth)**
  - ระบบสมัครสมาชิกและล็อกอินผ่าน Email & Magic Link
  - เชื่อมต่อ Google OAuth Sign-in
  - เชื่อมต่อ Discord OAuth Sign-in (สำหรับคอมมูนิตี้เทรดเดอร์)
- [ ] **2.4 User Profile & Credit System**
  - ตารางโปรไฟล์ผู้ใช้ แสดง Tier (`free`, `pro_monthly`, `pro_yearly`, `lifetime`)
  - ตัวนับเครดิตทดลองใช้งาน (Default: 10 ฟรีเครดิตสำหรับ Free Tier)
- [ ] **2.5 Cloud Replay Session Auto-Save**
  - ระบบแบ็กอัปสถานะพอร์ตการเทรด (Balance, Equity, Positions, Prop Firm State) ขึ้น Supabase อัตโนมัติทุก 30 วินาที
  - ปุ่ม "Save Session" และ "Load Past Session"
- [ ] **2.6 Cloud Trading Journal Sync**
  - บันทึกทุกไม้ที่ปิด (Closed Trades) พร้อม Setup Tag, แท่งเทียนที่เข้า, PnL ขึ้น PostgreSQL
  - ดึงข้อมูลมาแสดงในหน้า Dashboard Journal ข้ามเครื่องได้
- [ ] **2.7 Session Sharing Link (Public URL)**
  - สร้าง Shareable Link เช่น `mebacktest.com/share/sess_abc123` สำหรับให้ครูหรือเพื่อนตรวจการบ้าน
  - โหมด Read-Only Replay สำหรับผู้รับลิงก์
- [ ] **2.8 Local-to-Cloud Migration Helper**
  - ปุ่มกด "Sync Local Trades to Cloud" ให้ผู้ใช้เดิมที่เคยเทรดในเครื่องสามารถโอนประวัติขึ้นคลาวด์ได้

---

### 🔹 Milestone 3: Monetization & Payment Gateways (M3) — [⚪ รอคิว]
ระบบเก็บเงินสร้างรายได้ ทั้งแบบสมัครสมาชิกรายเดือน/รายปี และแบบเติมเงิน PromptPay

- [ ] **3.1 Stripe Billing Integration (Global Credit Cards)**
  - สร้าง Product & Price IDs บน Stripe Dashboard (Pro Monthly ฿490 / Pro Yearly ฿4,500)
  - หน้า Stripe Checkout Session สำหรับรับชำระผ่านบัตรเครดิต Visa/Mastercard
  - เชื่อมโยง Stripe Customer Portal สำหรับให้ผู้ใช้กดยกเลิกหรือเปลี่ยนบัตรเอง
- [ ] **3.2 Stripe Secure Webhook Worker**
  - ตรวจสอบ Webhook Signature (`stripe.webhooks.constructEvent`) ป้องกันการปลอมแปลง
  - จัดการ Event: `checkout.session.completed` (อัปเกรดเป็น Pro ทันที)
  - จัดการ Event: `customer.subscription.deleted` (ลดระดับเป็น Free ทันที)
- [ ] **3.3 Thai Market: PromptPay QR Code Gateway**
  - เชื่อมต่อ Payment Provider ในไทย (เช่น Omise, GBPrimePay, หรือ Opn)
  - เจนเนอเรต Dynamic PromptPay QR Code สำหรับเติมเงินซื้อ Day Pass (฿99) หรือ Week Pass (฿199)
- [ ] **3.4 PromptPay Top-up Webhook & Idempotency**
  - ระบบรับ Webhook การสแกนจ่ายเงิน พร้อม Idempotency Key ป้องกันการบวกเครดิตซ้ำ
  - อัปเดต Credit Balance หรือขยายวันหมดอายุของ Pass ในตาราง `transactions`
- [ ] **3.5 Paywall & Feature Gating Engine**
  - ระบบตรวจสอบสิทธิ์ (Entitlement Checker Middleware):
    - Free Tier: อนุญาตเฉพาะ M15-D1, บันทึก Journal ได้สูงสุด 50 ไม้, มีลายน้ำบนจอ
    - Pro / Pass: ปลดล็อก M1, Prop Firm Mode, ไม่จำกัดประวัติ, ไม่มีลายน้ำ
  - โมดอล "Upgrade to Pro" เด้งแจ้งเตือนเมื่อผู้ใช้คลิกเลือก M1 หรือโหมดพิเศษ
- [ ] **3.6 Invoice & Receipt Generation**
  - ออกใบเสร็จรับเงินดิจิทัล (PDF/Email) ส่งให้ลูกค้าอัตโนมัติ
- [ ] **3.7 Discount Codes & Promotion System**
  - ระบบใส่คูปองส่วนลด (เช่น `LAUNCH50`, `PROPTRADER`) ก่อนชำระเงิน
- [ ] **3.8 Subscription Expiry Background Cron**
  - ตัวตรวจจับวันหมดอายุของสมาชิก และส่งอีเมลแจ้งเตือนก่อนตัดรอบบิล 3 วัน

---

### 🔹 Milestone 4: Big Data Lake & Multi-Asset CDN (M4) — [⚪ รอคิว]
ระบบจัดเก็บและสตรีมข้อมูลแท่งเทียนระดับหลายล้านแท่ง โหลดเร็วใน 1 วินาที ค่าส่งข้อมูลฟรี

- [ ] **4.1 Cloudflare R2 Bucket Infrastructure**
  - สร้าง R2 Object Storage สำหรับเก็บข้อมูลย้อนหลัง (Zero Egress Bandwidth Fees)
  - ตั้งค่า Cache Header ให้ CDN แคชข้อมูลอย่างมีประสิทธิภาพ
- [ ] **4.2 Data Chunking & Compression Pipeline**
  - แปลงไฟล์แท่งเทียนเป็น Chunked JSON หรือ Apache Parquet บีบอัดด้วย Brotli/Gzip (ลดขนาดไฟล์ลง 80%)
  - แบ่งพาร์ทิชันตามปี/เดือน (e.g. `XAUUSD/M1/2024-01.json.br`)
- [ ] **4.3 Multi-Asset Dataset Ingestion**
  - เพิ่มข้อมูลคู่เงินยอดนิยม: `EURUSD`, `GBPUSD`, `USDJPY`
  - เพิ่มข้อมูลคริปโต: `BTCUSD`, `ETHUSD`
  - เพิ่มข้อมูลดัชนี: `US100` (Nasdaq), `US30` (Dow Jones)
- [ ] **4.4 Client-side IndexedDB Hot Caching**
  - จัดเก็บข้อมูลแท่งเทียนที่ดาวน์โหลดแล้วลงใน IndexedDB ของเบราว์เซอร์
  - เปิดใช้งาน Replay ในจุดเดิมได้ทันทีโดยไม่ต้องโหลดข้อมูลซ้ำ ประหยัดเน็ตผู้ใช้
- [ ] **4.5 Custom CSV Uploader (Pro Feature)**
  - ให้ผู้ใช้สาย Quant หรือผู้ใช้พรีเมียมสามารถอัปโหลดไฟล์ CSV ประวัติราคาของตัวเองเข้ามาเทรดได้
  - ตัว Parser ตรวจสอบความถูกต้องของ Header (Time, Open, High, Low, Close, Volume)
- [ ] **4.6 Data Integrity & Gap Checker**
  - สคริปต์ตรวจสอบแท่งเทียนที่ขาดหาย (Missing Bars) ระหว่างชั่วโมงตลาดเปิด และเติมข้อมูล Flat Bar อัตโนมัติ

---

### 🔹 Milestone 5: Commercial Launch, Marketing & Virality (M5) — [⚪ รอคิว]
หน้าบ้าน การตลาด ระบบบอกต่อ และการเปิดตัวต่อสาธารณะ

- [ ] **5.1 High-Conversion Landing Page**
  - หน้าแรกของเว็บไซต์ `mebacktest.com` แสดงจุดเด่น (Features, Comparison Table vs TradingView vs FX Replay)
  - วิดีโอสั้นหรือ Live Interactive Mini-Demo หน้าเว็บโดยไม่ต้องล็อกอิน
- [ ] **5.2 P&L Social Share Card Generator**
  - ปุ่มคลิก "Share P&L Card" สร้างภาพกราฟิกสรุปผลงานสวยงามพร้อมโลโก้ MeBacktest
  - แสดง Win Rate, Profit Factor, Net PnL และสเตตัส "FTMO Passed"
  - รองรับการแชร์ลง Facebook, X (Twitter), TikTok, Discord ในคลิกเดียว
- [ ] **5.3 Affiliate & Influencer Referral Program**
  - ระบบรหัสแนะนำเพื่อน (Referral Code / Link)
  - แบ่งค่าคอมมิชชัน 25% - 30% ให้โค้ชสอนเทรดทุกยอดชำระเงินของลูกศิษย์
  - แดชบอร์ดสรุปยอด Affiliate รายได้และปุ่มถอนเงิน
- [ ] **5.4 SEO Optimization & Meta Tags**
  - ติดตั้ง OpenGraph Tags, Twitter Cards, Structured Data (Schema.org)
  - บทความความรู้ด้านการเทรด Price Action และการ Backtest เพื่อดึงดูด Search Traffic
- [ ] **5.5 Production Domain & CDN Deployment**
  - จดและผูกโดเมนหลัก `mebacktest.com` เข้ากับ Vercel / Cloudflare Pages
  - ติดตั้ง SSL/TLS Certificate และ Web Application Firewall (WAF)
- [ ] **5.6 User Feedback & Bug Report Widget**
  - กล่องข้อความมุมจอด้านล่างสำหรับให้ผู้ใช้แจ้งปัญหาหรือส่งคำแนะนำติชมเข้ามายังทีมพัฒนาได้โดยตรง

---

### 🔹 Milestone 6: Quality Assurance, Security & Performance Standards — [🔵 ต่อเนื่อง]
มาตรฐานความปลอดภัยและวิศวกรรมซอฟต์แวร์ระดับ Commercial-Grade

- [x] **6.1 Strict TypeScript & Build Verification**
  - `tsc --noEmit` ผ่าน 0 errors
  - `npm run build` คอมไพล์โปรดักชันผ่านฉลุยในเวลาต่ำกว่า 3 วินาที
- [x] **6.2 Automated Unit Testing Baseline**
  - ผ่าน 27/27 Vitest Tests ครอบคลุม Logic ทั้งหมดของ Engine
- [x] **6.3 WCAG AAA High-Contrast UI Compliance**
  - โทนสีมืดคอนทราสต์สูง อ่านง่าย ไม่เมื่อยล้าสายตา ปุ่มกดมีระยะ Touch Target ชัดเจน
- [x] **6.4 Anti-Exploit Trade Execution Guards**
  - ระบบบล็อกการเลื่อน SL ไป Break-Even หากราคายังไม่กำไร
  - ระบบตรวจสอบขนาด Lot Size ขั้นต่ำ (0.01) และคำนวณ Margin ไม่ให้ติดลบ
- [ ] **6.5 OWASP & SAST Taint Analysis (Server-side)**
  - ตรวจสอบ Data flow Source-to-Sink ใน API Endpoints ทั้งหมด
  - ห้าม Bypass IDOR ในการเข้าถึง Trade Logs ข้าม `user_id`
- [ ] **6.6 Webhook Idempotency & Replay Attack Defense**
  - จัดเก็บ Timestamp และ Webhook Event ID ลงในตารางเพื่อป้องกันการส่งซ้ำ
- [ ] **6.7 Comprehensive End-to-End (E2E) Browser Tests**
  - ติดตั้ง Playwright ทดสอบ Flow การกด Replay, ออกออเดอร์ Buy/Sell, และแสดงผล HUD อัตโนมัติ

---

## 📝 วิธีใช้งานเช็กลิสต์นี้ (How to Track Progress)

1. **เมื่อพัฒนาฟังก์ชันใดเสร็จแล้ว**:
   - เปลี่ยนเครื่องหมายจาก `[ ]` เป็น `[x]` ในหัวข้อที่เกี่ยวข้อง
   - รันคำสั่ง `npm test` เพื่อให้มั่นใจว่า Unit Tests ทุกตัวยังคงผ่าน 100%
2. **ทำการบันทึกประวัติด้วย Git**:
   ```powershell
   git add CHECKLIST.md
   git commit -m "docs(checklist): update progress on <ชื่อฟังก์ชัน>"
   git push origin main
   ```
3. **ตรวจสอบ Milestone ถัดไป**: อ้างอิงตาม `BLUEPRINT.md` และ `ROADMAP.md` เพื่อวางแผนล่วงหน้า
