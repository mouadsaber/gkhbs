import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type OrdersStore = {
  version: 1;
  lastNumber: number;
  orders: OrderRecord[];
};

type OrderRecord = {
  orderNumber: string;
  createdAt: string;
  fullName: string;
  phone: string;
  city: string;
  productName: string;
  reference: string;
  productImage?: string;
  color: string;
  size: string;
  quantity: number;
};

type OrderPayload = Omit<OrderRecord, "orderNumber" | "createdAt"> & {
  quantity: number;
};

const STORE_PATH = path.join(process.cwd(), "storage", "orders.json");

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

async function readOrdersStore(): Promise<OrdersStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as OrdersStore;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.orders) ||
      typeof parsed.lastNumber !== "number"
    ) {
      return { version: 1, lastNumber: 0, orders: [] };
    }
    return parsed;
  } catch {
    return { version: 1, lastNumber: 0, orders: [] };
  }
}

async function writeOrdersStore(store: OrdersStore) {
  const dir = path.dirname(STORE_PATH);
  await mkdir(dir, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export async function POST(req: Request) {
  let payload: OrderPayload | null = null;
  try {
    payload = (await req.json()) as OrderPayload;
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!payload) return jsonError("missing_payload", 400);

  const fullName = (payload.fullName || "").trim();
  const phone = (payload.phone || "").trim();
  const city = (payload.city || "").trim();
  const productName = (payload.productName || "").trim();
  const reference = (payload.reference || "").trim();
  const productImage = (payload.productImage || "").trim();
  const color = (payload.color || "").trim();
  const size = (payload.size || "").trim();
  const quantity = Number.isFinite(payload.quantity) ? Math.max(1, payload.quantity) : 1;

  if (!fullName || !phone || !city) return jsonError("missing_customer_fields", 400);
  if (!productName || !reference || !color || !size) return jsonError("missing_product_fields", 400);

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const orderEmail = process.env.ORDER_EMAIL || "contact@gkhbs.com";
  const from = `"GKHBS Orders" <${process.env.SMTP_USER || ""}>`;

  if (!host || !portRaw || !user || !pass) {
    console.error(
      "[orders] Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ORDER_EMAIL in .env.local."
    );
    return jsonError("Email service not configured", 500);
  }

  const port = Number(portRaw);
  const secure = port === 465;

  // Generate order number + persist order.
  const store = await readOrdersStore();
  const nextNumber = store.lastNumber + 1;
  const orderNumber = `CMD-${pad4(nextNumber)}`;
  const createdAt = new Date().toISOString();
  const record: OrderRecord = {
    orderNumber,
    createdAt,
    fullName,
    phone,
    city,
    productName,
    reference,
    productImage: productImage || undefined,
    color,
    size,
    quantity,
  };

  const nextStore: OrdersStore = {
    version: 1,
    lastNumber: nextNumber,
    orders: [record, ...store.orders],
  };

  await writeOrdersStore(nextStore);

  // Send email notification to admin.
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = `Nouvelle commande : #${orderNumber}`;
  const dateText = new Date(createdAt).toLocaleString("fr-FR", {
    timeZone: "Africa/Casablanca",
  });

  const text = [
    `Nouvelle commande #${orderNumber}`,
    "",
    "Client:",
    `- Nom: ${fullName}`,
    `- Téléphone: ${phone}`,
    `- Ville: ${city}`,
    "",
    "Produit:",
    `- Nom produit: ${productName}`,
    `- Référence: ${reference}`,
    `- Couleur: ${color}`,
    `- Taille: ${size}`,
    `- Quantité: ${quantity}`,
    "",
    `Date: ${dateText}`,
    "",
    "Paiement:",
    "Paiement à la livraison",
    "",
    "Shipping:",
    "Livraison partout au Maroc",
  ].join("\n");

  const productImageHtml = productImage
    ? `<img src="${escapeHtml(productImage)}" alt="" width="88" height="88" style="display:block; width:88px; height:88px; object-fit:contain; background:#f4f4f5; border-radius:14px; border:1px solid #e4e4e7;" />`
    : `<div style="width:88px; height:88px; background:#f4f4f5; border-radius:14px; border:1px solid #e4e4e7;"></div>`;

  const html = `
  <div style="margin:0; padding:0; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#111827; background:#ffffff;">
    <div style="max-width:720px; margin:0 auto; padding:28px 18px;">
      <div style="font-size:44px; font-weight:800; letter-spacing:-0.02em; margin:0 0 10px;">
        Nouvelle commande : <span style="font-weight:800;">#${escapeHtml(orderNumber)}</span>
      </div>
      <div style="font-size:18px; color:#4b5563; margin:0 0 22px;">
        Vous avez reçu une nouvelle commande de <strong>${escapeHtml(fullName)}</strong> :
      </div>

      <div style="margin:0 0 14px; font-size:26px; font-weight:800;">
        Résumé de la commande
      </div>
      <div style="margin:0 0 18px; font-size:18px; color:#111827;">
        Commande <strong>${escapeHtml(orderNumber)}</strong> (${escapeHtml(dateText)})
      </div>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="font-size:18px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Produit</th>
            <th align="right" style="font-size:18px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Quantité</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:16px 0;">
              <div style="display:flex; gap:14px; align-items:center;">
                ${productImageHtml}
                <div>
                  <div style="font-size:18px; font-weight:800; margin:0 0 4px;">
                    ${escapeHtml(productName)}
                  </div>
                  <div style="font-size:14px; color:#6b7280;">
                    Référence : ${escapeHtml(reference)}<br/>
                    Couleur : ${escapeHtml(color)} · Taille : ${escapeHtml(size)}
                  </div>
                </div>
              </div>
            </td>
            <td align="right" style="padding:16px 0; font-size:18px; color:#111827;">
              ×${quantity}
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin:16px 0; border-top:1px solid #e5e7eb;"></div>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0; font-size:18px; color:#374151;">Moyen de paiement :</td>
          <td align="right" style="padding:10px 0; font-size:18px; color:#111827; font-weight:700;">
            Paiement à la livraison (Cash on Delivery)
          </td>
        </tr>
      </table>

      <div style="margin:16px 0; border-top:1px solid #e5e7eb;"></div>

      <div style="margin:0 0 10px; font-size:22px; font-weight:800;">Adresse de livraison</div>
      <div style="font-size:18px; color:#111827; line-height:1.6;">
        <strong>${escapeHtml(fullName)}</strong><br/>
        ${escapeHtml(city)}<br/>
        ${escapeHtml(phone)}
      </div>

      <div style="margin-top:18px; padding:12px 14px; border:1px solid #e5e7eb; border-radius:14px; background:#fafafa; color:#374151;">
        Livraison partout au Maroc
      </div>
    </div>
  </div>
  `;

  try {
    await transporter.verify();
    console.log("[orders] SMTP verified");

    await transporter.sendMail({
      from,
      to: process.env.ORDER_EMAIL || orderEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[orders] send failed:", err);
    const error = err as { message?: string } | null;
    return NextResponse.json(
      { error: "send_failed", details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, orderNumber });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
