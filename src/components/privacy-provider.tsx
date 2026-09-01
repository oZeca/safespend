"use client";

import { Eye, EyeOff } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const storageKey = "safespend-hide-sensitive-values";
const PrivacyContext = createContext<{ hidden: boolean; toggle: () => void } | null>(null);

export function PrivacyProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(window.localStorage.getItem(storageKey) === "true");
  }, []);

  function toggle() {
    setHidden((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return <PrivacyContext.Provider value={{ hidden, toggle }}><div data-privacy={hidden ? "hidden" : "visible"}>{children}</div></PrivacyContext.Provider>;
}

export function PrivacyToggle({ compact = false }: { compact?: boolean }) {
  const privacy = useContext(PrivacyContext);
  if (!privacy) throw new Error("PrivacyToggle must be rendered inside PrivacyProvider.");
  const { hidden, toggle } = privacy;
  return <Button
    aria-pressed={hidden}
    className="h-9 shrink-0 px-2"
    onClick={toggle}
    title={hidden ? "Show sensitive amounts" : "Hide sensitive amounts"}
    type="button"
    variant="outline"
  >
    {hidden ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}
    <span className={compact ? "sr-only" : "ml-2"}>{hidden ? "Show sensitive amounts" : "Hide sensitive amounts"}</span>
  </Button>;
}
