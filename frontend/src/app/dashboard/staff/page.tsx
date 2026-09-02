"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import SearchList, { type SearchListResult } from "@/components/SearchList";
import { fetchMyStaff, type ProfessionalSearchResult } from "@/lib/api";

export default function StaffPage() {
  const router = useRouter();
  const { th } = useTheme();

  const fetcher = useCallback(async (query: string, page: number, perPage: number): Promise<SearchListResult<ProfessionalSearchResult>> => {
    const data = await fetchMyStaff(query || undefined, page, perPage);
    return { items: data.professionals || [], total: data.total, page: data.page, per_page: data.per_page };
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 relative pb-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Команда</h1>
          <p className={clsx("mt-1 font-medium", th.subText)}>Майстри, прив&apos;язані до ваших локацій.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/staff/new')}
          className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2", th.brand)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Додати майстра
        </button>
      </div>

      {/* Search + Trainer Cards */}
      <SearchList<ProfessionalSearchResult>
        placeholder="Пошук по імені..."
        perPage={40}
        fetcher={fetcher}
        renderEmpty={() => (
          <div className="text-center py-16 space-y-5">
            <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
              <svg className={clsx("w-8 h-8", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
            </div>
            <div>
              <p className="font-bold text-lg">Команда поки порожня</p>
              <p className={clsx("text-sm mt-1 max-w-md mx-auto", th.subText)}>Прив&apos;яжіть майстрів до своїх локацій, щоб вони з&apos;явилися тут.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/staff/new')}
              className={clsx("px-6 py-3 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2", th.brand)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Додати першого майстра
            </button>
          </div>
        )}
        renderItem={(pro) => (
          <div
            key={pro.id}
            className={clsx(
              "group rounded-2xl border overflow-hidden transition-all hover:shadow-md",
              th.cardBg, th.border
            )}
          >
            <div className="flex flex-col sm:flex-row">
              {/* Photo / Avatar */}
              <div className={clsx("sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden", th.tabBg)}>
                {pro.profile_image_url ? (
                  <img
                    src={pro.profile_image_url}
                    alt={pro.full_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={clsx("text-4xl font-black opacity-20", th.accent)}>
                      {pro.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-5 md:p-6 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{pro.full_name}</h3>
                    <p className={clsx("text-sm font-medium mt-1", th.subText)}>Майстер</p>
                  </div>
                  <div className={clsx("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0", th.tabBg, th.accent)}>
                    PRO
                  </div>
                </div>

                {pro.bio && (
                  <p className={clsx("text-sm mt-3 leading-relaxed line-clamp-2", th.subText)}>{pro.bio}</p>
                )}

                {/* Contact */}
                <div className="flex flex-wrap items-center gap-3 mt-auto pt-4">
                  {pro.phone && (
                    <a href={`tel:${pro.phone}`} className={clsx("flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline", th.accent)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      {pro.phone}
                    </a>
                  )}
                  {pro.email && (
                    <span className={clsx("flex items-center gap-1.5 text-sm", th.subText)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {pro.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
