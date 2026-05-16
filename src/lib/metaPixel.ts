type FBQ = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FBQ;
  }
}

function fbq() {
  if (typeof window === "undefined") return null;
  if (!window.fbq) return null;
  return window.fbq;
}

export function trackViewContent(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
}) {
  const f = fbq();
  if (!f) return;
  const { contentName, contentIds, contentType = "product", value, currency = "MAD" } = params;
  f("track", "ViewContent", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
  });
}

export function trackAddToCart(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
}) {
  const f = fbq();
  if (!f) return;
  const { contentName, contentIds, contentType = "product", value, currency = "MAD" } = params;
  f("track", "AddToCart", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
  });
}

export function trackInitiateCheckout(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
}) {
  const f = fbq();
  if (!f) return;
  const { contentName, contentIds, contentType = "product", value, currency = "MAD" } = params;
  f("track", "InitiateCheckout", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
  });
}

export function trackLead(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  value?: number;
  currency?: string;
}) {
  const f = fbq();
  if (!f) return;
  const { contentName, contentIds, contentType = "product", contents, value, currency = "MAD" } = params;
  f("track", "Lead", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    contents,
    value,
    currency,
  });
}

export function trackPurchase(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  value?: number;
  currency?: string;
}) {
  const f = fbq();
  if (!f) return;
  const { contentName, contentIds, contentType = "product", contents, value, currency = "MAD" } = params;
  f("track", "Purchase", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    contents,
    value,
    currency,
  });
}
