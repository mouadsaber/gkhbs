import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppHelpFab } from "@/components/site/WhatsAppHelpFab";
import { MetaPixelDebug } from "@/components/site/MetaPixelDebug";
import { MetaPixelEnsurePageView } from "@/components/site/MetaPixelEnsurePageView";

export const metadata: Metadata = {
  title: "GK Valises | Boutique Premium",
  description:
    "Boutique premium de valises au Maroc. Catalogue clean, pages produits, commande en quelques secondes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "2376048099583195";
  const tikTokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "D86RK7RC77U6OC336NC0";
  return (
    <html lang="fr" className="antialiased overflow-x-hidden" suppressHydrationWarning>
      <body className="flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <SiteHeader />
        <main className="flex-1 pb-32 sm:pb-0">{children}</main>
        <SiteFooter />
        <WhatsAppHelpFab />
        <MetaPixelDebug />
        <MetaPixelEnsurePageView />
        {tikTokPixelId ? (
          <Script
            id="tiktok-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;
  var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0))) }};
  for (var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for (var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++) ttq.setAndDefer(e,ttq.methods[n]); return e};
  ttq.load=function(e,n){
    var i="https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i=ttq._i||{};
    ttq._i[e]=[];
    ttq._i[e]._u=i;
    ttq._t=ttq._t||{};
    ttq._t[e]=+new Date;
    ttq._o=ttq._o||{};
    ttq._o[e]=n||{};
    var o=d.createElement("script");
    o.type="text/javascript";
    o.async=!0;
    o.src=i+"?sdkid="+e+"&lib="+t;
    var a=d.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(o,a);
  };
  ttq.load('${tikTokPixelId}');
  ttq.page();
}(window, document, 'ttq');
              `,
            }}
          />
        ) : null}
        {pixelId ? (
          <>
            <Script
              strategy="afterInteractive"
              id="meta-pixel"
              dangerouslySetInnerHTML={{
                __html: `
console.log('[META] pixel init start', '${pixelId}');
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
console.log('[META] pixel init done', typeof window !== 'undefined' ? typeof (window as any).fbq : 'server');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}
