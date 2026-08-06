"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isIosUserAgent, isStandaloneDisplay, pwaRegistrationEnabled } from "./state";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextValue {
  canInstall: boolean;
  install(): Promise<boolean>;
  installed: boolean;
  isIos: boolean;
  supported: boolean;
}

const PwaContext = createContext<PwaContextValue>({ canInstall: false, install: async () => false, installed: false, isIos: false, supported: false });

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [supported, setSupported] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setSupported("serviceWorker" in navigator);
    setIsIos(isIosUserAgent(navigator.userAgent));
    setInstalled(isStandaloneDisplay(window.matchMedia("(display-mode: standalone)").matches, (navigator as Navigator & { standalone?: boolean }).standalone));

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    const handleInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (pwaRegistrationEnabled(process.env.NODE_ENV, process.env.NEXT_PUBLIC_ENABLE_PWA) && "serviceWorker" in navigator) {
      const inspectRegistration = (registration: ServiceWorkerRegistration) => {
        if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker);
          });
        });
      };
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
        inspectRegistration(registration);
        void registration.update();
      }).catch((error) => console.error("SafeSpend service worker registration failed", error));
      const handleControllerChange = () => { if (reloadForUpdate.current) window.location.reload(); };
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
        window.removeEventListener("appinstalled", handleInstalled);
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      };
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome === "accepted";
  }, [installPrompt]);

  const applyUpdate = () => {
    if (!waitingWorker) return;
    reloadForUpdate.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };
  const value = useMemo(() => ({ canInstall: installPrompt !== null, install, installed, isIos, supported }), [installPrompt, install, installed, isIos, supported]);

  return <PwaContext.Provider value={value}>
    {!online && <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950" role="status">You are offline. SafeSpend does not store financial pages or submit changes offline.</div>}
    {waitingWorker && <div className="flex items-center justify-center gap-3 bg-blue-50 px-4 py-2 text-sm text-blue-950" role="status"><span>A new SafeSpend version is available.</span><Button onClick={applyUpdate} size="sm" variant="outline">Update now</Button></div>}
    {children}
  </PwaContext.Provider>;
}
