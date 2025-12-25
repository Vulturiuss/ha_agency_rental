"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/locations", label: "Locations" },
  { href: "/expenses", label: "Charges" },
  { href: "/settings", label: "Parametres" },
];

export function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex flex-wrap items-center gap-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <button
              key={link.href}
              onClick={() => startTransition(() => router.push(link.href))}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${pending ? "opacity-70" : ""}`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
