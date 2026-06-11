"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { FEATURES } from "@/lib/niches";

type EventType = "individual" | "group" | "service";

interface CalendarEvent {
  day: number;
  start: number;
  duration: number;
  title: string;
  meta?: string;
  prepaid?: boolean;
  type: EventType;
  isVip?: boolean;
  overlapIndex?: number;
  overlapTotal?: number;
  showTooltip?: boolean;
  details?: { label: string; value: string }[];
}

const FITNESS_EVENTS: CalendarEvent[] = [
  { day: 0, start: 8, duration: 1.5, title: "Олексій (ноги)", meta: "Індивідуальне", type: "individual", prepaid: true },
  { day: 0, start: 18, duration: 1, title: "Кросфіт", meta: "12/15 записані", type: "group" },
  {
    day: 1, start: 14, duration: 1.5, title: "Дитяче ММА", meta: "Тренер А", type: "group", overlapIndex: 1, overlapTotal: 2,
    showTooltip: true,
    details: [
      { label: "Рівень", value: "Початковий" },
      { label: "Записані", value: "8 / 10" },
      { label: "Разове", value: "400 ₴" }
    ]
  },
  { day: 1, start: 14, duration: 1.5, title: "Бокс (дорослі)", meta: "Тренер Б", type: "individual", overlapIndex: 0, overlapTotal: 2 },
  { day: 1, start: 19, duration: 1.5, title: "ММА", meta: "8/10 записані", type: "group" },
  { day: 2, start: 18, duration: 1, title: "TRX", meta: "5/8 записані", type: "group" },
  { day: 2, start: 20, duration: 1, title: "Максим Т. (груди)", meta: "Індивідуальне", type: "individual" },
  { day: 3, start: 17, duration: 1.5, title: "Стретчинг", meta: "14/20 записані", type: "group" },
  { day: 4, start: 18, duration: 1.5, title: "Кросфіт", meta: "Місць немає", type: "group" },
  { day: 4, start: 20, duration: 1, title: "Дмитро В.", meta: "Індивідуальне", type: "individual" },
  { day: 5, start: 9, duration: 2, title: "Суботній буткемп", meta: "20/25 записані", type: "group" },
  { day: 5, start: 11.5, duration: 1, title: "Софія К. (кардіо)", meta: "Індивідуальне", type: "individual" },
  { day: 6, start: 10, duration: 1.5, title: "Стретчинг", meta: "10/20 записані", type: "group" },
];

const BEAUTY_EVENTS: CalendarEvent[] = [
  { day: 0, start: 10, duration: 4, title: "Фарбування", meta: "Балаяж", type: "service" },
  { day: 0, start: 15, duration: 2, title: "Манікюр", meta: "Гель", type: "service", prepaid: true },
  { day: 1, start: 12, duration: 1, title: "Стрижка", meta: "Жіноча", type: "service" },
  { day: 1, start: 18, duration: 2, title: "Манікюр", meta: "Нарощення", type: "service" },
  { day: 2, start: 9, duration: 3, title: "Фарбування", meta: "Корекція коренів", type: "service" },
  { day: 3, start: 14, duration: 2, title: "Педикюр", meta: "SPA", type: "service" },
  { day: 4, start: 18, duration: 2, title: "Манікюр", meta: "Дизайн + нарощення", type: "service", prepaid: true },
  { day: 5, start: 10, duration: 4, title: "Повне перевтілення", meta: "Фарбування + стрижка", type: "service" },
  { day: 6, start: 11, duration: 2, title: "Анна Р. (нігті)", meta: "Гель класика", type: "service", isVip: true },
];

const AUTO_EVENTS: CalendarEvent[] = [
  { day: 0, start: 9, duration: 4, title: "Заміна ременя ГРМ", meta: "Toyota Camry", type: "service" },
  { day: 0, start: 14, duration: 2, title: "Заміна мастила", meta: "Honda Civic", type: "service" },
  { day: 1, start: 8, duration: 9, title: "Капремонт двигуна", meta: "Ford F150", type: "service" },
  { day: 2, start: 10, duration: 2, title: "Діагностика", meta: "BMW 3 Series", type: "service", prepaid: true },
  { day: 3, start: 14, duration: 4, title: "Ремонт підвіски", meta: "Audi A4", type: "service" },
  { day: 4, start: 9, duration: 2, title: "Шиномонтаж", meta: "4 колеса", type: "service" },
  { day: 4, start: 12, duration: 3, title: "Колодки + диски", meta: "Mazda CX-5", type: "service" },
  { day: 5, start: 9, duration: 2, title: "Заміна мастила", meta: "Subaru Outback", type: "service" },
];

