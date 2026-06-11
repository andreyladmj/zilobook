"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { fetchLocation, type Location } from "@/lib/api";

const FALLBACK_IMAGES: Record<string, string> = {
  Gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  Saloon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  Station: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
};

function LocationInner({ id }: { id: string }) {
  const router = useRouter();
  const { th } = useTheme();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchLocation(id)
      .then(setLocation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={clsx("min-h-screen flex items-center justify-center", th.bg)}>
        <div className={clsx("w-10 h-10 border-4 rounded-full animate-spin", th.border, "border-t-current")}></div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className={clsx("min-h-screen flex flex-col items-center justify-center gap-6 p-4", th.bg, th.text)}>
        <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center", th.tabBg)}>
          <svg className={clsx("w-8 h-8", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        </div>
        <p className={clsx("font-semibold text-lg", th.subText)}>{error || "Location not found"}</p>
        <button onClick={() => router.push("/explore")} className={clsx("px-6 py-3 rounded-xl font-bold text-sm", th.brand)}>Back to Explore</button>
      </div>
    );
  }

  const images = location.images?.length > 0
    ? location.images.map(img => img.image_url)
    : [FALLBACK_IMAGES[location.type] || FALLBACK_IMAGES.Gym];
  const pros = location.professionals || [];

  return (
    <div className={clsx("min-h-screen font-sans transition-colors duration-500", th.bg, th.text)}>
      {/* Header */}
      <header className={clsx("fixed top-0 w-full z-50 backdrop-blur-xl border-b px-4 py-3", th.headerGlass)}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border transition-colors shadow-sm", th.cardBg, th.border)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black", th.brand)}>Z</div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Zilobook</span>
          </Link>
          <Link href="/explore" className={clsx("text-sm font-bold transition-colors", th.subText)}>Explore</Link>
        </div>
      </header>

      {/* Hero Image */}
      <div className="pt-[56px]">
        <div className="relative h-[50vh] md:h-[60vh] max-h-[600px] overflow-hidden">
          <img src={images[activeImage]} alt={location.name} className="w-full h-full object-cover transition-all duration-700" />
          <div className={clsx("absolute inset-0 bg-gradient-to-t", th.heroOverlay)}></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <h1 className={clsx("text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]", th.heroText)}>{location.name}</h1>
              <div className={clsx("flex items-center gap-2 mt-3", th.heroSubText)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-sm font-medium">{location.address}</span>
              </div>
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={clsx("w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border-2 transition-all", activeImage === i ? "border-white shadow-lg scale-105" : "border-white/40 opacity-70 hover:opacity-100")}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-6 relative z-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className={clsx("rounded-3xl p-6 md:p-8 shadow-sm border", th.cardBg, th.border)}>
              <h2 className="text-xl font-bold mb-4">About this location</h2>
              <p className={clsx("text-base leading-relaxed", th.subText)}>
                {location.description || (
                  location.type === "Gym" ? "A professional fitness center offering a wide range of training options. Book sessions with certified trainers and start your fitness journey today."
                  : location.type === "Saloon" ? "A modern beauty salon providing premium services from experienced specialists. Treat yourself to professional care in a relaxing atmosphere."
                  : "A trusted auto service station with experienced mechanics. From routine maintenance to complex repairs, your vehicle is in expert hands."
                )}
              </p>
              <div className={clsx("grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t", th.border)}>
                {[
                  { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", label: "Address", value: location.address.split(",")[0] },
                  { icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z", label: "Staff", value: `${pros.length} pro${pros.length !== 1 ? "s" : ""}` },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Hours", value: "Mon — Sat" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", th.tabBg)}>
                      <svg className={clsx("w-5 h-5", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon}/></svg>
                    </div>
                    <div>
                      <p className={clsx("text-[11px] font-bold uppercase tracking-wider", th.subText)}>{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professionals */}
            {pros.length > 0 && (
              <div className={clsx("rounded-3xl p-6 md:p-8 shadow-sm border", th.cardBg, th.border)}>
                <h2 className="text-xl font-bold mb-6">Professionals</h2>
                <div className="space-y-4">
                  {pros.map(pro => (
                    <div key={pro.id} className={clsx("flex items-center justify-between p-4 rounded-2xl border transition-all", th.border)}>
                      <div className="flex items-center gap-4">
                        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center font-bold overflow-hidden", th.tabBg)}>
                          {pro.profile_image_url ? <img src={pro.profile_image_url} alt={pro.full_name} className="w-full h-full object-cover" /> : <span className="text-lg">{pro.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>}
                        </div>
                        <div>
                          <h4 className="font-bold text-base">{pro.full_name}</h4>
                          <p className={clsx("text-sm font-medium", th.subText)}>{pro.role_description || "Professional"}</p>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/location/${location.id}/book`)} className={clsx("px-5 py-2.5 font-bold rounded-xl text-sm transition-all flex-shrink-0", th.brand)}>Book</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className={clsx("rounded-3xl p-6 shadow-sm border sticky top-20", th.cardBg, th.border)}>
              <h3 className="font-bold text-lg mb-2">Ready to book?</h3>
              <p className={clsx("text-sm mb-6", th.subText)}>Choose a time that works for you and book your appointment in seconds.</p>
              <button onClick={() => router.push(`/location/${location.id}/book`)} className={clsx("w-full py-4 text-white font-bold rounded-2xl text-base shadow-lg transition-all hover:-translate-y-0.5", th.accentBg)}>
                View Available Slots
              </button>
              <a href="tel:+1999888777" className={clsx("mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold text-sm transition-colors", th.border, th.subText)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                Call Front Desk
              </a>
            </div>
            {images.length > 1 && (
              <div className={clsx("rounded-3xl p-6 shadow-sm border", th.cardBg, th.border)}>
                <h3 className={clsx("font-bold text-sm uppercase tracking-wider mb-4", th.subText)}>Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={clsx("rounded-xl overflow-hidden aspect-square border-2 transition-all", activeImage === i ? "border-current shadow-md" : "border-transparent opacity-70 hover:opacity-100")}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile CTA */}
      <div className={clsx("lg:hidden fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl border-t z-30 flex gap-3", th.headerGlass)}>
        <a href="tel:+1999888777" className={clsx("w-14 h-14 flex items-center justify-center rounded-2xl transition-colors flex-shrink-0", th.tabBg)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </a>
        <button onClick={() => router.push(`/location/${location.id}/book`)} className={clsx("flex-1 py-4 text-white font-bold rounded-2xl text-base shadow-lg transition-all", th.accentBg)}>Book Appointment</button>
      </div>
    </div>
  );
}

export default function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ThemeProvider><LocationInner id={id} /></ThemeProvider>;
}
