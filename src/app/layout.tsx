import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppHelpFab } from "@/components/site/WhatsAppHelpFab";
import { MetaPixelPageView } from "@/components/site/MetaPixelPageView";

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
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  return (
    <html lang="fr" className="antialiased overflow-x-hidden" suppressHydrationWarning>
      <body className="flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <SiteHeader />
        <main className="flex-1 pb-32 sm:pb-0">{children}</main>
        <SiteFooter />
        <WhatsAppHelpFab />
        <MetaPixelPageView />
        {pixelId ? (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
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