const THEMES = {
  fitness: {
    id: "fitness",
    label: "Фітнес",
    bg: "bg-gray-950",
    text: "text-gray-100",
    headerBg: "bg-gray-950/80 border-gray-800",
    buttonBg: "bg-orange-500 text-white hover:bg-orange-400",
    buttonOutline: "border border-gray-700 text-gray-300 hover:bg-gray-800",
    accent: "bg-orange-500",
    title: "Зосередься на тренуванні.",
    subtitle: "Решту беремо на себе.",
    desc: "Зручний онлайн-запис для твоїх клієнтів. Жодних нічних переписок — розклад заповнюється сам.",
    calBg: "bg-gray-900 border-gray-800",
    calGridLine: "border-gray-800/60",
    calTimeText: "text-gray-600",
    headerHoliday: "text-rose-400 bg-rose-500/10",
    headerNormal: "text-gray-400 bg-gray-800/60",
    events: FITNESS_EVENTS,
    icon: "fitness",
    getStyle: (ev: CalendarEvent) => {
      if (ev.type === "group") return "bg-orange-500/15 border-orange-500/40 text-orange-400";
      return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
    }
  },
  beauty: {
    id: "beauty",
    label: "Б'юті",
    bg: "bg-[#FDF2F8]",
    text: "text-[#831843]",
    headerBg: "bg-[#FDF2F8]/80 border-pink-200",
    buttonBg: "bg-pink-500 text-white hover:bg-pink-600",
    buttonOutline: "border border-pink-200 text-pink-700 hover:bg-pink-50",
    accent: "bg-pink-500",
    title: "Твої записи,",
    subtitle: "ідеально організовані.",
    desc: "Красиве посилання для запису в Instagram-біо. Клієнти записуються самі, а передоплата захищає від «не прийду».",
    calBg: "bg-white border-pink-100 shadow-xl shadow-pink-200/20",
    calGridLine: "border-pink-100/60",
    calTimeText: "text-pink-300",
    headerHoliday: "text-rose-600 bg-rose-100",
    headerNormal: "text-pink-400 bg-pink-50",
    events: BEAUTY_EVENTS,
    icon: "beauty",
    getStyle: (ev: CalendarEvent) => "bg-pink-100/80 border-pink-200 text-pink-800"
  },
  service: {
    id: "service",
    label: "Автосервіс",
    bg: "bg-slate-900",
    text: "text-slate-100",
    headerBg: "bg-slate-900/80 border-slate-700",
    buttonBg: "bg-blue-600 text-white hover:bg-blue-500",
    buttonOutline: "border border-slate-600 text-slate-300 hover:bg-slate-800",
    accent: "bg-blue-600",
    title: "Ти ремонтуєш авто.",
    subtitle: "Ми заповнюємо бокси.",
    desc: "Онлайн-запис на сервіс без дзвінків: клієнти бачать вільні слоти, а нагадування зменшують неявки.",
    calBg: "bg-slate-800 border-slate-700 shadow-2xl shadow-blue-900/10",
    calGridLine: "border-slate-700/60",
    calTimeText: "text-slate-500",
    headerHoliday: "text-rose-400 bg-rose-950/40",
    headerNormal: "text-slate-400 bg-slate-800/60",
    events: AUTO_EVENTS,
    icon: "auto",
    getStyle: (ev: CalendarEvent) => "bg-blue-500/15 border-blue-500/30 text-blue-300"
  }
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const ROW_HEIGHT = 60;

const NICHE_ICONS: Record<string, React.ReactNode> = {
  fitness: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  beauty: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
  auto: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
};

export default function LandingClient({ initialTheme, lockTheme = false }: { initialTheme: string; lockTheme?: boolean }) {
  const [activeThemeId, setActiveThemeId] = useState(
    THEMES[initialTheme as keyof typeof THEMES] ? initialTheme : "fitness"
  );

  const theme = THEMES[activeThemeId as keyof typeof THEMES];

  return (
    <div className={clsx("flex flex-col min-h-screen font-sans transition-colors duration-500", theme.bg, theme.text)}>
      {/* Top Header */}
      <header className={clsx("flex items-center justify-between px-6 py-4 sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500", theme.headerBg)}>
        <Link href="/" className="flex items-center gap-2">
          <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black", theme.buttonBg)}>Z</div>
          <span className="text-lg font-bold tracking-tight">Zilo<span className="opacity-40">book</span></span>
        </Link>
        <div className="flex items-center gap-4">
          {FEATURES.marketplace && (
            <Link href="/explore" className="text-sm font-medium hover:opacity-70 transition-opacity hidden md:block">
              Знайти майстра
            </Link>
          )}
          <Link href="/login" className={clsx("px-5 py-2.5 text-sm font-bold rounded-xl transition-colors hidden sm:block", theme.buttonOutline)}>
            Увійти
          </Link>
          <Link href="/register" className={clsx("px-5 py-2.5 text-sm font-bold rounded-xl transition-colors", theme.buttonBg)}>
            Почати безкоштовно
          </Link>
        </div>
      </header>

      {/* Theme Toggler (hidden on niche-locked domains) */}
      {!lockTheme && (
        <div className="w-full flex justify-center mt-8 px-4">
          <div className="inline-flex items-center p-1 rounded-2xl bg-black/5 dark:bg-white/10 backdrop-blur-sm shadow-inner z-10 border border-black/10 dark:border-white/10 overflow-x-auto max-w-full gap-1">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThemeId(t.id)}
                className={clsx(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                  activeThemeId === t.id
                    ? `${theme.buttonBg} shadow-sm`
                    : "opacity-60 hover:opacity-100"
                )}
              >
                {NICHE_ICONS[t.icon]}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-16 text-center overflow-x-hidden">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 transition-all leading-[1.1]">
          {theme.title}<br />
          <span className="opacity-40">{theme.subtitle}</span>
        </h1>
        <p className="text-lg md:text-xl opacity-60 max-w-2xl mb-14 transition-all font-medium">
          {theme.desc}
        </p>

        {/* Weekly Calendar Dashboard */}
        <div className="w-full mt-4 perspective-1000 relative max-w-full overflow-x-auto pb-8 hide-scrollbar">
          <div className={clsx("absolute inset-0 blur-3xl opacity-15 -z-10 rounded-full", theme.accent)}></div>

          <div className={clsx(
            "min-w-[800px] w-full rounded-2xl p-6 border transition-colors duration-500",
            theme.calBg
          )}>

             {/* Header Row (Days) */}
             <div className="flex ml-16 border-b pb-4 mb-4" style={{ borderColor: 'inherit' }}>
                {DAYS.map((day, idx) => {
                  const isWeekend = idx >= 5;
                  return (
                    <div key={day} className="flex-1 text-center">
                      <div className={clsx("inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest",
                        isWeekend ? theme.headerHoliday : theme.headerNormal)}>
                        {day}
                      </div>
                    </div>
                  );
                })}
             </div>

             {/* Calendar Body Grid */}
             <div className="relative flex" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>

                {/* Y-Axis: Time Labels */}
                <div className="w-16 flex flex-col pt-1" style={{ height: '100%' }}>
                  {HOURS.map((h) => (
                    <div key={h} className={clsx("text-xs font-medium text-right pr-4", theme.calTimeText)} style={{ height: `${ROW_HEIGHT}px` }}>
                      {`${String(h).padStart(2, "0")}:00`}
                    </div>
                  ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute top-0 right-0 left-16 bottom-0 pointer-events-none flex flex-col">
                   {HOURS.map((h) => (
                     <div key={h} className={clsx("w-full border-t border-dashed", theme.calGridLine)} style={{ height: `${ROW_HEIGHT}px` }}></div>
                   ))}
                </div>

                {/* Day Columns */}
                <div className="flex-1 flex ml-0 relative">
                   {DAYS.map((day, dIdx) => (
                      <div key={day} className={clsx("flex-1 relative border-l border-dashed", theme.calGridLine)}>
                         {theme.events.filter(e => e.day === dIdx).map((ev, eIdx) => {
                            const topPx = (ev.start - 8) * ROW_HEIGHT + 2;
                            const heightPx = (ev.duration * ROW_HEIGHT) - 4;
                            const overlapTotal = ev.overlapTotal || 1;
                            const overlapIndex = ev.overlapIndex || 0;
                            const leftPct = `calc(${(overlapIndex / overlapTotal) * 100}% + 2px)`;
                            const widthPct = `calc(${(1 / overlapTotal) * 100}% - 4px)`;

                            return (
                               <div
                                 key={eIdx}
                                 className={clsx(
                                    "absolute rounded-xl p-2 border flex flex-col hover:z-50 hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-default backdrop-blur-md",
                                    ev.showTooltip ? "overflow-visible" : "overflow-hidden",
                                    theme.getStyle(ev)
                                 )}
                                 style={{
                                    top: `${topPx}px`,
                                    height: `${heightPx}px`,
                                    left: leftPct,
                                    width: widthPct,
                                    zIndex: ev.showTooltip ? 100 : 10 + overlapIndex
                                 }}
                               >
                                 <div className="flex items-start justify-between gap-1 w-full relative z-10 hidden sm:flex">
                                    <span className="font-bold text-xs truncate">
                                      {ev.isVip && <span className="mr-1 inline-flex items-center justify-center px-1 py-0.5 bg-yellow-400 text-yellow-900 rounded text-[8px] font-black">VIP</span>}
                                      {ev.title}
                                    </span>
                                    {ev.prepaid && (
                                       <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 rounded border border-current opacity-60 whitespace-nowrap hidden md:inline-block">Оплачено</span>
                                    )}
                                 </div>
                                 <div className="flex sm:hidden font-bold text-[10px] truncate">{ev.title}</div>
                                 <span className="text-[11px] opacity-70 mt-auto truncate block z-10 hidden sm:block">{ev.meta}</span>

                                 {/* Tooltip */}
                                 {ev.showTooltip && (
                                   <div className={clsx(
                                     "absolute top-1/2 left-[105%] -translate-y-1/2 w-48 shadow-2xl rounded-xl p-4 !z-[100] pointer-events-none text-left border",
                                     activeThemeId === "beauty"
                                       ? "bg-white border-pink-200 shadow-pink-200/30"
                                       : activeThemeId === "service"
                                       ? "bg-slate-700 border-slate-600 shadow-blue-900/30"
                                       : "bg-gray-800 border-gray-700 shadow-gray-900/50"
                                   )}>
                                      <div className={clsx("text-sm font-bold mb-2 pb-2 border-b",
                                        activeThemeId === "beauty" ? "text-pink-900 border-pink-100" : "text-gray-100 border-gray-600"
                                      )}>{ev.title}</div>
                                      <div className="flex flex-col gap-1.5">
                                         {ev.details?.map(d => (
                                           <div key={d.label} className="flex justify-between items-center text-xs">
                                             <span className={activeThemeId === "beauty" ? "text-pink-400" : "text-gray-400"}>{d.label}</span>
                                             <span className={clsx("font-bold", activeThemeId === "beauty" ? "text-pink-800" : "text-gray-200")}>{d.value}</span>
                                           </div>
                                         ))}
                                      </div>
                                      <div className={clsx("absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rotate-45 border-l border-b",
                                        activeThemeId === "beauty"
                                          ? "bg-white border-pink-200"
                                          : activeThemeId === "service"
                                          ? "bg-slate-700 border-slate-600"
                                          : "bg-gray-800 border-gray-700"
                                      )}></div>
                                   </div>
                                 )}
                               </div>
                            );
                         })}
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={clsx("border-t py-8 text-center text-sm opacity-40 font-medium", activeThemeId === "beauty" ? "border-pink-200" : "border-gray-800")}>
        Zilobook — онлайн-запис для незалежних професіоналів
      </footer>
    </div>
  );
}
