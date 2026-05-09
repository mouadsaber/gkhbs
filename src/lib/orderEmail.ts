type EmailJs = {
  init: (publicKey: string) => void;
  send: (
    serviceId: string,
    templateId: string,
    templateParams: Record<string, unknown>
  ) => Promise<unknown>;
};

declare global {
  interface Window {
    emailjs?: EmailJs;
  }
}

export async function sendOrderEmail(params: {
  toEmail: string;
  productName: string;
  reference: string;
  name: string;
  phone: string;
  city: string;
  size: string;
  color: string;
  quantity: number;
  totalPrice: number;
}) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";

  if (!serviceId || !templateId) {
    throw new Error("missing_emailjs_env");
  }

  const emailjs = await waitForEmailJs();

  return emailjs.send(serviceId, templateId, {
    to_email: params.toEmail,
    product_name: params.productName,
    reference: params.reference,
    nom: params.name,
    telephone: params.phone,
    ville: params.city,
    taille: params.size,
    couleur: params.color,
    quantite: params.quantity,
    prix_total: params.totalPrice,
    currency: "MAD",
  });
}

async function waitForEmailJs() {
  if (typeof window === "undefined") throw new Error("no_window");

  if (window.emailjs) return window.emailjs;

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (window.emailjs) {
        window.clearInterval(interval);
        resolve();
        return;
      }
      if (Date.now() - startedAt > 5000) {
        window.clearInterval(interval);
        reject(new Error("emailjs_timeout"));
      }
    }, 50);
  });

  if (!window.emailjs) throw new Error("emailjs_missing");
  return window.emailjs;
}
