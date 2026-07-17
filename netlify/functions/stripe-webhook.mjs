import crypto from "node:crypto";

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const fields = Object.fromEntries(
    String(signatureHeader || "").split(",").map(part => part.split("=", 2))
  );
  const timestamp = Number(fields.t);
  const signature = fields.v1;
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function handler(event) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : (event.body || "");
  const signature = event.headers["stripe-signature"];
  if (!secret || !verifyStripeSignature(rawBody, signature, secret)) {
    return { statusCode: 400, body: "Invalid signature" };
  }

  const stripeEvent = JSON.parse(rawBody);
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    // จุดเชื่อมระบบส่งไฟล์: ใช้ session.metadata.sku และ session.customer_details.email
    // ก่อนเปิด Live mode ต้องผูก SKU กับไฟล์ใน Private Storage และส่ง signed URL ทางอีเมล
    console.log("TONBAEB paid order", {
      sessionId: session.id,
      sku: session.metadata?.sku,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total
    });
  }
  return { statusCode: 200, body: "ok" };
}

