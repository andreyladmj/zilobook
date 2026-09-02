"use client";

import { useState, useEffect, useCallback } from "react";
import BottomSheet, { ClientData } from "@/components/BottomSheet";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { fetchTodaySchedule, updateAppointmentStatus, deleteScheduleBlock, type TodayScheduleItem } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";

export default function DashboardOverview() {
  const router = useRouter();
  const { th } = useTheme();
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [schedule, setSchedule] = useState<TodayScheduleItem[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const loadSchedule = useCallback(() => {
    if (!isLoggedIn()) return;
    setLoading(true);
    fetchTodaySchedule()
      .then((data) => {
        setSchedule(data.items || []);
        setTotalToday(data.total_today);
        setPendingCount(data.pending_count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUser(getUser());
    loadSchedule();
  }, [loadSchedule]);

  const toClientData = (item: TodayScheduleItem): ClientData => ({
    id: item.id,
    client: item.client,
    service: item.service,
    status: item.status as "Confirmed" | "Pending" | "Cancelled",
    duration: item.duration,
    phone: item.client_phone,
    notes: item.notes,
    isBlock: item.is_block,
    blockReason: item.block_reason,
  });

  const handleConfirm = async (id: string) => {
    await updateAppointmentStatus(id, "Confirmed");
    loadSchedule();
  };

  const handleCancel = async (id: string) => {
    await updateAppointmentStatus(id, "Cancelled");
    loadSchedule();
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteScheduleBlock(id);
    loadSchedule();
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 relative pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Огляд</h1>
          <p className={clsx("mt-1 font-medium", th.subText)}>З поверненням{user ? `, ${user.full_name.split(" ")[0]}` : ""}! Ось ваш розклад на сьогодні.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={clsx("p-6 rounded-2xl border shadow-sm flex flex-col justify-center", th.statCard)}>
          <p className={clsx("text-sm font-semibold mb-2", th.subText)}>Записів сьогодні</p>
          <div className="flex items-end gap-3">
             <p className={clsx("text-5xl font-extrabold tracking-tighter", th.accent)}>{loading ? "—" : totalToday}</p>
             <p className={clsx("text-sm font-medium mb-1", th.subText)}>сеансів</p>
          </div>
        </div>
        <div className={clsx("p-6 rounded-2xl border shadow-sm flex flex-col justify-center", th.statCard)}>
          <p className={clsx("text-sm font-semibold mb-2", th.subText)}>Очікують підтвердження</p>
          <div className="flex items-end gap-3">
             <p className="text-5xl font-extrabold tracking-tighter text-amber-500">{loading ? "—" : pendingCount}</p>
             <p className={clsx("text-sm font-medium mb-1", th.subText)}>потребують дії</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Розклад дня</h2>
        <div className={clsx("border rounded-2xl shadow-sm p-4 md:p-6", th.cardBg, th.border)}>
           {loading ? (
             <div className={clsx("text-center py-10 font-semibold", th.subText)}>Завантажуємо розклад...</div>
           ) : (
           <div className="flex flex-col relative w-full">
              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((hour, i) => {
                 const slot = schedule.find(s => s.hour === hour);
                 return (
                  <div key={i} className={clsx("flex min-h-[80px] relative border-b last:border-0 group", th.border)}>
                     <div className={clsx("w-16 md:w-20 pt-4 flex flex-col items-center border-r", th.border)}>
                        <span className={clsx("text-xs font-bold", th.subText)}>{hour}</span>
                     </div>
                     <div className="flex-1 p-2 md:p-3 relative">
                        {slot && slot.is_block ? (
                           <div
                              onClick={() => setSelectedClient(toClientData(slot))}
                              className={clsx("w-full h-full rounded-xl flex items-center px-4 cursor-pointer transition-colors", th.tabBg)}
                           >
                              <span className={clsx("text-sm font-semibold", th.subText)}>{slot.block_reason || "Заблоковано"}</span>
                           </div>
                        ) : slot && slot.client ? (
                           <div
                              onClick={() => setSelectedClient(toClientData(slot))}
                              className={clsx(
                                "w-full h-full rounded-2xl flex flex-col justify-center px-4 py-3 cursor-pointer transition-all hover:scale-[1.01]",
                                slot.status === 'Confirmed' ? th.slotConfirmed : th.slotPending
                              )}
                           >
                              <div className="flex justify-between items-start">
                                 <span className="text-sm font-bold">{slot.client}</span>
                                 {slot.status === 'Pending' && <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md", th.pendingBadge)}>Очікує</span>}
                              </div>
                              <span className="text-xs mt-1 opacity-70">{slot.service} • {slot.duration}</span>
                           </div>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => router.push('/dashboard/calendar/new')} className={clsx("text-xs font-bold transition-colors flex items-center gap-1", th.subText)}>
                                 + Запис або блок
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               );
              })}
           </div>
           )}
        </div>
      </div>

      <BottomSheet
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onDeleteBlock={handleDeleteBlock}
      />
    </div>
  );
}
