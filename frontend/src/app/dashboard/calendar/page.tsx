"use client";

import { useState, useEffect, useCallback } from "react";
import BottomSheet, { ClientData } from "@/components/BottomSheet";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useTheme, THEMES, type ThemeKey } from "@/components/ThemeProvider";
import { fetchMyAppointments, fetchMyLocations, updateAppointmentStatus, deleteScheduleBlock, type AppointmentResponse, type Location } from "@/lib/api";
import { kyivToday, kyivNow } from "@/lib/kyivtime";

const VIEW_UA: Record<"Day" | "Week" | "Month", string> = { Day: "День", Week: "Тиждень", Month: "Місяць" };
// API status values stay English; display-only mapping
const STATUS_UA: Record<string, string> = { Confirmed: "Підтверджено", Pending: "Очікує", Cancelled: "Скасовано", Completed: "Завершено", NoShow: "Неявка" };

type ScheduleItem = {
  id: string;
  hour: string;
  day: number;
  month: number;
  client: string;
  service: string;
  status: string;
  duration: string;
  phone: string;
  notes?: string;
  locationId: string;
  locationName: string;
  isBlock: boolean;
};

export default function CalendarPage() {
  const router = useRouter();
  const { themeId, setThemeId, th } = useTheme();

  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [monthEventsDay, setMonthEventsDay] = useState<number | null>(null);
  const [view, setView] = useState<"Day" | "Week" | "Month">("Week");
  
  // Dynamic Date State. Appointment times are fake-UTC (pro's wall clock),
  // so "today" must come from Kyiv wall time, not the browser or real UTC.
  const [currentDate, setCurrentDate] = useState(() => new Date(kyivToday() + "T00:00:00Z"));
  const currentDateString = currentDate.toLocaleDateString("uk-UA", { month: "long", year: "numeric", timeZone: "UTC" });

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("all");

  const [currentTimePos, setCurrentTimePos] = useState<number>(-1);

  useEffect(() => {
     const updateTime = () => {
        const now = kyivNow(); // wall clock the calendar grid lives in
        if (now.hours >= 8 && now.hours <= 22) {
           setCurrentTimePos((now.hours - 8) * 140 + (now.minutes / 60) * 140);
        } else {
           setCurrentTimePos(-1);
        }
     };
     updateTime();
     const interval = setInterval(updateTime, 60000);
     return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    fetchMyAppointments(1, 500)
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => setAppointments([]));
    fetchMyLocations()
      .then((data) => setLocations(data.locations || []))
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

  // Build location name map
  const locNameMap = new Map(locations.map(l => [l.id, l.name]));

  // Build schedule items from real appointments
  const allSchedule: ScheduleItem[] = appointments.map(a => {
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    const durMins = (end.getTime() - start.getTime()) / 60000;
    const durStr = durMins >= 60 ? `${Math.floor(durMins/60)}h${durMins%60 > 0 ? durMins%60 + "m" : ""}` : `${durMins}m`;
    return {
      id: a.id,
      hour: `${String(start.getUTCHours()).padStart(2,"0")}:${String(start.getUTCMinutes()).padStart(2,"0")}`,
      day: start.getUTCDate(),
      month: start.getUTCMonth(),
      client: a.client.full_name,
      service: "Запис",
      status: a.status,
      duration: durStr,
      phone: a.client.phone || "",
      notes: a.client_notes || undefined,
      locationId: a.location_id,
      locationName: locNameMap.get(a.location_id) || "",
      isBlock: false,
    };
  });

  // Filter by selected location
  const schedule = selectedLocationId === "all"
    ? allSchedule
    : allSchedule.filter(s => s.locationId === selectedLocationId);

  const todayISO = kyivToday();
  const today = new Date(todayISO + "T00:00:00Z");

  // Return ALL slots for an hour+day (supports overlapping)
  const getSlots = (hour: string, day?: number, monthNum?: number): ScheduleItem[] => {
    const targetDay = day ?? currentDate.getUTCDate();
    const targetMonth = monthNum ?? currentDate.getUTCMonth();
    return schedule.filter(s => s.hour === hour && s.day === targetDay && s.month === targetMonth);
  };

  const slotStyle = (status: string) => {
    if (status === "Cancelled") return th.slotCancelled;
    if (status === "Pending") return th.slotPending;
    return th.slotConfirmed;
  };

  const toClientData = (slot: ScheduleItem): ClientData => ({
    id: slot.id,
    client: slot.client,
    service: slot.service,
    status: slot.status as "Confirmed" | "Pending" | "Cancelled",
    duration: slot.duration,
    phone: slot.phone,
    notes: slot.notes,
    locationName: slot.locationName,
    isBlock: slot.isBlock,
  });

  const handleConfirm = async (id: string) => {
    await updateAppointmentStatus(id, "Confirmed");
    loadData();
  };

  const handleCancel = async (id: string) => {
    await updateAppointmentStatus(id, "Cancelled");
    loadData();
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteScheduleBlock(id);
    loadData();
  };

  const newSlotURL = (date?: string, time?: string) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    const qs = params.toString();
    return `/dashboard/calendar/new${qs ? "?" + qs : ""}`;
  };

  // Dynamic Navigation Handler
  const handleNavigate = (direction: number) => {
    const next = new Date(currentDate);
    if (view === "Month") {
      next.setUTCMonth(next.getUTCMonth() + direction);
    } else if (view === "Week") {
      next.setUTCDate(next.getUTCDate() + direction * 7);
    } else {
      next.setUTCDate(next.getUTCDate() + direction);
    }
    setCurrentDate(next);
  };

  // Week view calculation relative to currentDate
  const weekStart = new Date(currentDate);
  const dayOfWeek = currentDate.getUTCDay();
  weekStart.setUTCDate(currentDate.getUTCDate() - ((dayOfWeek + 6) % 7));
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    const isToday = d.getUTCDate() === today.getUTCDate() && d.getUTCMonth() === today.getUTCMonth() && d.getUTCFullYear() === today.getUTCFullYear();
    return {
      day: d.toLocaleDateString("uk-UA", { weekday: "short", timeZone: "UTC" }),
      date: String(d.getUTCDate()),
      dateNum: d.getUTCDate(),
      dateMonth: d.getUTCMonth(),
      dateISO: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
      active: isToday,
    };
  });

  // Month view helper
  const getMonthDays = () => {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth(); // 0-indexed
    
    const firstDay = new Date(Date.UTC(year, month, 1));
    const startDay = firstDay.getUTCDay();
    const startDayOffset = startDay === 0 ? 6 : startDay - 1;
    
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    
    return { startDayOffset, totalDays, year, month };
  };

  const { startDayOffset, totalDays, year, month } = getMonthDays();
  const currentDateISO = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;

  return (
    <div className={clsx("w-full mx-auto min-h-screen relative pb-32 flex flex-col transition-colors duration-500", th.bg, th.text)}>

      {/* HEADER */}
      <div className={clsx("sticky top-0 z-20 border-b backdrop-blur-md", th.cardBg, th.headerLine)}>
        <div className="p-4 md:px-8 max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-4">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                 <button className={clsx("p-1.5 rounded-lg", th.subText)} onClick={() => handleNavigate(-1)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                 </button>
                 <h1 className="text-xl md:text-2xl font-extrabold tracking-tight min-w-[150px] text-center">{currentDateString}</h1>
                 <button className={clsx("p-1.5 rounded-lg", th.subText)} onClick={() => handleNavigate(1)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                 </button>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {/* Location filter */}
              <select
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
                className={clsx("px-3 py-1.5 text-sm font-bold rounded-lg border", th.inputBg, th.border)}
              >
                <option value="all">Всі локації</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>

              <div className={clsx("hidden md:flex p-1 rounded-xl", th.tabBg)}>
                {(["Day", "Week", "Month"] as const).map((v) => (
                   <button key={v} onClick={() => setView(v)} className={clsx("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", view === v ? th.activeTab : "opacity-60 hover:opacity-100")}>{VIEW_UA[v]}</button>
                ))}
              </div>
              <div className="hidden lg:flex items-center gap-1.5">
                 {(Object.keys(THEMES) as ThemeKey[]).map(t => (
                    <button key={t} onClick={() => setThemeId(t)} className={clsx("px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", themeId === t ? th.brand : clsx(th.tabBg, "opacity-60 hover:opacity-100"))}>{THEMES[t].name}</button>
                 ))}
              </div>
           </div>
        </div>

        <div className={clsx("md:hidden flex p-1 mx-4 mb-4 rounded-xl", th.tabBg)}>
           {(["Day", "Week", "Month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={clsx("flex-1 py-1.5 rounded-lg text-sm font-bold transition-all", view === v ? th.activeTab : "opacity-60 hover:opacity-100")}>{VIEW_UA[v]}</button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-[1600px] w-full mx-auto">

        {/* DAY VIEW */}
        {view === "Day" && (
           <div className="p-4 w-full">
             <div className={clsx("flex flex-col relative w-full rounded-3xl border overflow-hidden shadow-sm", th.cardBg, th.border)}>
                {currentTimePos > 0 && (
                   <div className="absolute left-[72px] md:left-[80px] right-0 z-20 flex flex-col pointer-events-none" style={{ top: `${currentTimePos}px` }}>
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                      <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                   </div>
                )}
                {hours.map((hour, i) => {
                   const slots = getSlots(hour);
                   return (
                   <div key={i} className={clsx("flex min-h-[140px] relative border-b last:border-0 group", th.border)}>
                      <div className={clsx("w-16 md:w-20 pt-4 flex flex-col items-center border-r font-bold text-sm", th.border, th.dayCol)}>{hour}</div>
                      <div className="flex-1 p-3 md:p-4 relative">
                          {slots.length > 0 ? (
                             <div className="flex flex-col gap-2">
                             {slots.map(slot => (
                               <div key={slot.id} onClick={() => setSelectedClient(toClientData(slot))} className={clsx("rounded-2xl flex flex-col justify-center px-5 py-3 cursor-pointer transition-transform hover:scale-[1.01]", slotStyle(slot.status))}>
                                  <div className="flex justify-between items-start">
                                     <span className="text-lg font-bold tracking-tight">{slot.client}</span>
                                     {slot.status === 'Pending' && <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">Очікує</span>}
                                     {slot.status === 'Cancelled' && <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg">Скасовано</span>}
                                  </div>
                                  <span className="text-sm mt-1 font-medium opacity-80">{slot.service} • {slot.duration}{slot.locationName ? ` • ${slot.locationName}` : ""}</span>
                               </div>
                             ))}
                             </div>
                          ) : (
                             <div onClick={() => router.push(newSlotURL(currentDateISO, hour))} className="w-full h-full flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <button className={clsx("text-sm font-bold flex px-4", th.subText)}>+ Book Slot at {hour}</button>
                             </div>
                          )}
                      </div>
                   </div>
                )})}
             </div>
           </div>
        )}

        {/* WEEK VIEW */}
        {view === "Week" && (
           <div className="p-4 flex flex-col max-w-full overflow-x-auto no-scrollbar">
              <div className={clsx("min-w-[900px] rounded-3xl border shadow-sm overflow-hidden flex flex-col", th.cardBg, th.border)}>
                 <div className={clsx("flex border-b", th.border)}>
                    <div className={clsx("w-16 flex-shrink-0 border-r", th.border, th.dayCol)}></div>
                    {weekDates.map((d, i) => (
                       <div key={i} className={clsx("flex-1 text-center py-4 border-r last:border-0 font-bold text-sm", th.border, d.active ? th.brand : th.dayCol)}>{d.day} {d.date}</div>
                    ))}
                 </div>
                 {hours.map((hour, rowIdx) => (
                    <div key={rowIdx} className={clsx("flex min-h-[100px] border-b last:border-0 group", th.border)}>
                       <div className={clsx("w-16 flex-shrink-0 border-r flex items-start justify-center pt-2 text-xs font-bold", th.border, th.dayCol)}>{hour}</div>
                       {weekDates.map((d, colIdx) => {
                          const slots = getSlots(hour, d.dateNum, d.dateMonth);
                          return (
                          <div key={colIdx} onClick={() => router.push(newSlotURL(d.dateISO, hour))} className={clsx("flex-1 border-r last:border-0 p-1 relative transition-colors cursor-pointer", th.border)}>
                             {slots.map((slot, si) => (
                                <div key={slot.id} onClick={(e) => { e.stopPropagation(); setSelectedClient(toClientData(slot)); }}
                                  style={slots.length > 1 ? { top: `${4 + si * 28}px` } : undefined}
                                  className={clsx(
                                    slots.length > 1 ? "absolute left-1 right-1 p-1.5" : "absolute inset-1 p-2",
                                    "rounded-xl cursor-pointer flex flex-col overflow-hidden hover:scale-[1.02] transition-transform z-10 shadow-sm",
                                    slotStyle(slot.status)
                                  )}>
                                   <span className="text-[10px] font-bold opacity-80 mb-0.5">{STATUS_UA[slot.status] ?? slot.status}</span>
                                   <span className="text-xs font-bold truncate">{slot.client}</span>
                                   <span className="text-[10px] opacity-70">{slot.duration}{slot.locationName ? ` • ${slot.locationName}` : ""}</span>
                                </div>
                             ))}
                          </div>
                       )})}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* MONTH VIEW */}
        {view === "Month" && (
           <div className="p-4 w-full">
              <div className={clsx("rounded-3xl border shadow-sm overflow-hidden", th.cardBg, th.border)}>
                 <div className={clsx("grid grid-cols-7 border-b", th.border, th.dayCol)}>
                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map(d => (
                       <div key={d} className="py-3 text-center text-xs font-extrabold uppercase">{d}</div>
                    ))}
                 </div>
                 <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)]">
                    {/* Render empty offset spacers */}
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                      <div key={`spacer-${i}`} className={clsx("border-r border-b p-2", th.border, th.dayCol)}></div>
                    ))}
                    
                    {/* Render monthly grid cells */}
                    {Array.from({length: totalDays}).map((_, i) => {
                       const dateNum = i + 1;
                       const isToday = dateNum === today.getUTCDate() && month === today.getUTCMonth() && year === today.getUTCFullYear();
                       const daySlots = schedule.filter(s => s.day === dateNum && s.month === month);
                       return (
                       <div key={i} className={clsx("border-r border-b p-2 md:p-3 relative transition-colors group cursor-pointer", th.border)} onClick={() => setMonthEventsDay(dateNum)}>
                          <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(Date.UTC(year, month, dateNum))); setView("Day"); }} className={clsx("text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2", isToday ? th.brand : th.subText)}>{dateNum}</button>
                          <div className="flex flex-col gap-1.5 overflow-hidden">
                             {daySlots.slice(0, 3).map((slot, idx) => (
                                <div key={idx} className={clsx("text-[10px] md:text-xs font-semibold px-2 py-1 rounded truncate",
                                  slot.status === "Cancelled" ? "bg-red-100 text-red-400 line-through opacity-60" : th.monthlyEvent
                                )}>
                                   <span className="opacity-70 mr-1">{slot.hour}</span>
                                   <span>{slot.client}</span>
                                </div>
                             ))}
                             {daySlots.length > 3 && (
                               <span className={clsx("text-[10px] font-bold px-2", th.subText)}>+{daySlots.length - 3} more</span>
                             )}
                          </div>
                       </div>
                    )})}
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => router.push(newSlotURL(currentDateISO))} className={clsx("fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-30", th.brand)}>
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      <BottomSheet isOpen={!!selectedClient} onClose={() => setSelectedClient(null)} client={selectedClient} onConfirm={handleConfirm} onCancel={handleCancel} onDeleteBlock={handleDeleteBlock} />

      {/* Month Day Popup */}
      {monthEventsDay !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMonthEventsDay(null)} />
            <div className={clsx("relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[80vh]", th.cardBg, th.text)}>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Події за {monthEventsDay} {currentDate.toLocaleDateString("uk-UA", { month: "long", timeZone: "UTC" })}</h3>
                  <button onClick={() => setMonthEventsDay(null)} className={clsx("p-2 rounded-full transition-colors", th.tabBg)}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 mb-6">
                  {schedule.filter(s => s.day === monthEventsDay && s.month === month).length === 0 && (
                     <p className={clsx("text-sm text-center py-8", th.subText)}>На цей день подій немає.</p>
                  )}
                  {schedule.filter(s => s.day === monthEventsDay && s.month === month).map((slot, i) => (
                     <div key={i} onClick={() => { setMonthEventsDay(null); setSelectedClient(toClientData(slot)); }} className={clsx("p-4 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity",
                       slot.status === "Cancelled" ? "border-red-200 bg-red-50/50 opacity-60" : th.border
                     )}>
                        <div className="font-bold flex items-center justify-between">
                           <span className={slot.status === "Cancelled" ? "line-through text-red-400" : ""}>{slot.client || "Заблокований час"}</span>
                           <span className={clsx("text-xs px-2 py-1 rounded-md font-semibold", th.tabBg, th.subText)}>{slot.hour}</span>
                        </div>
                        <div className={clsx("text-xs mt-1.5 font-medium", th.subText)}>
                           {slot.service} • {slot.duration}{slot.locationName ? ` • ${slot.locationName}` : ""}
                        </div>
                     </div>
                  ))}
               </div>
               <button onClick={() => { setMonthEventsDay(null); router.push(newSlotURL(monthEventsDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(monthEventsDay).padStart(2, "0")}` : undefined)); }} className={clsx("w-full py-4 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-auto", th.brand)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                  Create New Event
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
