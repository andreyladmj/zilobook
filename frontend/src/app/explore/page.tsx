"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { fetchLocations, type Location } from "@/lib/api";

const FALLBACK_IMAGES: Record<string, string> = {
  Gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  Saloon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  Station: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
};

const FILTER_OPTIONS = [
  { key: "All", label: "All Places" },
  { key: "Gym", label: "Fitness & Gyms" },
  { key: "Saloon", label: "Beauty & Salons" },
  { key: "Station", label: "Auto Service" },
];

function ExploreInner() {
  const router = useRouter();
  const { th } = useTheme();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchLocations({ type: filter !== "All" ? filter : undefined, search: search || undefined })
        .then((data) => setLocations(data.locations || []))
        .catch(() => setLocations([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [filter, search]);

  const getImage = (loc: Location) =>
    loc.images?.length > 0 ? loc.images[0].image_url : FALLBACK_IMAGES[loc.type] || FALLBACK_IMAGES.Gym;

  return (
    <div className={clsx("min-h-screen font-sans transition-colors duration-500", th.bg, th.text)}>
      {/* Header */}
      <header className={clsx("sticky top-0 backdrop-blur-xl border-b z-30 px-6 py-3", th.headerGlass)}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black", th.brand)}>Z</div>
            <span className="text-lg font-bold tracking-tight">Zilo<span className={th.subText}>book</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className={clsx("text-sm font-bold transition-colors", th.subText)}>Sign In</Link>
            <Link href="/register" className={clsx("text-sm font-bold px-4 py-2 rounded-xl transition-colors hidden sm:block", th.brand)}>Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className={clsx("absolute inset-0 bg-gradient-to-b", th.heroOverlay)}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-28 md:pb-40">
          <div className="max-w-3xl">
            <h1 className={clsx("text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]", th.heroText)}>
              Find & book<br /><span className="opacity-50">local professionals</span>
            </h1>
            <p className={clsx("text-lg md:text-xl font-medium mt-6 max-w-xl", th.heroSubText)}>
              Discover gyms, beauty salons, and auto service stations near you. Book appointments directly with independent professionals.
            </p>
          </div>
          <div className="mt-10 max-w-2xl">
            <div className="relative">
              <svg className={clsx("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gyms, salons, auto shops..."
                className={clsx("w-full pl-14 pr-6 py-5 rounded-2xl border-0 backdrop-blur-md text-base font-medium", th.searchInput)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="-mt-8 relative z-20 max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={clsx("px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm",
                filter === opt.key ? th.filterActive : th.filterInactive
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        {loading ? (
          <div className="text-center py-24">
            <div className={clsx("w-10 h-10 border-4 rounded-full animate-spin mx-auto", th.border, "border-t-current")}></div>
            <p className={clsx("font-semibold mt-4", th.subText)}>Loading locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
              <svg className={clsx("w-8 h-8", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <p className={clsx("font-semibold text-lg", th.subText)}>No locations found</p>
            <p className={clsx("text-sm max-w-md mx-auto", th.subText)}>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations.map(loc => (
              <div
                key={loc.id}
                onClick={() => router.push(`/location/${loc.id}`)}
                className={clsx("group cursor-pointer rounded-3xl overflow-hidden border shadow-sm hover:-translate-y-1 transition-all duration-400", th.cardSurface)}
              >
                <div className="h-52 w-full overflow-hidden relative">
                  <img src={getImage(loc)} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className={clsx("absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-400", th.cardImageOverlay)}></div>
                  {loc.images?.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      {loc.images.length}
                    </div>
                  )}
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-lg font-bold tracking-tight">{loc.name}</h3>
                  <div className={clsx("flex items-center gap-1.5 mt-2", th.subText)}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="text-sm truncate">{loc.address}</span>
                  </div>
                  {loc.description && <p className={clsx("text-sm mt-3 line-clamp-2", th.subText)}>{loc.description}</p>}
                  {loc.professionals && loc.professionals.length > 0 && (
                    <div className={clsx("flex items-center gap-2 mt-4 pt-4 border-t", th.border)}>
                      <div className="flex -space-x-2">
                        {loc.professionals.slice(0, 3).map((pro, i) => (
                          <div key={pro.id} className={clsx("w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold", th.cardBg, th.tabBg, th.border)} style={{ zIndex: 3 - i }}>
                            {pro.profile_image_url ? <img src={pro.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" /> : pro.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span className={clsx("text-xs font-semibold", th.subText)}>{loc.professionals.length} professional{loc.professionals.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className={clsx("border-t py-10 text-center", th.border)}>
        <p className={clsx("text-sm font-medium", th.subText)}>Zilobook — Booking for independent professionals</p>
      </footer>
    </div>
  );
}

export default function ExplorePage() {
  return <ThemeProvider><ExploreInner /></ThemeProvider>;
}
