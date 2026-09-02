"use client";

import { useState, useEffect } from "react";
import { useTheme, THEMES, type ThemeKey } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { fetchSettings, updateSettings, fetchMyLocations, fetchWorkingHours, updateWorkingHours, type SettingsResponse, type Location, type CreateWorkingHoursRequest } from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function SettingsPage() {
  const { th, themeId, setThemeId } = useTheme();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const [allowSelfBooking, setAllowSelfBooking] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [minLeadHours, setMinLeadHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [slotDuration, setSlotDuration] = useState(60);
  const [slotGap, setSlotGap] = useState(0);
  const [cancellationHours, setCancellationHours] = useState(24);

  // Locations and Working Hours states
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [workingHours, setWorkingHours] = useState<CreateWorkingHoursRequest[]>([]);

  useEffect(() => {
    setUser(getUser());
    
    // Load Settings
    fetchSettings()
      .then((s) => {
        setSettings(s);
        setAllowSelfBooking(s.allow_client_self_booking);
        setRequireApproval(s.require_booking_approval);
        setMinLeadHours(s.min_booking_lead_hours);
        setMaxAdvanceDays(s.max_booking_advance_days);
        setSlotDuration(s.slot_duration_minutes);
        setSlotGap(s.slot_gap_minutes);
        setCancellationHours(s.cancellation_window_hours);
        if (s.theme && s.theme !== "default") {
          setThemeId(s.theme as any);
        }
      })
      .catch(() => {});

    // Load Locations
    fetchMyLocations()
      .then(data => {
        const locs = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocId(locs[0].id);
        }
      })
      .catch(() => {});

    // Load Working Hours
    fetchWorkingHours()
      .then(data => {
        const mapped = (data || []).map(wh => ({
          location_id: wh.location_id,
          day_of_week: wh.day_of_week,
          start_time: wh.start_time.slice(0, 5),
          end_time: wh.end_time.slice(0, 5),
        }));
        setWorkingHours(mapped);
      })
      .catch(() => {});

    setLoading(false);
  }, [setThemeId]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      // 1. Update Booking settings
      const updated = await updateSettings({
        theme: themeId,
        allow_client_self_booking: allowSelfBooking,
        require_booking_approval: requireApproval,
        min_booking_lead_hours: minLeadHours,
        max_booking_advance_days: maxAdvanceDays,
        slot_duration_minutes: slotDuration,
        slot_gap_minutes: slotGap,
        cancellation_window_hours: cancellationHours,
      });
      setSettings(updated);

      // 2. Format and save Working Hours
      const payload = workingHours.map(wh => ({
        location_id: wh.location_id,
        day_of_week: wh.day_of_week,
        start_time: wh.start_time.split(":").length === 2 ? `${wh.start_time}:00` : wh.start_time,
        end_time: wh.end_time.split(":").length === 2 ? `${wh.end_time}:00` : wh.end_time,
      }));
      await updateWorkingHours(payload);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={clsx("p-10 text-center font-semibold", th.subText)}>Завантажуємо налаштування...</div>;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 relative pb-24 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Налаштування</h1>
        <p className={clsx("mt-1 font-medium", th.subText)}>Профіль і правила запису.</p>
      </div>

      <div className={clsx("rounded-2xl border shadow-sm p-6 md:p-8 space-y-8", th.cardBg, th.border)}>

         {success && (
           <div className={clsx("p-3 rounded-xl text-sm text-center font-semibold", th.successText, "bg-emerald-500/10 border border-emerald-500/20")}>Налаштування збережено!</div>
         )}

         {/* Profile */}
         <div className={clsx("pb-6 border-b", th.border)}>
            <h3 className="font-bold text-lg mb-4">Профіль</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-1", th.subText)}>Ім&apos;я</label>
                <p className="font-semibold">{user?.full_name || "—"}</p>
              </div>
              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-1", th.subText)}>Роль</label>
                <p className="font-semibold">{user?.role === "PROFESSIONAL" ? "Майстер" : user?.role === "CLIENT" ? "Клієнт" : "—"}</p>
              </div>
            </div>
         </div>

         {/* Theme */}
         <div className={clsx("pb-6 border-b", th.border)}>
            <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-3", th.subText)}>Тема</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map(t => {
                const isActive = themeId === t;
                const previewBg = t === "default" ? "bg-gray-100" : t === "fitness" ? "bg-gray-900" : t === "beauty" ? "bg-pink-50" : t === "service" ? "bg-slate-800" : "bg-[#0A0E27]";
                const previewText = t === "default" ? "text-gray-900" : t === "fitness" ? "text-orange-500" : t === "beauty" ? "text-pink-500" : t === "service" ? "text-blue-400" : "text-indigo-400";
                const previewDot = t === "default" ? "bg-gray-900" : t === "fitness" ? "bg-orange-500" : t === "beauty" ? "bg-pink-500" : t === "service" ? "bg-blue-500" : "bg-indigo-500";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setThemeId(t)}
                    className={clsx(
                      "relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all cursor-pointer",
                      isActive
                        ? clsx("shadow-lg scale-[1.02]", previewBg, previewText)
                        : clsx("opacity-50 hover:opacity-80", previewBg, previewText),
                    )}
                  >
                    <div className={clsx("w-8 h-8 rounded-full", previewDot)}></div>
                    <span className="text-xs font-bold">{THEMES[t].name}</span>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
         </div>

         {/* Booking Rules */}
         <div className={clsx("pb-6 border-b", th.border)}>
            <h3 className="font-bold text-lg mb-6">Правила запису</h3>
            <div className="space-y-6">
               <label className="flex items-center justify-between cursor-pointer">
                  <div>
                     <p className="font-bold">Самостійний запис</p>
                     <p className={clsx("text-sm", th.subText)}>Клієнти можуть записуватися без вашого схвалення.</p>
                  </div>
                  <div className={clsx("w-14 h-8 rounded-full p-1 transition-colors cursor-pointer", allowSelfBooking ? "bg-emerald-500" : th.tabBg)} onClick={() => setAllowSelfBooking(!allowSelfBooking)}>
                     <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${allowSelfBooking ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
               </label>

               <label className="flex items-center justify-between cursor-pointer">
                  <div>
                     <p className="font-bold">Підтвердження записів</p>
                     <p className={clsx("text-sm", th.subText)}>Нові записи чекають на ваше підтвердження.</p>
                  </div>
                  <div className={clsx("w-14 h-8 rounded-full p-1 transition-colors cursor-pointer", requireApproval ? "bg-emerald-500" : th.tabBg)} onClick={() => setRequireApproval(!requireApproval)}>
                     <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${requireApproval ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
               </label>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Не пізніше ніж за (годин)</label>
                   <input type="number" value={minLeadHours} onChange={e => setMinLeadHours(Number(e.target.value))} min={0} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
                 </div>
                 <div>
                   <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Не раніше ніж за (днів)</label>
                   <input type="number" value={maxAdvanceDays} onChange={e => setMaxAdvanceDays(Number(e.target.value))} min={1} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
                 </div>
                 <div>
                   <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Тривалість слота (хвилин)</label>
                   <input type="number" value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} min={15} step={15} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
                 </div>
                 <div>
                   <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Перерва між слотами (хв)</label>
                   <input type="number" value={slotGap} onChange={e => setSlotGap(Number(e.target.value))} min={0} step={5} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
                 </div>
                 <div className="md:col-span-2">
                   <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Скасування не пізніше ніж за (годин)</label>
                   <input type="number" value={cancellationHours} onChange={e => setCancellationHours(Number(e.target.value))} min={0} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} />
                 </div>
               </div>
            </div>
         </div>

         {/* Working Hours Settings */}
         {locations.length > 0 && (
           <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg">Робочі години</h3>
                <p className={clsx("text-sm mt-1", th.subText)}>Ваш тижневий графік по кожній локації.</p>
              </div>

              <div>
                <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Локація</label>
                <select
                  value={selectedLocId}
                  onChange={e => setSelectedLocId(e.target.value)}
                  className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)}
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"].map((dayName, index) => {
                  const activeRecord = workingHours.find(wh => wh.location_id === selectedLocId && wh.day_of_week === index);
                  const isEnabled = !!activeRecord;
                  const startTime = activeRecord?.start_time || "09:00";
                  const endTime = activeRecord?.end_time || "18:00";

                  const toggleDay = () => {
                    if (isEnabled) {
                      setWorkingHours(prev => prev.filter(wh => !(wh.location_id === selectedLocId && wh.day_of_week === index)));
                    } else {
                      setWorkingHours(prev => [...prev, {
                        location_id: selectedLocId,
                        day_of_week: index,
                        start_time: "09:00",
                        end_time: "18:00",
                      }]);
                    }
                  };

                  const updateTime = (field: "start_time" | "end_time", value: string) => {
                    setWorkingHours(prev => prev.map(wh => {
                      if (wh.location_id === selectedLocId && wh.day_of_week === index) {
                        return { ...wh, [field]: value };
                      }
                      return wh;
                    }));
                  };

                  return (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={toggleDay}
                          className="w-5 h-5 rounded accent-emerald-500"
                        />
                        <span className="font-bold text-sm">{dayName}</span>
                      </label>
                      {isEnabled && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={startTime}
                            onChange={e => updateTime("start_time", e.target.value)}
                            className={clsx("px-3 py-1.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-1", th.inputBg, th.border)}
                          />
                          <span className={clsx("text-xs font-bold", th.subText)}>до</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={e => updateTime("end_time", e.target.value)}
                            className={clsx("px-3 py-1.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-1", th.inputBg, th.border)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
           </div>
         )}

         <button onClick={handleSave} disabled={saving} className={clsx("w-full py-4 mt-4 rounded-xl font-bold tracking-wide transition-colors shadow-sm disabled:opacity-50", th.brand)}>
           {saving ? "Зберігаємо..." : "Зберегти налаштування"}
         </button>
      </div>
    </div>
  );
}
