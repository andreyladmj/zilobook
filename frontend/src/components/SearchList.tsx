"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";

export interface SearchListResult<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

interface SearchListProps<T> {
  placeholder?: string;
  perPage?: number;
  fetcher: (query: string, page: number, perPage: number) => Promise<SearchListResult<T>>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  debounceMs?: number;
  className?: string;
}

export default function SearchList<T>({
  placeholder = "Пошук...",
  perPage = 20,
  fetcher,
  renderItem,
  renderEmpty,
  debounceMs = 300,
  className,
}: SearchListProps<T>) {
  const { th } = useTheme();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(async (q: string, p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const data = await fetcher(q, p, perPage);
      if (append) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setTotal(data.total);
      setPage(p);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetcher, perPage]);

  // Initial load + search with debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doFetch(query, 1, false);
    }, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, debounceMs, doFetch]);

  const hasMore = items.length < total;

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    doFetch(query, page + 1, true);
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Search input */}
      <div className="relative">
        <svg className={clsx("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            "w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-shadow text-sm font-medium",
            th.inputBg, th.border, th.inputFocus
          )}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={clsx("absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors", th.tabBg)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className={clsx("text-xs font-bold uppercase tracking-wider px-1", th.subText)}>
          {total} знайдено{query ? ` за запитом "${query}"` : ""}
        </p>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={clsx("w-8 h-8 border-4 rounded-full animate-spin", th.border, "border-t-current")}></div>
        </div>
      ) : items.length === 0 ? (
        renderEmpty ? renderEmpty() : (
          <div className="text-center py-12 space-y-3">
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
              <svg className={clsx("w-7 h-7", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <p className={clsx("font-medium", th.subText)}>Нічого не знайдено</p>
            {query && <p className={clsx("text-sm", th.subText)}>Спробуйте інший запит</p>}
          </div>
        )
      ) : (
        <>
          {/* Items */}
          <div className="space-y-3">
            {items.map((item, i) => renderItem(item, i))}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={clsx(
                "w-full py-3 rounded-xl border font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                th.border, th.subText
              )}
            >
              {loadingMore ? (
                <><div className={clsx("w-4 h-4 border-2 rounded-full animate-spin", th.border, "border-t-current")}></div> Завантаження...</>
              ) : (
                `Показати ще (${items.length} з ${total})`
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
