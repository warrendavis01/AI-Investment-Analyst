"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, History } from "lucide-react";

export default function NavBar() {
  const path = usePathname();
  const isHistory = path === "/history";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2f4a] bg-[#0d0f1a]/90 backdrop-blur px-6 py-3 flex items-center gap-6">
      <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity">
        <TrendingUp className="w-5 h-5 text-brand-500" />
        AI Analyst
      </Link>

      <div className="flex items-center gap-1 ml-auto">
        <Link
          href="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${!isHistory ? "bg-[#1e2235] text-white" : "text-gray-400 hover:text-white"}`}
        >
          Analyze
        </Link>
        <Link
          href="/history"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${isHistory ? "bg-[#1e2235] text-white" : "text-gray-400 hover:text-white"}`}
        >
          <History className="w-4 h-4" />
          History
        </Link>
      </div>
    </nav>
  );
}
