# MeBacktest — Actionable Execution Roadmap & Task Breakdown

รายการแผนการทำงานและขั้นตอนการพัฒนาอย่างละเอียด สำหรับนำระบบ MeBacktest จาก Local Simulator สู่ Commercial SaaS ระดับสากล

---

## 📌 Milestones Overview

| Milestone | เป้าหมายหลัก | ผลลัพธ์ที่ได้ | สถานะ |
| :--- | :--- | :--- | :---: |
| **M0: Terminal Foundation** | Replay Engine, TradingView Chart, M1-D1 Data, BE, Partial, EMAs | โปรแกรมเทรดมือออฟไลน์ความเร็วสูง 60 FPS | **✅ เสร็จสิ้น 100%** |
| **M1: Pro Trader Suite** | Prop Firm Simulator (FTMO), Key Drawings (Zone/Line), Setup Tagging | ฟังก์ชันสำหรับนักเทรดระดับโปร เทียบเท่า FX Replay | **✅ เสร็จสิ้น 100%** |
| **M2: Cloud & Database** | Supabase Auth, Cloud PostgreSQL, Trade Journal Sync, User Profiles | ผู้ใช้สมัครสมาชิก ล็อกอิน และบันทึกประวัติเทรดข้ามเครื่องได้ | **✅ เสร็จสิ้น 100%** |
| **M3: Monetization Engine** | Stripe Subscriptions + PromptPay QR Code, Top-up Credits, Paywall | ระบบตัดเงินอัตโนมัติทั้งไทยและสากล พร้อมจำกัดโควต้า | **✅ เสร็จสิ้น 100%** |
| **M4: Data Lake & CDN** | Multi-Asset Data (Forex, BTC, Gold), IndexedDB Cache, Fast Streaming | ข้อมูลแท่งเทียนระดับแสนแท่งโหลดใน 1 วินาที แคชความเร็วสูง | **✅ เสร็จสิ้น 100%** |
| **M5: Launch & Marketing** | Landing Page, Affiliate System, Social Share Card, Domain mebacktest.com | เว็บไซต์ทางการ พร้อมเปิดรับผู้ใช้งานจริงและสร้างรายได้ | **✅ เสร็จสิ้น 100%** |
| **M6: QA & Security Audit** | Strict TypeScript, 48/48 Vitest Suite, OWASP, Webhook Idempotency | มาตรฐานวิศวกรรมซอฟต์แวร์ระดับ Commercial-Grade | **✅ เสร็จสิ้น 100%** |

---

## 🛠️ รายละเอียดงานย่อย (Detailed Task Backlog)

### [M1] Pro Trader Suite — [✅ เสร็จสิ้น 100%]
* [x] **Task 1.1: `PropFirmEngine.ts`**
  * สร้าง Deep Module คำนวณ High-Watermark Equity
  * คำนวณ Daily Drawdown: ตรวจจับผลขาดทุนเทียบกับ Balance ณ เวลาเที่ยงคืน (หรือจุดเริ่มวัน) ห้ามเกิน 5%
  * คำนวณ Max Total Drawdown: ห้ามติดลบรวมเกิน 10%
  * ส่งแจ้งเตือนและล็อกพอร์ตเมื่อเกิด "Account Breach" หรือ "Challenge Passed"
* [x] **Task 1.2: Prop Firm HUD Dashboard**
  * แถบแสดงสถานะบนหน้าจอ: แสดง Target Profit ($ หรือ %), Current Daily DD %, Max DD %
  * แจ้งเตือนสถานะ Passed / Breached
* [x] **Task 1.3: Core Drawing Tools (Canvas Primitive Plugins)**
  * เครื่องมือวาด **Rectangle (Demand / Supply / FVG Box)**: ลากตีกรอบโซนบนชาร์ต
  * เครื่องมือวาด **Horizontal Ray (Key Price Level)**: คลิกวางเส้นแนวรับ-แนวต้าน
  * ปุ่ม Clear Drawings ทั้งหมด
* [x] **Task 1.4: Setup Tagging in Order Entry & Analytics**
  * เพิ่ม Dropdown / Tags ก่อนเข้าออเดอร์: `Liquidity Sweep`, `Break of Structure`, `Fair Value Gap`, `Trend Pullback`
  * บันทึกลงตารางประวัติการเทรด และสรุปผลใน Performance Modal

### [M2] Cloud & Database Foundation — [✅ เสร็จสิ้น 100%]
* [x] **Task 2.1: Supabase Setup & Migration**
  * สร้าง Migration SQL ตาม Schema ใน `BLUEPRINT.md` ครอบคลุม `profiles`, `subscriptions`, `transactions`, `replay_sessions`, `trades`, `affiliates`
  * ตั้งค่า Row-Level Security (RLS) ให้ผู้ใช้อ่าน/เขียนได้เฉพาะข้อมูลของตัวเอง
