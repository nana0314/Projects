"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PageNav() {
  const pathname = usePathname();
  const isAnalysis = pathname === "/analysis";

  const base = "px-4 py-1 rounded-full text-sm font-medium transition-colors";
  const active = "bg-blue-600 text-white shadow-sm";
  const inactive = "bg-gray-100 text-gray-500 hover:bg-gray-200";

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
      <Link href="/" className={`${base} ${!isAnalysis ? active : inactive}`}>
        Summary
      </Link>
      <Link href="/analysis" className={`${base} ${isAnalysis ? active : inactive}`}>
        Analysis
      </Link>
    </div>
  );
}
