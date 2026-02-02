"use client";

import { useEffect, useState } from "react";
import CustomerDesktop from "./CustomerDesktop";
import CustomerMobile from "./CustomerMobile";

function isMobileOrIPad(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;

  const ua = (navigator.userAgent || "").toLowerCase();

  // Vanliga mobiler
  const isPhoneOrAndroid = /iphone|ipod|android|iemobile|opera mini/.test(ua);

  // Klassisk iPad user agent
  const isIPadUA = /ipad/.test(ua);

  // iPadOS 13+ kan rapportera "Macintosh", men har touch
  const isIPadOS = /macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;

  // Extra fallback: om användaren kör "desktop mode" i mobilen/iPad
  // 1024px täcker de flesta iPads i både portrait/landscape.
  const isSmallishScreen = window.matchMedia("(max-width: 1024px)").matches;

  return isPhoneOrAndroid || isIPadUA || isIPadOS || isSmallishScreen;
}

export default function CustomerResponsive() {
  const [mobileLike, setMobileLike] = useState(false);

  useEffect(() => {
    const update = () => setMobileLike(isMobileOrIPad());
    update();

    // Uppdatera vid rotation/resizing
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mobileLike ? <CustomerMobile /> : <CustomerDesktop />;
}
