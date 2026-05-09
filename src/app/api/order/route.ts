import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type OrderPayload = {
  fullName: string;
  phone: string;
  city: string;
  productName: string;
  reference: string;
  color: string;
  size: string;
  quantity: number;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let payload: OrderPayload | null = null;
  try {
    payload = (await req.json()) as OrderPayload;
  } catch {
    return badRequest("invalid_json");
  }

  if (!payload) return badRequest("missing_payload");

  const fullName = (payload.fullName || "").trim();
  const phone = (payload.phone || "").trim();
  const city = (payload.city || "").trim();
  const productName = (payload.productName || "").trim();
  const reference = (payload.reference || "").trim();
  const color = (payload.color || "").trim();
  const size = (payload.size || "").trim();
  const quantity = Number.isFinite(payload.quantity) ? Math.max(1, payload.quantity) : 1;

  if (!fullName || !phone || !city) return badRequest("missing_customer_fields");
  if (!productName || !reference || !color || !size) return badRequest("missing_product_fields");

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const orderEmail = process.env.ORDER_EMAIL || "contact@gkhbs.com";

  if (!host || !portRaw || !user || !pass || !from) {
    console.error(
      "[order] Email not configured. Missing SMTP env vars. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS. Optional: SMTP_FROM, ORDER_EMAIL."
    );
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  const port = Number(portRaw);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const to = orderEmail;
  const subject = "Nouvelle demande de commande";

  const text = [
    "Nouvelle demande de commande",
    "",
    `Nom complet: ${fullName}`,
    `Téléphone: ${phone}`,
    `Ville: ${city}`,
    "",
    `Produit: ${productName}`,
    `Référence: ${reference}`,
    `Couleur: ${color}`,
    `Taille: ${size}`,
    `Quantité: ${quantity}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[order] send failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
