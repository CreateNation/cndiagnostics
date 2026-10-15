"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { getAnalyticsIds, hasAnyAnalytics } from "@/lib/analytics/config";
import { captureAttribution, trackPageView } from "@/lib/analytics/track";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    const path =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (lastPath.current === path) return;
    lastPath.current = path;
    trackPageView(pathname);
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  const ids = getAnalyticsIds();
  if (!hasAnyAnalytics(ids)) return null;

  return (
    <>
      {/* Google Tag Manager */}
      {ids.gtmId ? (
        <>
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${ids.gtmId}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${ids.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {/* gtag.js for GA4 and/or Google Ads when GTM is not used (or as parallel) */}
      {(ids.ga4Id || ids.googleAdsId) && !ids.gtmId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ids.ga4Id || ids.googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${ids.ga4Id ? `gtag('config', '${ids.ga4Id}', { send_page_view: false });` : ""}
            ${ids.googleAdsId ? `gtag('config', '${ids.googleAdsId}');` : ""}
          `}</Script>
        </>
      ) : null}

      {/* When GTM is present, still init gtag helpers if direct IDs are set */}
      {(ids.ga4Id || ids.googleAdsId) && ids.gtmId ? (
        <Script id="gtag-bridge" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          ${ids.ga4Id ? `gtag('config', '${ids.ga4Id}', { send_page_view: false });` : ""}
          ${ids.googleAdsId ? `gtag('config', '${ids.googleAdsId}');` : ""}
        `}</Script>
      ) : null}

      {/* Meta Pixel — only when GTM is absent. Prefer GTM as sole Meta sender. */}
      {ids.metaPixelId && !ids.gtmId ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${ids.metaPixelId}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}

      {/* TikTok Pixel */}
      {ids.tiktokPixelId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
            ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
            var a=document.createElement("script");a.type="text/javascript";a.async=!0;a.src=r+"?sdkid="+e+"&lib="+t;
            var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
            ttq.load('${ids.tiktokPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
      ) : null}

      {/* LinkedIn Insight Tag */}
      {ids.linkedInPartnerId ? (
        <Script id="linkedin-insight" strategy="afterInteractive">{`
          _linkedin_partner_id = "${ids.linkedInPartnerId}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `}</Script>
      ) : null}

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
