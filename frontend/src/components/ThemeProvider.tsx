"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  default: {
    name: "Light",
    bg: "bg-gray-50",
    text: "text-gray-900",
    cardBg: "bg-white",
    border: "border-gray-200",
    tabBg: "bg-gray-100",
    activeTab: "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200",
    brand: "bg-gray-900 text-white hover:bg-gray-800",
    headerLine: "border-gray-200",
    subText: "text-gray-500",
    dayCol: "bg-gray-50 text-gray-500",
    slotConfirmed: "bg-gray-900 text-white shadow-md",
    slotPending: "bg-white border-2 border-dashed border-amber-300 text-gray-900",
    slotCancelled: "bg-red-50 border border-red-200 text-red-400 line-through opacity-60",
    monthlyEvent: "bg-gray-100 text-gray-900",
    telLink: "bg-gray-100 hover:bg-gray-200 text-gray-900",
    sidebarActive: "bg-gray-100 text-gray-900 font-semibold",
    sidebarHover: "hover:bg-gray-50 hover:text-gray-900 text-gray-500",
    inputBg: "bg-gray-50",
    inputFocus: "focus:ring-gray-900",
    accent: "text-gray-900",
    accentBg: "bg-gray-900",
    successBg: "bg-emerald-500",
    successText: "text-emerald-600",
    dangerBg: "bg-red-50 hover:bg-red-100 text-red-600",
    pendingBadge: "bg-amber-50 text-amber-600",
    statCard: "bg-white border-gray-100",
    // Public page tokens
    heroBg: "bg-gray-900",
    heroOverlay: "from-gray-900/70 via-gray-900/50 to-gray-50",
    heroText: "text-white",
    heroSubText: "text-white/70",
    headerGlass: "bg-white/80 border-gray-200/60",
    searchInput: "bg-white/95 shadow-2xl shadow-black/10 focus:ring-white/50",
    filterActive: "bg-gray-900 text-white shadow-lg shadow-gray-900/20",
    filterInactive: "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/60",
    cardSurface: "bg-white border-gray-200/60 hover:shadow-xl",
    cardImageOverlay: "from-black/30 to-transparent",
    slotAvailBadge: "bg-emerald-50 text-emerald-600",
    slotBookedBadge: "bg-gray-100 text-gray-500",
    slotDot: "bg-emerald-500",
    todayCircle: "bg-gray-900 text-white",
    weekendText: "text-red-400",
    proCardSelected: "border-gray-900 bg-gray-50 shadow-md",
    proCardDefault: "border-gray-200 bg-white hover:border-gray-300",
    successCircle: "bg-emerald-500 shadow-emerald-500/30",
    infoBox: "bg-amber-50 border-amber-200 text-amber-800",
    avatarBg: "bg-gray-900 text-white",
  },
  fitness: {
    name: "Fitness",
    bg: "bg-gray-950",
    text: "text-gray-100",
    cardBg: "bg-gray-900",
    border: "border-gray-800",
    tabBg: "bg-gray-800/60",
    activeTab: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
    brand: "bg-orange-500 text-white hover:bg-orange-400",
    headerLine: "border-gray-800",
    subText: "text-gray-500",
    dayCol: "bg-gray-900/80 text-gray-500",
    slotConfirmed: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
    slotPending: "bg-transparent border-2 border-dashed border-orange-500/40 text-orange-300",
    slotCancelled: "bg-red-950/30 border border-red-900/50 text-red-400 line-through opacity-60",
    monthlyEvent: "bg-orange-500/15 text-orange-400",
    telLink: "bg-gray-800 hover:bg-gray-700 text-orange-400",
    sidebarActive: "bg-orange-500/15 text-orange-400 border-l-2 border-orange-500",
    sidebarHover: "hover:bg-gray-800/80 hover:text-orange-300 text-gray-500",
    inputBg: "bg-gray-800",
    inputFocus: "focus:ring-orange-500",
    accent: "text-orange-500",
    accentBg: "bg-orange-500",
    successBg: "bg-emerald-500",
    successText: "text-emerald-400",
    dangerBg: "bg-red-950/50 hover:bg-red-900/50 text-red-400",
    pendingBadge: "bg-amber-500/15 text-amber-400",
    statCard: "bg-gray-900 border-gray-800",
    heroBg: "bg-black",
    heroOverlay: "from-black/80 via-black/60 to-gray-950",
    heroText: "text-white",
    heroSubText: "text-orange-200/70",
    headerGlass: "bg-gray-950/80 border-gray-800",
    searchInput: "bg-gray-800/90 shadow-2xl shadow-orange-500/5 focus:ring-orange-500/50 text-gray-100 placeholder:text-gray-500",
    filterActive: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
    filterInactive: "bg-gray-900 text-gray-400 hover:text-orange-400 border border-gray-800",
    cardSurface: "bg-gray-900 border-gray-800 hover:shadow-xl hover:shadow-orange-500/5",
    cardImageOverlay: "from-black/50 to-transparent",
    slotAvailBadge: "bg-orange-500/15 text-orange-400",
    slotBookedBadge: "bg-gray-800 text-gray-500",
    slotDot: "bg-orange-500",
    todayCircle: "bg-orange-500 text-white",
    weekendText: "text-red-400",
    proCardSelected: "border-orange-500 bg-gray-800 shadow-md shadow-orange-500/10",
    proCardDefault: "border-gray-800 bg-gray-900 hover:border-gray-700",
    successCircle: "bg-emerald-500 shadow-emerald-500/30",
    infoBox: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    avatarBg: "bg-orange-500 text-white",
  },
  beauty: {
    name: "Beauty",
    bg: "bg-[#FDF2F8]",
    text: "text-[#831843]",
    cardBg: "bg-white",
    border: "border-pink-200",
    tabBg: "bg-pink-50",
    activeTab: "bg-white text-pink-900 shadow-sm ring-1 ring-pink-200",
    brand: "bg-pink-500 text-white hover:bg-pink-600",
    headerLine: "border-pink-200",
    subText: "text-pink-400",
    dayCol: "bg-pink-50/60 text-pink-400",
    slotConfirmed: "bg-pink-500 text-white shadow-md shadow-pink-500/20",
    slotPending: "bg-transparent border-2 border-dashed border-pink-300 text-pink-800",
    slotCancelled: "bg-red-50 border border-red-200 text-red-400 line-through opacity-60",
    monthlyEvent: "bg-pink-100 text-pink-900",
    telLink: "bg-pink-50 hover:bg-pink-100 text-pink-700",
    sidebarActive: "bg-pink-100 text-pink-900 font-semibold",
    sidebarHover: "hover:bg-pink-50 hover:text-pink-800 text-pink-400",
    inputBg: "bg-pink-50/50",
    inputFocus: "focus:ring-pink-500",
    accent: "text-pink-500",
    accentBg: "bg-pink-500",
    successBg: "bg-violet-500",
    successText: "text-violet-600",
    dangerBg: "bg-red-50 hover:bg-red-100 text-red-500",
    pendingBadge: "bg-amber-50 text-amber-600",
    statCard: "bg-white border-pink-100",
    heroBg: "bg-pink-900",
    heroOverlay: "from-pink-900/70 via-pink-900/40 to-[#FDF2F8]",
    heroText: "text-white",
    heroSubText: "text-pink-200/80",
    headerGlass: "bg-white/80 border-pink-200/60",
    searchInput: "bg-white/95 shadow-2xl shadow-pink-500/5 focus:ring-pink-500/50",
    filterActive: "bg-pink-500 text-white shadow-lg shadow-pink-500/20",
    filterInactive: "bg-white text-pink-400 hover:text-pink-700 border border-pink-200/60",
    cardSurface: "bg-white border-pink-200/60 hover:shadow-xl hover:shadow-pink-500/5",
    cardImageOverlay: "from-pink-900/30 to-transparent",
    slotAvailBadge: "bg-pink-50 text-pink-600",
    slotBookedBadge: "bg-pink-50/50 text-pink-300",
    slotDot: "bg-pink-500",
    todayCircle: "bg-pink-500 text-white",
    weekendText: "text-rose-400",
    proCardSelected: "border-pink-500 bg-pink-50 shadow-md shadow-pink-500/10",
    proCardDefault: "border-pink-200 bg-white hover:border-pink-300",
    successCircle: "bg-violet-500 shadow-violet-500/30",
    infoBox: "bg-pink-50 border-pink-200 text-pink-700",
    avatarBg: "bg-pink-500 text-white",
  },
  service: {
    name: "Auto Service",
    bg: "bg-slate-900",
    text: "text-slate-100",
    cardBg: "bg-slate-800",
    border: "border-slate-700",
    tabBg: "bg-slate-700/50",
    activeTab: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
    brand: "bg-blue-600 text-white hover:bg-blue-500",
    headerLine: "border-slate-700",
    subText: "text-slate-400",
    dayCol: "bg-slate-800/80 text-slate-500",
    slotConfirmed: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
    slotPending: "bg-transparent border-2 border-dashed border-blue-500/40 text-blue-300",
    slotCancelled: "bg-red-950/30 border border-red-900/50 text-red-400 line-through opacity-60",
    monthlyEvent: "bg-blue-500/15 text-blue-300",
    telLink: "bg-slate-700 hover:bg-slate-600 text-blue-400",
    sidebarActive: "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500",
    sidebarHover: "hover:bg-slate-700/80 hover:text-blue-300 text-slate-400",
    inputBg: "bg-slate-700",
    inputFocus: "focus:ring-blue-500",
    accent: "text-blue-500",
    accentBg: "bg-blue-600",
    successBg: "bg-emerald-500",
    successText: "text-emerald-400",
    dangerBg: "bg-red-950/50 hover:bg-red-900/50 text-red-400",
    pendingBadge: "bg-amber-500/15 text-amber-400",
    statCard: "bg-slate-800 border-slate-700",
    heroBg: "bg-slate-950",
    heroOverlay: "from-slate-950/80 via-slate-900/60 to-slate-900",
    heroText: "text-white",
    heroSubText: "text-blue-200/70",
    headerGlass: "bg-slate-900/80 border-slate-700",
    searchInput: "bg-slate-800/90 shadow-2xl shadow-blue-500/5 focus:ring-blue-500/50 text-slate-100 placeholder:text-slate-500",
    filterActive: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
    filterInactive: "bg-slate-800 text-slate-400 hover:text-blue-400 border border-slate-700",
    cardSurface: "bg-slate-800 border-slate-700 hover:shadow-xl hover:shadow-blue-500/5",
    cardImageOverlay: "from-slate-900/50 to-transparent",
    slotAvailBadge: "bg-blue-500/15 text-blue-400",
    slotBookedBadge: "bg-slate-700 text-slate-500",
    slotDot: "bg-blue-500",
    todayCircle: "bg-blue-600 text-white",
    weekendText: "text-red-400",
    proCardSelected: "border-blue-500 bg-slate-700 shadow-md shadow-blue-500/10",
    proCardDefault: "border-slate-700 bg-slate-800 hover:border-slate-600",
    successCircle: "bg-emerald-500 shadow-emerald-500/30",
    infoBox: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    avatarBg: "bg-blue-600 text-white",
  },
  night: {
    name: "Night",
    bg: "bg-[#0A0E27]",
    text: "text-gray-200",
    cardBg: "bg-[#111631]",
    border: "border-[#1E2448]",
    tabBg: "bg-[#161B3D]/60",
    activeTab: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    brand: "bg-indigo-500 text-white hover:bg-indigo-400",
    headerLine: "border-[#1E2448]",
    subText: "text-indigo-400/70",
    dayCol: "bg-[#0D1130]/80 text-indigo-400/50",
    slotConfirmed: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    slotPending: "bg-transparent border-2 border-dashed border-indigo-500/30 text-indigo-300",
    slotCancelled: "bg-red-950/30 border border-red-900/40 text-red-400 line-through opacity-60",
    monthlyEvent: "bg-indigo-500/15 text-indigo-300",
    telLink: "bg-[#161B3D] hover:bg-[#1E2448] text-indigo-400",
    sidebarActive: "bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-500",
    sidebarHover: "hover:bg-[#161B3D] hover:text-indigo-300 text-gray-500",
    inputBg: "bg-[#161B3D]",
    inputFocus: "focus:ring-indigo-500",
    accent: "text-indigo-400",
    accentBg: "bg-indigo-500",
    successBg: "bg-emerald-500",
    successText: "text-emerald-400",
    dangerBg: "bg-red-950/40 hover:bg-red-900/40 text-red-400",
    pendingBadge: "bg-amber-500/15 text-amber-400",
    statCard: "bg-[#111631] border-[#1E2448]",
    heroBg: "bg-[#050819]",
    heroOverlay: "from-[#050819]/80 via-[#0A0E27]/60 to-[#0A0E27]",
    heroText: "text-white",
    heroSubText: "text-indigo-300/70",
    headerGlass: "bg-[#0A0E27]/80 border-[#1E2448]",
    searchInput: "bg-[#161B3D]/90 shadow-2xl shadow-indigo-500/5 focus:ring-indigo-500/50 text-gray-200 placeholder:text-gray-500",
    filterActive: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    filterInactive: "bg-[#111631] text-gray-500 hover:text-indigo-400 border border-[#1E2448]",
    cardSurface: "bg-[#111631] border-[#1E2448] hover:shadow-xl hover:shadow-indigo-500/5",
    cardImageOverlay: "from-[#0A0E27]/50 to-transparent",
    slotAvailBadge: "bg-indigo-500/15 text-indigo-400",
    slotBookedBadge: "bg-[#161B3D] text-gray-500",
    slotDot: "bg-indigo-500",
    todayCircle: "bg-indigo-500 text-white",
    weekendText: "text-red-400",
    proCardSelected: "border-indigo-500 bg-[#161B3D] shadow-md shadow-indigo-500/10",
    proCardDefault: "border-[#1E2448] bg-[#111631] hover:border-indigo-500/30",
    successCircle: "bg-emerald-500 shadow-emerald-500/30",
    infoBox: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    avatarBg: "bg-indigo-500 text-white",
  }
};

