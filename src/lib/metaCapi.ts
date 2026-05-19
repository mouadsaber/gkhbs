import crypto from "node:crypto";

type CapiUserData = {
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

export async function sendCapiPurchase(params: {
  pixelId: string;
  accessToken: string;
  eventSourceUrl?: string;
  actionSource?: "website";
  userData: CapiUserData;
  customData: {
    currency: "MAD";
    value: number;
    content_name?: string;
    content_ids?: string[];
    content_type?: "product";
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  };
}) {
  const {
    pixelId,
    accessToken,
    eventSourceUrl,
    actionSource = "website",
    userData,
    customData,
  } = params;

  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(
    accessToken
  )}`;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: crypto.randomBytes(8).toString("hex"),
        action_source: actionSource,
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`CAPI ${res.status}: ${text.slice(0, 500)}`);
  }
  return text;
}

