# TONBAEB Payment Setup (Netlify + Stripe)

ระบบนี้อยู่ใน Test mode จนกว่าจะตั้งค่าและทดสอบครบ ห้ามใส่ไฟล์จำหน่ายไว้ในโฟลเดอร์ public ของเว็บไซต์

## 1. ตั้งค่า Netlify

เพิ่ม Environment variables โดยจำกัด Scope เป็น Functions:

- `STRIPE_SECRET_KEY` — Test secret key (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` — Signing secret (`whsec_...`)

## 2. ตั้งค่า Stripe

1. เปิด PromptPay ใน Payment methods
2. สร้าง Webhook endpoint: `https://tonbaeb.com/.netlify/functions/stripe-webhook`
3. เลือก event `checkout.session.completed`
4. นำ Signing secret ไปใส่ `STRIPE_WEBHOOK_SECRET` ใน Netlify

## 3. ทดสอบก่อน Live

1. เปิด Deploy Preview ของ branch นี้
2. กดซื้อสินค้าหนึ่งรายการ
3. ตรวจว่า Stripe Checkout แสดงยอด 120 บาท
4. ทดสอบชำระใน Test mode
5. ตรวจ Function log ว่ามี `TONBAEB paid order`
6. ตรวจว่า `index.html`, ดาวน์โหลดฟรี และหน้าเรียนฟรีเดิมยังทำงาน

## 4. งานที่ต้องเสร็จก่อนรับเงินจริง

- ย้ายไฟล์ขายไป Private Storage
- ทำตารางจับคู่ `SKU -> private object key`
- สร้าง signed download URL ที่หมดอายุ
- ส่งอีเมลให้ผู้ซื้อหลัง webhook ยืนยันการชำระเงิน
- เพิ่มหน้าเงื่อนไขซื้อขาย นโยบายคืนเงิน และความเป็นส่วนตัว
- เปลี่ยนเป็น Live keys หลังผ่านการทดสอบครบเท่านั้น

