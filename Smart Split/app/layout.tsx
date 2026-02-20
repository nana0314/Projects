import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import PWARegister from "@/src/components/PWARegister";
import BottomNav from "@/src/components/BottomNav";
import FloatingAddExpense from "@/src/components/FloatingAddExpense";
import AIChatBubble from "@/src/components/AIChatBubble";
import { ThemeProvider } from "@/src/context/ThemeContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e8eeff",
};

export const metadata: Metadata = {
  title: "Smart Split - Split Expenses with Friends",
  description: "Split expenses with friends and groups effortlessly",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Split",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Analytics />
            <SpeedInsights />
            <BottomNav />
            <FloatingAddExpense />
            <AIChatBubble />
            <PWARegister />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}