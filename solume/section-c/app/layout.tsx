import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dialysis Mortality Analysis",
  description: "CMS Dialysis Facility Mortality Rate Analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">Dialysis Mortality</span>
                <span className="text-xs text-gray-400 hidden sm:inline">CMS Facility Data</span>
              </div>
              <nav className="flex gap-1">
                <Link
                  href="/"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Summary
                </Link>
                <Link
                  href="/analysis"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Analysis
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="mt-16 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          Data source: CMS Dialysis Facility Compare · Updated hourly
        </footer>
      </body>
    </html>
  );
}
