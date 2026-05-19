import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppHelpFab } from "@/components/site/WhatsAppHelpFab";
import { MetaPixelDebug } from "@/components/site/MetaPixelDebug";

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
  return (
    <html lang="fr" className="antialiased overflow-x-hidden" suppressHydrationWarning>
      <body className="flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <SiteHeader />
        <main className="flex-1 pb-32 sm:pb-0">{children}</main>
        <SiteFooter />
        <WhatsAppHelpFab />
        <MetaPixelDebug />
        {pixelId ? (
          <>
            <Script
              id="meta-pixel-stub"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
// Create fbq queue early so events in first paint aren't dropped.
!function(f,b,e,v,n,t,s){
  if(!f.fbq){
    n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
  }
}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
                `,
              }}
            />
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
!function(f,b,e,v,n,t,s){
  // Ensure fbq exists (queue) but always load the library script.
  if(!f.fbq){
    n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
  }
  if(!f.__fbqScriptLoaded){
    t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    f.__fbqScriptLoaded=true;
  }
}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
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
