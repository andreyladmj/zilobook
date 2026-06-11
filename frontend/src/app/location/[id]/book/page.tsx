"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ThemeProvider, useTheme, themeForLocationType } from "@/components/ThemeProvider";
import { fetchLocation, fetchAvailability, type Location, type Professional, type TimeSlot } from "@/lib/api";

const FALLBACK_IMAGES: Record<string, string> = {
  Gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  Saloon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  Station: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
};

const VIEW_LABELS: Record<"Day" | "Week" | "Month", string> = {
  Day: "День",
  Week: "Тиждень",
  Month: "Місяць",
};

const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function BookingInner({ id }: { id: string }) {
  const router = useRouter();
  const { th, setThemeId } = useTheme();

  const [location, setLocation] = useState<Location | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [view, setView] = useState<"Day" | "Week" | "Month">("Day");

  useEffect(() => {
    fetchLocation(id)
      .then((loc) => {
        setLocation(loc);
        setThemeId(themeForLocationType(loc.type));
        if (loc.professionals?.length) setSelectedPro(loc.professionals[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!selectedPro || !location) return;
    setSlotsLoading(true);
    fetchAvailability(selectedPro.id, location.id, selectedDate)
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedPro, selectedDate, location]);

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available || !selectedPro || !location) return;
    router.push(`/location/${id}/book/checkout?professional_id=${selectedPro.id}&location_id=${location.id}&start=${selectedDate}T${slot.start_time}:00Z&end=${selectedDate}T${slot.end_time}:00Z&date=${selectedDate}&time=${slot.start_time}`);
  };

  const getWeekDates = () => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { label: WEEKDAYS_SHORT[i], dateNum: date.getDate(), dateStr: date.toISOString().split("T")[0], isWeekend: date.getDay() === 0 || date.getDay() === 6, isToday: date.toISOString().split("T")[0] === today.toISOString().split("T")[0] };
    });
  };

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    if (view === "Month") d.setMonth(d.getMonth() + dir);
    else if (view === "Week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const dateDisplay = view === "Month"
    ? new Date(selectedDate).toLocaleDateString("uk-UA", { month: "long", year: "numeric" })
    : view === "Week"
      ? `Тиждень з ${new Date(selectedDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
      : new Date(selectedDate).toLocaleDateString("uk-UA", { weekday: "long", month: "long", day: "numeric" });

  if (loading) return <div className={clsx("min-h-screen flex items-center justify-center", th.bg)}><div className={clsx("w-10 h-10 border-4 rounded-full animate-spin", th.border, "border-t-current")}></div></div>;
  if (!location) return <div className={clsx("min-h-screen flex items-center justify-center", th.bg, th.subText)}>Сторінку не знайдено</div>;

  const heroImage = location.images?.length > 0 ? location.images[0].image_url : FALLBACK_IMAGES[location.type] || FALLBACK_IMAGES.Gym;
  const pros = location.professionals || [];

  return (
    <div className={clsx("min-h-screen font-sans flex flex-col transition-colors duration-500", th.bg, th.text)}>
      {/* Header */}
      <header className={clsx("backdrop-blur-xl px-4 py-3 border-b sticky top-0 z-50 shadow-sm", th.headerGlass)}>
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm", th.cardBg, th.border)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm">Запис</span>
            <span className={clsx("text-[11px] font-medium", th.subText)}>{location.name}</span>
          </div>
          <Link href="/" className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black", th.brand)}>Z</Link>
        </div>
      </header>

      {/* Mini Hero */}
      <div className="relative h-32 md:h-44 overflow-hidden">
        <img src={heroImage} alt={location.name} className="w-full h-full object-cover" />
        <div className={clsx("absolute inset-0 bg-gradient-to-b", th.heroOverlay)}></div>
      </div>

      {/* Pro Selector */}
      {pros.length > 0 && (
        <div className={clsx("border-b py-4 z-10 sticky top-[56px] shadow-sm", th.cardBg, th.border)}>
          <div className="max-w-6xl mx-auto px-4">
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Оберіть майстра</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {pros.map(pro => (
                <button key={pro.id} onClick={() => setSelectedPro(pro)} className={clsx("flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all", selectedPro?.id === pro.id ? th.proCardSelected : th.proCardDefault)}>
                  <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0", th.tabBg)}>
                    {pro.profile_image_url ? <img src={pro.profile_image_url} className="w-full h-full object-cover" alt="" /> : pro.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm leading-tight">{pro.full_name}</h4>
                    <p className={clsx("text-[11px] font-medium", th.subText)}>{pro.role_description || "Майстер"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6 pb-24">
        <div className={clsx("flex flex-col md:flex-row gap-4 md:items-center justify-between px-5 py-4 rounded-2xl border shadow-sm", th.cardBg, th.border)}>
          <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
            <button className={clsx("p-2.5 rounded-xl transition-colors", th.tabBg)} onClick={() => navigateDate(-1)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h1 className="text-lg font-extrabold text-center">{dateDisplay}</h1>
            <button className={clsx("p-2.5 rounded-xl transition-colors", th.tabBg)} onClick={() => navigateDate(1)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className={clsx("flex p-1 rounded-xl w-full md:w-auto", th.tabBg)}>
            {(["Day", "Week", "Month"] as const).map(type => (
              <button key={type} onClick={() => setView(type)} className={clsx("flex-1 md:px-5 py-2 rounded-lg font-bold text-sm transition-all", view === type ? th.activeTab : clsx(th.subText, "hover:opacity-80"))}>{VIEW_LABELS[type]}</button>
            ))}
          </div>
        </div>

        <div className={clsx("border rounded-3xl overflow-hidden shadow-sm", th.cardBg, th.border)}>
          {!selectedPro ? (
            <div className="p-16 text-center space-y-4">
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
                <svg className={clsx("w-7 h-7", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
              </div>
              <p className={clsx("font-medium", th.subText)}>{pros.length === 0 ? "Немає доступних майстрів." : "Оберіть майстра вище."}</p>
            </div>
          ) : slotsLoading ? (
            <div className="p-16 text-center">
              <div className={clsx("w-8 h-8 border-4 rounded-full animate-spin mx-auto", th.border, "border-t-current")}></div>
              <p className={clsx("font-semibold mt-4", th.subText)}>Завантажуємо вільний час...</p>
            </div>
          ) : view === "Day" ? (
            <div className={clsx("divide-y", th.border)}>
              {slots.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
                    <svg className={clsx("w-7 h-7", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className={clsx("font-medium", th.subText)}>На цю дату немає робочих годин.</p>
                </div>
              ) : slots.map((slot, i) => (
                <button key={i} disabled={!slot.available} onClick={() => handleSlotClick(slot)} className={clsx("w-full flex items-center justify-between px-6 py-5 transition-all group", slot.available ? "cursor-pointer hover:opacity-80" : "opacity-40 cursor-not-allowed")}>
                  <div className="flex items-center gap-4">
                    <div className={clsx("w-2 h-2 rounded-full", slot.available ? th.slotDot : th.subText)}></div>
                    <span className="font-mono font-bold text-lg tracking-tight">{slot.start_time}</span>
                    <svg className={clsx("w-4 h-4", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    <span className="font-mono font-bold text-lg tracking-tight">{slot.end_time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx("text-xs font-bold uppercase px-3 py-1.5 rounded-lg", slot.available ? th.slotAvailBadge : th.slotBookedBadge)}>{slot.available ? "Вільно" : "Зайнято"}</span>
                    {slot.available && <svg className={clsx("w-5 h-5 opacity-30 group-hover:opacity-70 transition-opacity", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
                  </div>
                </button>
              ))}
            </div>
          ) : view === "Month" ? (
            <div>
              <div className={clsx("grid grid-cols-7 border-b", th.border)}>
                {WEEKDAYS_SHORT.map(d => (
                  <div key={d} className={clsx("py-3 text-center text-[11px] font-bold uppercase tracking-wider", th.subText)}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date(selectedDate); d.setDate(1); d.setDate(i + 1);
                  const ds = d.toISOString().split("T")[0];
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = ds === today.toISOString().split("T")[0];
                  return (
                    <button key={i} onClick={() => { setSelectedDate(ds); setView("Day"); }} className={clsx("border-r border-b aspect-square p-2 flex items-center justify-center transition-colors", th.border, isWeekend ? "opacity-70" : "")}>
                      <span className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", isToday ? th.todayCircle : isWeekend ? th.weekendText : "")}>{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={clsx("divide-y", th.border)}>
              {getWeekDates().map(day => (
                <button key={day.dateStr} onClick={() => { setSelectedDate(day.dateStr); setView("Day"); }} className="w-full flex items-center justify-between px-6 py-5 transition-colors hover:opacity-80 group">
                  <div className="flex items-center gap-4">
                    <div className={clsx("w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center", day.isToday ? th.todayCircle : th.tabBg)}>
                      <span className="text-[10px] font-bold uppercase leading-none">{day.label}</span>
                      <span className="text-sm font-extrabold leading-none">{day.dateNum}</span>
                    </div>
                    <span className={clsx("font-bold", day.isWeekend ? th.weekendText : "")}>{day.label} {day.dateNum}</span>
                  </div>
                  <svg className={clsx("w-5 h-5 opacity-30 group-hover:opacity-70", th.subText)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ThemeProvider persist={false}><BookingInner id={id} /></ThemeProvider>;
}
