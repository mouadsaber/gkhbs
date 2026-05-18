import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isDbConfigured } from "@/lib/db";
import { createOrderInDb } from "@/lib/ordersDb";
import { getUploadsDir, safeUploadsFilename } from "@/lib/uploads";

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
  unitPrice: number;
  quantity: number;
};

type OrderPayload = Omit<OrderRecord, "orderNumber" | "createdAt"> & {
  quantity: number;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
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
  const unitPriceRaw = (payload as unknown as { unitPrice?: number }).unitPrice;
  const unitPrice = Number.isFinite(unitPriceRaw) ? Math.round(Number(unitPriceRaw)) : 0;
  const quantity = Number.isFinite(payload.quantity) ? Math.max(1, payload.quantity) : 1;

  if (!fullName || !phone || !city) return jsonError("missing_customer_fields", 400);
  if (!productName || !reference || !color || !size) return jsonError("missing_product_fields", 400);
  if (!unitPrice || unitPrice <= 0) return jsonError("missing_unit_price", 400);

  const subtotal = unitPrice * quantity;

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const orderEmail = process.env.ORDER_EMAIL || "contact@gkhbs.com";
  const from = process.env.SMTP_FROM || `"GKHBS Orders" <${user || ""}>`;

  const requiredEnv: Array<[string, string | undefined]> = [
    ["SMTP_HOST", host],
    ["SMTP_PORT", portRaw],
    ["SMTP_USER", user],
    ["SMTP_PASS", pass],
    ["ORDER_EMAIL", process.env.ORDER_EMAIL],
    ["SMTP_FROM", process.env.SMTP_FROM],
  ];
  const missing = requiredEnv.filter(([, v]) => !String(v || "").trim()).map(([k]) => k);
  if (missing.length) {
    console.error("[orders] missing env:", missing);
    return NextResponse.json(
      { error: "missing_env", variable: missing[0] },
      { status: 500 }
    );
  }

  const port = Number(portRaw);
  const secure = String(process.env.SMTP_PORT) === "465";
  console.log("[orders] SMTP config:", {
    host,
    port,
    secure,
    user,
    pass: maskSecret(pass || ""),
    from,
    orderEmail,
  });

  // Persist order in DB (required).
  let orderNumber = "";
  let createdAtIso = "";

  if (!isDbConfigured()) {
    console.error("[orders] DB not configured. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.");
    return jsonError("db_not_configured", 500);
  }
  try {
    const created = await createOrderInDb({
      fullName,
      phone,
      city,
      productName,
      reference,
      productImage: productImage || undefined,
      color,
      size,
      unitPrice,
      subtotal,
      quantity,
    });
    orderNumber = created.orderNumber;
    createdAtIso = created.createdAt;
  } catch (err) {
    console.error("[orders] DB write failed:", err);
    return jsonError("db_write_failed", 500);
  }

  // Send email notification to admin.
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const subject = `Nouvelle commande : #${orderNumber}`;
  const dateText = new Date(createdAtIso).toLocaleString("fr-FR", {
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
    `- Prix unitaire: ${unitPrice} DH`,
    `- Quantité: ${quantity}`,
    `- Sous-total: ${subtotal} DH`,
    "",
    `Total commande: ${subtotal} DH`,
    "",
    `Date: ${dateText}`,
    "",
    "Paiement:",
    "Paiement à la livraison",
    "",
    "Shipping:",
    "Livraison partout au Maroc",
  ].join("\n");

  const resolvedImageSrc = await resolveEmailImageSrc(req, productImage);
  const productImageHtml = resolvedImageSrc
    ? `<img src="${escapeHtml(resolvedImageSrc)}" alt="" width="88" height="88" style="display:block; width:88px; height:88px; object-fit:contain; background:#f4f4f5; border-radius:14px; border:1px solid #e4e4e7;" />`
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
            <th align="left" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Produit</th>
            <th align="left" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Taille</th>
            <th align="left" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Couleur</th>
            <th align="right" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Prix unitaire</th>
            <th align="right" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Quantité</th>
            <th align="right" style="font-size:16px; color:#374151; padding:10px 0; border-bottom:1px solid #e5e7eb;">Sous-total</th>
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
                    Référence : ${escapeHtml(reference)}
                  </div>
                </div>
              </div>
            </td>
            <td style="padding:16px 0; font-size:16px; color:#111827;">
              ${escapeHtml(size)}
            </td>
            <td style="padding:16px 0; font-size:16px; color:#111827;">
              ${escapeHtml(color)}
            </td>
            <td align="right" style="padding:16px 0; font-size:16px; color:#111827; font-weight:700;">
              ${unitPrice} DH
            </td>
            <td align="right" style="padding:16px 0; font-size:16px; color:#111827;">
              ×${quantity}
            </td>
            <td align="right" style="padding:16px 0; font-size:16px; color:#111827; font-weight:800;">
              ${subtotal} DH
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin:16px 0; border-top:1px solid #e5e7eb;"></div>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0; font-size:18px; color:#374151;">Total commande :</td>
          <td align="right" style="padding:10px 0; font-size:26px; color:#111827; font-weight:800;">
            ${subtotal} DH
          </td>
        </tr>
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
      to: orderEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("ORDER_EMAIL_ERROR", err);
    const error = err as { message?: string } | null;
    return NextResponse.json(
      { error: "send_failed", detail: error?.message || "Unknown SMTP error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, orderNumber, emailSent: true });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function resolveEmailImageSrc(req: Request, input: string) {
  const src = (input || "").trim();
  if (!src) return "";
  if (src.startsWith("data:")) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;

  const prodBase = "https://valisemaroc.com";

  // If it's an uploads-path like "/uploads/xyz.png", try embedding from uploads dir first.
  if (src.startsWith("/uploads/")) {
    const filename = safeUploadsFilename(src.replace("/uploads/", ""));
    const uploadsPath = path.join(getUploadsDir(), filename);
    try {
      const bytes = await readFile(uploadsPath);
      const mime = guessMime(uploadsPath);
      const b64 = bytes.toString("base64");
      return `data:${mime};base64,${b64}`;
    } catch (err) {
      console.error("[orders] resolveEmailImageSrc uploads read failed", { uploadsPath, err });
      // Emails need absolute URLs; enforce production domain for uploads.
      return `${prodBase}${src}`;
    }
  }

  // If it's another public-path like "/products/..", try embedding as base64.
  if (src.startsWith("/")) {
    const publicPath = path.join(process.cwd(), "public", src.replaceAll("/", path.sep));
    try {
      const bytes = await readFile(publicPath);
      const mime = guessMime(publicPath);
      const b64 = bytes.toString("base64");
      return `data:${mime};base64,${b64}`;
    } catch {
      // Fallback to absolute URL if possible.
      const origin = getRequestOrigin(req);
      return origin ? `${origin}${src}` : "";
    }
  }

  return "";
}

function getRequestOrigin(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  if (!host) return "";
  return `${proto}://${host}`;
}

function guessMime(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}