* [x] **Task 2.2: User Authentication & Profiles**
  * หน้า Login / Register ด้วย Email & Magic Link พร้อม Nickname
  * Social Login ด้วย Google OAuth และ Discord Guild
  * Sandbox Quick Switcher (สลับ Free User / Pro Trader ในคลิกเดียว)
* [x] **Task 2.3: Cloud Replay Sessions & Trade Journal Sync**
  * บันทึกและเรียกคืนเซสชันการเทรดข้ามอุปกรณ์
  * สร้าง Shareable Link เช่น `?share=mb_xyz...` พร้อม Read-Only Replay Mode

### [M3] Monetization & Payment Integration — [✅ เสร็จสิ้น 100%]
* [x] **Task 3.1: Stripe Billing Client & Portal**
  * แผนบริการ Pro Monthly (฿490) และ Pro Annual (฿4,500)
  * Webhook listener พร้อมตรวจสอบ Signature และ Idempotency Key ป้องกัน Replay Attack
* [x] **Task 3.2: PromptPay Gateway**
  * อัลกอริทึม EMVCo PromptPay QR Code มาตรฐานสำหรับเติมเงิน Day Pass (฿99) หรือ Week Pass (฿199)
  * ตัวนับเวลาสแกน 15 นาที พร้อมปุ่มตรวจสอบและปลดล็อกทันที
* [x] **Task 3.3: Feature Gating (Paywall)**
  * ระบบจำกัดสิทธิ์ Free Tier (M15-D1, ลายน้ำบนจอ, 10 เครดิต)
  * Pro Tier ปลดล็อก M1, M5, FTMO Mode, Multi-Asset แบบไม่จำกัด

### [M4] Data Lake & Multi-Asset Streaming — [✅ เสร็จสิ้น 100%]
* [x] **Task 4.1: Asset Specifications**
  * รองรับ 8 สินทรัพย์: `XAUUSD`, `EURUSD`, `GBPUSD`, `USDJPY`, `BTCUSD`, `ETHUSD`, `US100`, `US30`
* [x] **Task 4.2: IndexedDB Hot Caching**
  * เก็บประวัติแท่งเทียนในแคชเบราว์เซอร์ โหลดซ้ำใน 5ms
* [x] **Task 4.3: Institutional Price Action Streamer**
  * สร้างข้อมูลการเคลื่อนไหวราคาเสมือนจริงตามสเปกตลาดสถาบัน

### [M5] Commercial Launch & Virality — [✅ เสร็จสิ้น 100%]
* [x] **Task 5.1: High-Conversion Landing Page**
  * หน้าแรกของเว็บไซต์ `mebacktest.com` พร้อมปุ่ม Launch Terminal
* [x] **Task 5.2: P&L Social Share Card Generator**
  * ส่งออกภาพผลงาน 1200x630 HD PNG สำหรับแชร์ลงโซเชียลมีเดียในคลิกเดียว
* [x] **Task 5.3: 30% Affiliate RevShare Partner Program**
  * ลิงก์แนะนำเพื่อน บันทึกค่าคอมมิชชัน และขอรับเงินโอนผ่าน PromptPay (ขั้นต่ำ ฿500)
* [x] **Task 5.4: User Feedback Widget**
  * กล่องแจ้งปัญหาและข้อเสนอแนะจากผู้ใช้

---

## 📈 แผนการตลาดและการจัดจำหน่าย (Go-to-Market Strategy)

1. **Freemium Acquisition Loop**:
   - เปิดให้ทดลองใช้งานฟรีบนหน้าเว็บทันทีแบบไม่ต้องกรอกบัตรเครดิต (ใช้ Timeframe M15 และทองคำ)
   - เมื่อต้องการใช้แท่ง M1 หรือฝึกโหมดสอบกองทุน (Prop Firm) ระบบจะแนะนำให้อัปเกรด
2. **Trader Community & Affiliate Program**:
   - ให้โค้ชสอนเทรด หรือกลุ่ม Telegram/Facebook ได้รับส่วนแบ่ง 30% ต่อทุกยอดสมัครสมาชิก
   - ฟังก์ชัน "Share Replay Session": สร้างลิงก์แชร์การบ้านหรือการเทรดให้เพื่อนหรือลูกศิษย์ดูได้
3. **P&L Social Sharing Cards**:
   - ปุ่มกด "Generate Result Card" สรุปผลการเทรดเป็นรูปภาพสวยงาม โพสต์ลง Facebook, X, TikTok, Discord ได้ในคลิกเดียว พร้อมโลโก้ MeBacktest เพื่อการตลาดแบบออร์แกนิก