export type ThemeKey = keyof typeof THEMES;

// Public booking pages theme by the location's type, not by visitor preference.
const LOCATION_TYPE_THEMES: Record<string, ThemeKey> = {
  Gym: "fitness",
  Saloon: "beauty",
  Station: "service",
};

export function themeForLocationType(type: string | undefined): ThemeKey {
  return (type && LOCATION_TYPE_THEMES[type]) || "default";
}

interface ThemeContextType {
  themeId: ThemeKey;
  setThemeId: (t: ThemeKey) => void;
  th: typeof THEMES["default"];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// persist=true (dashboard): theme is a user preference stored in localStorage.
// persist=false (public booking pages): theme is derived from data, localStorage untouched.
export function ThemeProvider({ children, persist = true }: { children: React.ReactNode; persist?: boolean }) {
  const [themeId, setThemeId] = useState<ThemeKey>("default");

  useEffect(() => {
    if (!persist) return;
    const stored = localStorage.getItem("zilobook-theme") as ThemeKey;
    if (stored && THEMES[stored]) {
      setThemeId(stored);
    }
  }, [persist]);

  const handleSetTheme = (t: ThemeKey) => {
    setThemeId(t);
    if (persist) {
      localStorage.setItem("zilobook-theme", t);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId: handleSetTheme, th: THEMES[themeId] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
