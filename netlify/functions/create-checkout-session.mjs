const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  },
  body: JSON.stringify(body)
});

function safeOrigin(event) {
  const candidate = event.headers.origin || event.headers.referer || "https://tonbaeb.com";
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const allowed = host === "tonbaeb.com" || host === "www.tonbaeb.com" || host.endsWith(".netlify.app") || host === "localhost";
    return allowed ? url.origin : "https://tonbaeb.com";
  } catch {
    return "https://tonbaeb.com";
  }
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return json(503, { error: "ระบบชำระเงินยังไม่ได้ตั้งค่า" });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" });
  }

  const sku = String(payload.sku || "").trim();
  const title = String(payload.title || "").trim();
  if (!/^(PA|PB)-[A-Z0-9-]{3,80}$/.test(sku) || !title || title.length > 180) {
    return json(400, { error: "ไม่พบรหัสสินค้านี้" });
  }

  const origin = safeOrigin(event);
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/#catalog`);
  form.set("locale", "th");
  form.set("customer_creation", "always");
  form.set("automatic_payment_methods[enabled]", "true");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "thb");
  form.set("line_items[0][price_data][unit_amount]", "12000");
  form.set("line_items[0][price_data][product_data][name]", title);
  form.set("line_items[0][price_data][product_data][description]", `ไฟล์เอกสารแก้ไขได้ · ${sku}`);
  form.set("metadata[sku]", sku);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const result = await response.json();
  if (!response.ok || !result.url) {
    console.error("Stripe Checkout error", result?.error?.type || response.status);
    return json(502, { error: "ไม่สามารถเปิดหน้าชำระเงินได้ กรุณาลองใหม่" });
  }
  return json(200, { url: result.url });
}

