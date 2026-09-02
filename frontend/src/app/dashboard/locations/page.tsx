"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { fetchMyLocations, type Location } from "@/lib/api";

export default function LocationsPage() {
  const router = useRouter();
  const { th } = useTheme();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLocations()
      .then((data) => setLocations(data.locations || []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 relative pb-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Локації</h1>
          <p className={clsx("mt-1 font-medium", th.subText)}>Адреси, за якими ви надаєте послуги.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/locations/new')}
          className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm transition-colors", th.brand)}
        >
           + Додати локацію
        </button>
      </div>

      {loading ? (
        <div className={clsx("text-center py-20 font-semibold", th.subText)}>Завантаження...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className={clsx("font-semibold", th.subText)}>Локацій поки немає.</p>
          <button
            onClick={() => router.push('/dashboard/locations/new')}
            className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm", th.brand)}
          >
            Додати першу локацію
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {locations.map(loc => (
              <div key={loc.id} className={clsx("rounded-2xl border shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md group", th.cardBg, th.border)}>
                 <div className={clsx("h-48 flex items-center justify-center relative", th.tabBg)}>
                    {loc.images?.length > 0 ? (
                      <img src={loc.images[0].image_url} alt={loc.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={clsx("font-bold text-sm uppercase tracking-widest px-4 py-2 border-2 border-dashed rounded-lg", th.border, th.subText)}>Без фото</span>
                    )}
                 </div>
                 <div className="p-5">
                    <h3 className="font-bold text-xl">{loc.name}</h3>
                    <p className={clsx("mt-1 text-sm", th.subText)}>{loc.address}</p>
                    <div className="mt-4 flex items-center gap-2">
                       <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-lg uppercase", th.tabBg)}>{loc.type}</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
}
