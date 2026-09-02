"use client";

// Client-facing "my bookings" page: list, cancel, reschedule.
// Times are fake-UTC (the pro's wall clock) — always read via getUTC*/timeZone:"UTC".

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { isLoggedIn } from "@/lib/auth";
import {
  fetchMyAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  fetchAvailability,
  type AppointmentResponse,
  type TimeSlot,
} from "@/lib/api";
import { kyivToday, kyivNow } from "@/lib/kyivtime";

const STATUS_UA: Record<string, string> = {
  Confirmed: "Підтверджено",
  Pending: "Очікує підтвердження",
  Cancelled: "Скасовано",
  Completed: "Завершено",
  NoShow: "Неявка",
};

const STATUS_STYLE: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Pending: "bg-amber-50 text-amber-600 border-amber-200",
  Cancelled: "bg-red-50 text-red-500 border-red-200",
  Completed: "bg-gray-100 text-gray-500 border-gray-200",
  NoShow: "bg-red-50 text-red-500 border-red-200",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Is this appointment still ahead of Kyiv "now"? (both sides fake-UTC) */
function isUpcoming(a: AppointmentResponse): boolean {
  const now = kyivNow();
  const nowStr = `${kyivToday()}T${String(now.hours).padStart(2, "0")}:${String(now.minutes).padStart(2, "0")}:00Z`;
  return a.start_time >= nowStr;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Reschedule panel state
  const [reschedId, setReschedId] = useState("");
  const [reschedDate, setReschedDate] = useState(kyivToday());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const load = useCallback(() => {
    fetchMyAppointments(1, 100)
      .then((d) => setAppointments(d.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    load();
  }, [router, load]);

  const handleCancel = async (id: string) => {
    setError("");
    setBusyId(id);
    try {
      await updateAppointmentStatus(id, "Cancelled");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  };

  const openReschedule = (a: AppointmentResponse) => {
    setError("");
    setReschedId(a.id);
    setReschedDate(a.start_time.split("T")[0]);
  };

  useEffect(() => {
    if (!reschedId) return;
    const appt = appointments.find((a) => a.id === reschedId);
    if (!appt) return;
    setSlotsLoading(true);
    fetchAvailability(appt.professional.id, appt.location_id, reschedDate)
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [reschedId, reschedDate, appointments]);

  const handleReschedule = async (a: AppointmentResponse, slot: TimeSlot) => {
    setError("");
    setBusyId(a.id);
    try {
      await rescheduleAppointment(
        a.id,
        `${reschedDate}T${slot.start_time}:00Z`,
        `${reschedDate}T${slot.end_time}:00Z`
      );
      setReschedId("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  };

  const active = appointments.filter((a) => a.status !== "Cancelled" && isUpcoming(a));
  const history = appointments.filter((a) => a.status === "Cancelled" || !isUpcoming(a));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-black">Z</div>
            <span className="font-bold tracking-tight">Zilobook</span>
          </Link>
          <span className="text-sm font-semibold text-gray-500">Мої записи</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">Мої записи</h1>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 font-semibold">Завантаження...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🗓</div>
            <p className="text-gray-500 font-medium">У вас поки немає записів.</p>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Найближчі</h2>
              {active.length === 0 && (
                <p className="text-sm text-gray-400">Найближчих записів немає.</p>
              )}
              {active.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{a.professional.full_name}</p>
                      <p className="text-sm text-gray-500 mt-0.5 capitalize">{fmtDate(a.start_time)}</p>
                      <p className="text-sm font-semibold mt-0.5">{fmtTime(a.start_time)} – {fmtTime(a.end_time)}</p>
                    </div>
                    <span className={clsx("px-2.5 py-1 text-[11px] font-bold rounded-lg border whitespace-nowrap", STATUS_STYLE[a.status] || "bg-gray-100 text-gray-500 border-gray-200")}>
                      {STATUS_UA[a.status] || a.status}
                    </span>
                  </div>

                  {reschedId === a.id ? (
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold">Оберіть новий час</p>
                        <button onClick={() => setReschedId("")} className="text-xs font-bold text-gray-400 hover:text-gray-600">Закрити</button>
                      </div>
                      <input
                        type="date"
                        value={reschedDate}
                        min={kyivToday()}
                        onChange={(e) => setReschedDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      {slotsLoading ? (
                        <p className="text-sm text-gray-400 text-center py-3">Шукаємо вільні слоти...</p>
                      ) : slots.filter((s) => s.available).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-3">На цю дату вільних слотів немає.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.filter((s) => s.available).map((s) => (
                            <button
                              key={s.start_time}
                              disabled={busyId === a.id}
                              onClick={() => handleReschedule(a, s)}
                              className="py-2 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-50"
                            >
                              {s.start_time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => openReschedule(a)}
                        disabled={busyId === a.id}
                        className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        Перенести
                      </button>
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={busyId === a.id}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {busyId === a.id ? "Скасовуємо..." : "Скасувати"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* History */}
            {history.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Історія</h2>
                {history.map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3 opacity-70">
                    <div>
                      <p className="font-semibold text-sm">{a.professional.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{fmtDate(a.start_time)} · {fmtTime(a.start_time)}</p>
                    </div>
                    <span className={clsx("px-2.5 py-1 text-[11px] font-bold rounded-lg border whitespace-nowrap", STATUS_STYLE[a.status] || "bg-gray-100 text-gray-500 border-gray-200")}>
                      {STATUS_UA[a.status] || a.status}
                    </span>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
