# MeBacktest — Actionable Execution Roadmap & Task Breakdown

รายการแผนการทำงานและขั้นตอนการพัฒนาอย่างละเอียด สำหรับนำระบบ MeBacktest จาก Local Simulator สู่ Commercial SaaS ระดับสากล

---

## 📌 Milestones Overview

| Milestone | เป้าหมายหลัก | ผลลัพธ์ที่ได้ | สถานะ |
| :--- | :--- | :--- | :---: |
| **M0: Terminal Foundation** | Replay Engine, TradingView Chart, M1-D1 Data, BE, Partial, EMAs | โปรแกรมเทรดมือออฟไลน์ความเร็วสูง 60 FPS | **✅ เสร็จสิ้น 100%** |
| **M1: Pro Trader Suite** | Prop Firm Simulator (FTMO), Key Drawings (Zone/Line), Setup Tagging | ฟังก์ชันสำหรับนักเทรดระดับโปร เทียบเท่า FX Replay | **✅ เสร็จสิ้น 100%** |
| **M2: Cloud & Database** | Supabase Auth, Cloud PostgreSQL, Trade Journal Sync, User Profiles | ผู้ใช้สมัครสมาชิก ล็อกอิน และบันทึกประวัติเทรดข้ามเครื่องได้ | 🟡 **พร้อมเริ่มทำทันที** |
| **M3: Monetization Engine** | Stripe Subscriptions + PromptPay QR Code, Top-up Credits, Paywall | ระบบตัดเงินอัตโนมัติทั้งไทยและสากล พร้อมจำกัดโควต้า | ⚪ ถัดไป |
| **M4: Data Lake & CDN** | Cloudflare R2 Storage, Multi-Asset Data (Forex, BTC), Fast Streaming | ข้อมูลแท่งเทียนระดับแสนแท่งโหลดใน 1 วินาที ค่าส่งข้อมูลฟรี | ⚪ ถัดไป |
| **M5: Launch & Marketing** | Landing Page, Affiliate System, Social Share Card, Domain mebacktest.com | เว็บไซต์ทางการ พร้อมเปิดรับผู้ใช้งานจริงและสร้างรายได้ | ⚪ ถัดไป |

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

### [M2] Cloud & Database Foundation (ขั้นตอนการพัฒนาถัดไปที่แนะนำให้ทำทันที)
* [ ] **Task 2.1: Supabase Setup**
  * สร้างโปรเจกต์ Supabase และรัน Migration ตาม Schema ใน `BLUEPRINT.md`
  * ตั้งค่า Row-Level Security (RLS) ให้ผู้ใช้อ่าน/เขียนได้เฉพาะข้อมูลของตัวเอง
* [ ] **Task 2.2: User Authentication**
  * หน้า Login / Register ด้วย Email & Magic Link
  * Social Login ด้วย Google OAuth และ Discord
* [ ] **Task 2.3: Cloud Sync**
  * อัปโหลด Closed Trades และ Replay Sessions ขึ้น PostgreSQL อัตโนมัติ

### [M3] Monetization & Payment Integration
* [ ] **Task 3.1: Stripe Billing**
  * ติดตั้ง Stripe SDK และสร้าง Subscription Products (Pro Monthly / Yearly)
  * Webhook listener สำหรับ event `checkout.session.completed` และ `customer.subscription.deleted`
* [ ] **Task 3.2: PromptPay Gateway**
  * ติดตั้งระบบสร้าง QR Code PromptPay สำหรับลูกค้าไทย
  * Webhook สำหรับอัปเดตเครดิตหรือปลดล็อก Day/Week Pass
* [ ] **Task 3.3: Feature Gating (Paywall)**
  * ตรวจสอบสิทธิ์ผู้ใช้: ถ้าเป็น Free Tier บังคับใช้ได้เฉพาะ Timeframe M15 ขึ้นไป และมีโควต้าจำกัด
  * ถ้าเป็น Pro หรือมี Credit ปลดล็อก M1 และ Prop Firm Mode แบบไม่จำกัด

---

## 📈 แผนการตลาดและการจัดจำหน่าย (Go-to-Market Strategy)

1. **Freemium Acquisition Loop**:
   - เปิดให้ทดลองใช้งานฟรีบนหน้าเว็บทันทีแบบไม่ต้องกรอกบัตรเครดิต (ใช้ Timeframe M15 และทองคำ)
   - เมื่อต้องการใช้แท่ง M1 หรือฝึกโหมดสอบกองทุน (Prop Firm) ระบบจะแนะนำให้อัปเกรด
2. **Trader Community & Affiliate Program**:
   - ให้โค้ชสอนเทรด หรือกลุ่ม Telegram/Facebook ได้รับส่วนแบ่ง 25-30% ต่อทุกยอดสมัครสมาชิก
   - ฟังก์ชัน "Share Replay Session": สร้างลิงก์แชร์การบ้านหรือการเทรดให้เพื่อนหรือลูกศิษย์ดูได้
3. **P&L Social Sharing Cards**:
   - ปุ่มกด "Generate Result Card" สรุปผลการเทรดเป็นรูปภาพสวยงาม โพสต์ลง Facebook, X, TikTok, Discord ได้ในคลิกเดียว พร้อมโลโก้ MeBacktest เพื่อการตลาดแบบออร์แกนิก
