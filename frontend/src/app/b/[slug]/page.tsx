"use client";

// Short booking link — THE URL pros paste into their Instagram/Telegram bio.
// /b/<slug> resolves the location by its slug and lands on the booking flow.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchLocationBySlug } from "@/lib/api";

export default function ShortBookingLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchLocationBySlug(slug)
      .then((loc) => router.replace(`/location/${loc.id}/book`))
      .catch(() => setNotFound(true));
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-900">
      {notFound ? (
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold mb-2">Посилання не знайдено</h1>
          <p className="text-gray-500 text-sm mb-6">Перевірте адресу або запитайте нове посилання у майстра.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm">
            На головну
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm font-medium">Відкриваємо запис…</span>
        </div>
      )}
    </div>
  );
}
