import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { sendHit } from "@/lib/analytics";

const PING_INTERVAL_MS = 2 * 60 * 1000;

// Envoie une page vue à chaque changement de page, et un signal de présence tant que l'onglet est affiché
const PageViewTracker = () => {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
    sendHit("pageview", pathname);
  }, [pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") sendHit("ping", pathRef.current);
    }, PING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
};

export default PageViewTracker;
