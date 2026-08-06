"use client";

import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "./pwa-provider";

export function InstallPwaCard() {
  const { canInstall, install, installed, isIos, supported } = usePwa();
  let description = "Use your browser menu to install SafeSpend when supported.";
  if (installed) description = "SafeSpend is installed on this device.";
  else if (canInstall) description = "Install SafeSpend for a home-screen icon and standalone app window.";
  else if (isIos) description = "In Safari, tap Share, then Add to Home Screen.";
  else if (!supported) description = "This browser does not support installing SafeSpend as an app.";

  return <section className="rounded-xl border bg-card p-5 shadow-sm">
    <Smartphone className="h-6 w-6 text-primary" />
    <h2 className="mt-3 text-lg font-semibold">Install SafeSpend</h2>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    <p className="mt-2 text-xs text-muted-foreground">Offline mode shows only a connection screen; financial data is never cached.</p>
    {canInstall && !installed && <Button className="mt-5" onClick={() => void install()}><Download className="mr-2 h-4 w-4" />Install app</Button>}
  </section>;
}
