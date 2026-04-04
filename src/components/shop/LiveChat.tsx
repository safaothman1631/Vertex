'use client'

import Script from 'next/script'

// Replace TAWK_PROPERTY_ID and TAWK_WIDGET_ID with your Tawk.to IDs from https://dashboard.tawk.to
// Set environment variables NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID
const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
const TAWK_WIDGET_ID   = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID ?? 'default'

export default function LiveChat() {
  if (!TAWK_PROPERTY_ID) return null

  const src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src="${src}";
            s1.charset="UTF-8";
            s1.setAttribute("crossorigin","*");
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  )
}
