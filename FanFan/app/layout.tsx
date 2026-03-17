import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { FilterProvider } from "@/src/context/FilterContext";
import BottomNav from "@/src/components/BottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export const metadata: Metadata = {
  title: "FanFan - Recipe Swipe",
  description: "Discover recipes by swiping. Save to Meal Packs.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FanFan",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
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
      </head>
      <body className="antialiased pb-20">
        <AuthProvider>
          <FilterProvider>
            {children}
            <BottomNav />
          </FilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
