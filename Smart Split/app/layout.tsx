import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import PWARegister from "@/src/components/PWARegister";
import BottomNav from "@/src/components/BottomNav";
import FloatingAddExpense from "@/src/components/FloatingAddExpense";
import FloatingSettleUp from "@/src/components/FloatingSettleUp";

export const metadata: Metadata = {
  title: "Smart Split - Split Expenses with Friends",
  description: "Split expenses with friends and groups effortlessly",
  manifest: "/manifest.json",
  themeColor: "#e8eeff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Split",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#e8eeff" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <BottomNav />
          <FloatingSettleUp />
          <FloatingAddExpense />
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}