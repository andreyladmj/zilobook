"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider, useTheme, THEMES, type ThemeKey } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { getUser, isLoggedIn, logout, type AuthUser } from "@/lib/auth";
import { fetchSettings } from "@/lib/api";

const NAV_ICONS: Record<string, React.ReactNode> = {
  Overview: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  Calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Clients: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Locations: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Staff: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>,
  Settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
};

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { th, themeId, setThemeId } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setUser(getUser());
    // Load theme from backend settings (persists across sessions)
    fetchSettings()
      .then((s) => {
        if (s.theme && THEMES[s.theme as ThemeKey]) {
          setThemeId(s.theme as ThemeKey);
        }
      })
      .catch(() => {});
  }, [router, setThemeId]);

  const navLinks = [
    { name: "Overview", href: "/dashboard" },
    { name: "Calendar", href: "/dashboard/calendar" },
    { name: "Clients", href: "/dashboard/clients" },
    { name: "Locations", href: "/dashboard/locations" },
    { name: "Staff", href: "/dashboard/staff" },
    { name: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className={clsx("flex flex-col md:flex-row min-h-screen font-sans transition-colors duration-500", th.bg, th.text)}>
      {/* Sidebar */}
      <aside className={clsx(
        "w-full md:w-64 border-r flex flex-col hidden md:flex sticky top-0 h-screen transition-colors duration-500",
        th.cardBg, th.border
      )}>
        {/* Logo */}
        <div className={clsx("px-6 py-5 border-b flex items-center gap-2", th.border)}>
          <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black", th.brand)}>Z</div>
          <span className="text-lg font-bold tracking-tight">Zilo<span className={clsx("font-normal", th.subText)}>book</span></span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive ? th.sidebarActive : th.sidebarHover
                )}
              >
                {NAV_ICONS[link.name]}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Theme Switcher (compact) */}
        <div className={clsx("px-4 py-3 border-t", th.border)}>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(THEMES) as ThemeKey[]).map(t => (
              <button
                key={t}
                onClick={() => setThemeId(t)}
                className={clsx(
                  "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  themeId === t ? th.brand : clsx(th.tabBg, "opacity-60 hover:opacity-100")
                )}
              >
                {THEMES[t].name}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className={clsx("px-4 py-4 border-t", th.border)}>
          <div className="flex items-center gap-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", th.brand)}>
              {user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name || "Loading..."}</p>
              <p className={clsx("text-xs", th.subText)}>{user?.role === "PROFESSIONAL" ? "Pro" : "Client"}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            className={clsx("w-full mt-3 py-2 rounded-xl border text-xs font-bold transition-colors", th.border, th.subText, "hover:opacity-80")}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={clsx(
        "md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 backdrop-blur-md",
        th.cardBg, th.border
      )}>
        <div className="flex items-center gap-2">
          <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black", th.brand)}>Z</div>
          <span className="text-lg font-bold tracking-tight">Zilobook</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={clsx("p-2 rounded-xl", th.tabBg)}
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className={clsx("absolute top-0 right-0 w-72 h-full shadow-2xl flex flex-col", th.cardBg)}>
            <div className={clsx("p-4 border-b flex items-center justify-between", th.border)}>
              <span className="font-bold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className={clsx("p-2 rounded-xl", th.tabBg)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive ? th.sidebarActive : th.sidebarHover
                    )}
                  >
                    {NAV_ICONS[link.name]}
                    {link.name}
                  </Link>
                );
              })}
            </nav>
            <div className={clsx("p-4 border-t", th.border)}>
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                className={clsx("w-full py-3 rounded-xl border text-sm font-bold transition-colors", th.border)}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-h-screen overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardInner>{children}</DashboardInner>
    </ThemeProvider>
  );
}
