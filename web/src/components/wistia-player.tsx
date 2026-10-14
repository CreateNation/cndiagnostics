"use client";

import Script from "next/script";
import { createElement } from "react";

const MEDIA_ID = "tsdwi4hb39";

export function WistiaEmbed() {
  return (
    <>
      <Script
        src="https://fast.wistia.com/player.js"
        strategy="afterInteractive"
      />
      <Script
        src={`https://fast.wistia.com/embed/${MEDIA_ID}.js`}
        strategy="afterInteractive"
        type="module"
      />
      <style>{`
        wistia-player[media-id='${MEDIA_ID}']:not(:defined) {
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${MEDIA_ID}/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 56.25%;
        }
      `}</style>
      {createElement("wistia-player", {
        "media-id": MEDIA_ID,
        aspect: "1.7777777777777777",
        autoplay: true,
        "silent-autoplay": "allow",
        className: "block w-full",
      })}
    </>
  );
}
