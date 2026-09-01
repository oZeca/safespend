import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { appearanceBootScript } from "@/components/appearance-provider";

export const metadata: Metadata = {
  title: "SafeSpend",
  description: "Private personal finance",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SafeSpend" },
  icons: {
    icon: "/icons/safespend.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4e8" },
    { media: "(prefers-color-scheme: dark)", color: "#171714" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} /></head><body><AppShell>{children}</AppShell></body></html>;
}
