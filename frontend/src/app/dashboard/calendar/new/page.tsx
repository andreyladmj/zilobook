"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { authFetch, getUser } from "@/lib/auth";
import { fetchAppointment, fetchMyLocations, createAppointment, rescheduleAppointment, fetchMyAppointments, type Location, type AppointmentResponse } from "@/lib/api";
import { kyivToday } from "@/lib/kyivtime";
import { Suspense } from "react";

function NewSlotForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const paramDate = searchParams.get("date");
  const paramTime = searchParams.get("time");
  const { th } = useTheme();

  const [slotType, setSlotType] = useState<"individual" | "block">("individual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const [date, setDate] = useState(paramDate || kyivToday());
  const [startTime, setStartTime] = useState(paramTime || "10:00");
  const [duration, setDuration] = useState("01:00");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // For appointment creation
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [editAppt, setEditAppt] = useState<AppointmentResponse | null>(null);

  const user = getUser();

  // Load locations and existing clients
  useEffect(() => {
    fetchMyLocations()
      .then(data => {
        const locs = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) setSelectedLocationId(locs[0].id);
      })
      .catch(() => {});

    // Get unique clients from past appointments
    fetchMyAppointments(1, 100)
      .then(data => {
        const map = new Map<string, string>();
        for (const a of data.appointments || []) {
          if (!map.has(a.client.id)) map.set(a.client.id, a.client.full_name);
        }
        setClients(Array.from(map, ([id, name]) => ({ id, name })));
      })
      .catch(() => {});
  }, []);

  // Load appointment for edit mode
  useEffect(() => {
    if (!editId) return;
    setIsEditMode(true);
    fetchAppointment(editId)
      .then(appt => {
        setEditAppt(appt);
        const start = new Date(appt.start_time);
        const end = new Date(appt.end_time);
        setDate(`${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,"0")}-${String(start.getUTCDate()).padStart(2,"0")}`);
        setStartTime(`${String(start.getUTCHours()).padStart(2,"0")}:${String(start.getUTCMinutes()).padStart(2,"0")}`);
        const durMs = end.getTime() - start.getTime();
        const durH = Math.floor(durMs / 3600000);
        const durM = Math.floor((durMs % 3600000) / 60000);
        setDuration(`${String(durH).padStart(2, "0")}:${String(durM).padStart(2, "0")}`);
        setSelectedLocationId(appt.location_id);
        setSelectedClientId(appt.client.id);
        setNotes(appt.client_notes || "");
        setSlotType("individual");
      })
      .catch(e => setError(e.message));
  }, [editId]);

  const computeEndTime = () => {
    const [durH, durM] = duration.split(":").map(Number);
    const [startH, startM] = startTime.split(":").map(Number);
    const totalM = startM + (durM || 0);
    const endH = startH + durH + Math.floor(totalM / 60);
    const endM = totalM % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      const endTime = computeEndTime();
      const startDT = `${date}T${startTime}:00Z`;
      const endDT = `${date}T${endTime}:00Z`;

      if (isEditMode && editAppt) {
        // Reschedule
        await rescheduleAppointment(editAppt.id, startDT, endDT);
      } else if (slotType === "block") {
        const res = await authFetch("/api/schedule/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: selectedLocationId || undefined,
            start_time: startDT,
            end_time: endDT,
            block_reason: reason || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create block");
        }
      } else {
        // Create appointment (client is optional — empty = open slot)
        if (!selectedLocationId) {
          throw new Error("Please select a location");
        }
        await createAppointment({
          location_id: selectedLocationId,
          professional_id: user?.id || "",
          client_id: selectedClientId,
          start_time: startDT,
          end_time: endDT,
          client_notes: notes || undefined,
        });
      }

      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx("max-w-3xl mx-auto min-h-screen p-4 md:p-10 pb-32", th.bg, th.text)}>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:opacity-80", th.cardBg, th.border)}>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? "Перенести запис" : "Новий слот"}
        </h1>
      </div>

      <div className={clsx("rounded-2xl border shadow-sm overflow-hidden p-6 md:p-8 space-y-8", th.cardBg, th.border)}>
         {error && (
           <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">{error}</div>
         )}

         {/* Edit mode info */}
         {isEditMode && editAppt && (
           <div className={clsx("p-4 rounded-xl border", th.tabBg, th.border)}>
             <p className={clsx("text-xs font-bold uppercase tracking-wider mb-1", th.subText)}>Переносимо запис</p>
             <p className="font-bold">{editAppt.client.full_name} — {editAppt.client.phone}</p>
           </div>
         )}

         {/* Type Selector (only in create mode) */}
         {!isEditMode && (
         <div>
            <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Тип слота</label>
            <div className={clsx("flex p-1 rounded-xl", th.tabBg)}>
              <button onClick={() => setSlotType("individual")} className={clsx("flex-1 py-2.5 text-sm font-semibold z-10 rounded-lg transition-colors", slotType === "individual" ? th.activeTab : th.subText)}>Запис</button>
              <button onClick={() => setSlotType("block")} className={clsx("flex-1 py-2.5 text-sm font-semibold z-10 rounded-lg transition-colors", slotType === "block" ? th.activeTab : th.subText)}>Блок часу</button>
            </div>
         </div>
         )}

         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Дата</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
              </div>
              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Початок</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} step="300" />
              </div>
            </div>

            <div>
              <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Тривалість</label>
              <input type="time" value={duration} onChange={e => setDuration(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} step="300" />
              <p className={clsx("text-xs mt-1", th.subText)}>Кінець: {computeEndTime()}</p>
            </div>

            {/* Appointment-specific fields */}
            {slotType === "individual" && !isEditMode && (
              <>
                <div>
                  <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Локація</label>
                  <select value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)}>
                    <option value="">Оберіть локацію...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Клієнт</label>
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)}>
                    <option value="">Відкритий слот (без клієнта)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <p className={clsx("text-xs mt-1", th.subText)}>Залиште порожнім — клієнти зможуть записатися на цей час самі.</p>
                </div>
              </>
            )}

            {slotType === "block" && !isEditMode && (
              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Причина (необов&apos;язково)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} placeholder="Обід, відпустка тощо" />
              </div>
            )}

            <div>
              <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Нотатки</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 min-h-[80px]", th.bg, th.border)} placeholder="Деталі..." />
            </div>
         </div>

         <button onClick={handleSave} disabled={loading} className={clsx("w-full py-4 mt-4 rounded-xl font-bold tracking-wide transition-colors flex items-center justify-center disabled:opacity-50", th.brand)}>
           {loading ? "Зберігаємо..." : isEditMode ? "Зберегти новий час" : slotType === "block" ? "Зберегти блок" : "Створити запис"}
         </button>
      </div>
    </div>
  );
}

export default function NewSlotPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-zinc-400 font-semibold">Завантаження...</div>}>
      <NewSlotForm />
    </Suspense>
  );
}
