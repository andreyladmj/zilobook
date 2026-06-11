"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import SearchList, { type SearchListResult } from "@/components/SearchList";
import { searchProfessionals, fetchMyLocations, linkProfessionalToLocations, type ProfessionalSearchResult, type Location } from "@/lib/api";

export default function NewStaffPage() {
  const router = useRouter();
  const { th } = useTheme();
  const [selected, setSelected] = useState<ProfessionalSearchResult | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [checkedLocations, setCheckedLocations] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMyLocations()
      .then(data => setLocations(data.locations || []))
      .catch(() => {});
  }, []);

  const fetcher = useCallback(async (query: string, page: number, perPage: number): Promise<SearchListResult<ProfessionalSearchResult>> => {
    const data = await searchProfessionals(query || undefined, page, perPage);
    return { items: data.professionals || [], total: data.total, page: data.page, per_page: data.per_page };
  }, []);

  const toggleLocation = (id: string) => {
    setCheckedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLink = async () => {
    if (!selected || checkedLocations.size === 0) return;
    setLinking(true);
    setError("");
    try {
      await linkProfessionalToLocations(selected.id, Array.from(checkedLocations));
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/staff"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto min-h-screen p-4 md:p-10 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:opacity-80", th.cardBg, th.border, th.text)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Link Professional</h1>
      </div>

      <div className={clsx("rounded-2xl border shadow-sm p-6 md:p-8 space-y-8", th.cardBg, th.border)}>
        {/* Info */}
        <div className={clsx("p-4 rounded-xl border", th.infoBox)}>
          <p className="text-sm font-medium">Search for a registered Zilobook professional by name, phone, or email. Then assign them to your locations.</p>
        </div>

        {/* Success */}
        {success && (
          <div className={clsx("p-4 rounded-xl text-sm text-center font-semibold", th.successText, "bg-emerald-500/10 border border-emerald-500/20")}>
            Professional linked successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">{error}</div>
        )}

        {/* Selected Professional */}
        {selected ? (
          <div className="space-y-6">
            <div>
              <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Selected Professional</p>
              <div className={clsx("flex items-center gap-4 p-4 rounded-xl border-2", th.border)}>
                <div className={clsx("w-14 h-14 rounded-xl flex items-center justify-center font-bold overflow-hidden flex-shrink-0", th.tabBg)}>
                  {selected.profile_image_url ? (
                    <img src={selected.profile_image_url} alt={selected.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={clsx("text-lg", th.accent)}>{selected.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{selected.full_name}</p>
                  <p className={clsx("text-sm", th.subText)}>{selected.phone || selected.email || "Professional"}</p>
                </div>
                <button onClick={() => { setSelected(null); setCheckedLocations(new Set()); setError(""); setSuccess(false); }} className={clsx("p-2 rounded-xl transition-colors", th.tabBg)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Location Assignment */}
            <div className={clsx("pt-6 border-t", th.border)}>
              <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-4", th.subText)}>Assign to Locations</p>
              {locations.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className={clsx("text-sm", th.subText)}>You don&apos;t have any locations yet.</p>
                  <button onClick={() => router.push("/dashboard/locations/new")} className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm", th.brand)}>
                    Create a Location First
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map(loc => (
                    <label
                      key={loc.id}
                      className={clsx(
                        "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                        checkedLocations.has(loc.id) ? clsx(th.tabBg, "border-current") : th.border
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checkedLocations.has(loc.id)}
                        onChange={() => toggleLocation(loc.id)}
                        className="w-5 h-5 rounded accent-current"
                      />
                      <div>
                        <span className="font-semibold text-sm">{loc.name}</span>
                        <span className={clsx("block text-xs", th.subText)}>{loc.address}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleLink}
              disabled={checkedLocations.size === 0 || linking || success}
              className={clsx("w-full py-4 rounded-xl font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2", th.brand)}
            >
              {linking ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Linking...</>
              ) : success ? (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Linked!</>
              ) : (
                `Link to ${checkedLocations.size} Location${checkedLocations.size !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        ) : (
          /* Search Mode */
          <div>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Find Professional</p>
            <SearchList<ProfessionalSearchResult>
              placeholder="Search by name, phone, or email..."
              perPage={10}
              fetcher={fetcher}
              renderItem={(pro) => (
                <button
                  key={pro.id}
                  onClick={() => setSelected(pro)}
                  className={clsx(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-sm",
                    th.border
                  )}
                >
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center font-bold overflow-hidden flex-shrink-0", th.tabBg)}>
                    {pro.profile_image_url ? (
                      <img src={pro.profile_image_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={clsx("text-sm", th.accent)}>{pro.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{pro.full_name}</p>
                    <p className={clsx("text-xs truncate", th.subText)}>{pro.phone || pro.email || "Professional"}</p>
                  </div>
                  <svg className={clsx("w-5 h-5 flex-shrink-0", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
