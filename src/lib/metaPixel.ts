type FBQ = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FBQ;
    __fbqDebugOnce?: boolean;
    __fbqQueueCreated?: boolean;
  }
}

function ensureFbq() {
  if (typeof window === "undefined") return null;
  if (window.fbq) return window.fbq;
  // Create a stub queue to avoid dropping events if our layout script hasn't run yet.
  const q: any = function (...args: unknown[]) {
    (q.queue = q.queue || []).push(args);
  };
  q.queue = q.queue || [];
  q.version = "2.0";
  q.loaded = false;
  window.fbq = q as FBQ;
  if (!window.__fbqQueueCreated) {
    window.__fbqQueueCreated = true;
    console.debug("[metaPixel] fbq stub queue created");
  }
  return window.fbq;
}

function debugMissingFbq(eventName: string) {
  if (typeof window === "undefined") return;
  if (window.__fbqDebugOnce) return;
  window.__fbqDebugOnce = true;
  console.warn(`[metaPixel] fbq not available, skipped: ${eventName}`);
}

export function trackViewContent(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
  extra?: Record<string, unknown>;
}) {
  const f = ensureFbq();
  if (!f) return debugMissingFbq("ViewContent");
  const { contentName, contentIds, contentType = "product", value, currency = "MAD", extra } = params;
  console.debug("[metaPixel] track ViewContent", { contentName, contentIds, value, currency, extra });
  f("track", "ViewContent", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
    ...(extra || {}),
  });
}

export function trackAddToCart(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
  extra?: Record<string, unknown>;
}) {
  const f = ensureFbq();
  if (!f) return debugMissingFbq("AddToCart");
  const { contentName, contentIds, contentType = "product", value, currency = "MAD", extra } = params;
  console.debug("[metaPixel] track AddToCart", { contentName, contentIds, value, currency, extra });
  f("track", "AddToCart", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
    ...(extra || {}),
  });
}

export function trackInitiateCheckout(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
  extra?: Record<string, unknown>;
}) {
  const f = ensureFbq();
  if (!f) return debugMissingFbq("InitiateCheckout");
  const { contentName, contentIds, contentType = "product", value, currency = "MAD", extra } = params;
  console.debug("[metaPixel] track InitiateCheckout", { contentName, contentIds, value, currency, extra });
  f("track", "InitiateCheckout", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    value,
    currency,
    ...(extra || {}),
  });
}

export function trackLead(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  value?: number;
  currency?: string;
  extra?: Record<string, unknown>;
}) {
  const f = ensureFbq();
  if (!f) return debugMissingFbq("Lead");
  const { contentName, contentIds, contentType = "product", contents, value, currency = "MAD", extra } = params;
  console.debug("[metaPixel] track Lead", { contentName, contentIds, value, currency, extra });
  f("track", "Lead", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    contents,
    value,
    currency,
    ...(extra || {}),
  });
}

export function trackPurchase(params: {
  contentName: string;
  contentIds?: string[];
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  value?: number;
  currency?: string;
  extra?: Record<string, unknown>;
}) {
  const f = ensureFbq();
  if (!f) return debugMissingFbq("Purchase");
  const { contentName, contentIds, contentType = "product", contents, value, currency = "MAD", extra } = params;
  console.debug("[metaPixel] track Purchase", { contentName, contentIds, value, currency, extra });
  f("track", "Purchase", {
    content_name: contentName,
    content_ids: contentIds,
    content_type: contentType,
    contents,
    value,
    currency,
    ...(extra || {}),
  });
}
