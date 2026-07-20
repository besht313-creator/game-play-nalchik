// Analytics configuration.
//
// Fill in your tracking IDs below once you have them — everything else
// (cookie consent gating, script injection) is already wired up, so
// analytics will start working automatically as soon as an ID is set.
// Leave a value empty ("") to keep that provider disabled.
export const YANDEX_METRIKA_ID = ""; // e.g. "12345678" — from metrika.yandex.ru
export const GA_MEASUREMENT_ID = ""; // e.g. "G-XXXXXXXXXX" — from Google Analytics

const CONSENT_KEY = "cookie_consent";
export type CookieConsentValue = "accepted" | "declined";

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function setCookieConsent(value: CookieConsentValue) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, value);
  if (value === "accepted") loadAnalytics();
}

let analyticsLoaded = false;

// Injects Yandex.Metrika and/or Google Analytics, but only if the visitor
// has accepted cookies AND a tracking ID is configured above. Safe to call
// multiple times — it only ever injects the scripts once per page load.
export function loadAnalytics() {
  if (analyticsLoaded || typeof window === "undefined") return;
  if (getCookieConsent() !== "accepted") return;
  analyticsLoaded = true;

  if (YANDEX_METRIKA_ID) {
    const ymScript = document.createElement("script");
    ymScript.innerHTML = `
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(${YANDEX_METRIKA_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });
    `;
    document.head.appendChild(ymScript);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}" style="position:absolute;left:-9999px" alt="" /></div>`;
    document.body.appendChild(noscript);
  }

  if (GA_MEASUREMENT_ID) {
    const gtagLoader = document.createElement("script");
    gtagLoader.async = true;
    gtagLoader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gtagLoader);

    const gtagInit = document.createElement("script");
    gtagInit.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
    `;
    document.head.appendChild(gtagInit);
  }
}
