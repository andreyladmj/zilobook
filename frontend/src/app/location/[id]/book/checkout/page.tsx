"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { clsx } from "clsx";
import { ThemeProvider, useTheme, themeForLocationType } from "@/components/ThemeProvider";
import { createAppointment, fetchLocation, getTelegramLink } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";

// Prompt shown after a successful booking: connect Telegram to get reminders.
function TelegramReminderPrompt() {
  const { th } = useTheme();
  const [state, setState] = useState<"loading" | "linked" | "ready" | "hidden">("loading");
  const [deepLink, setDeepLink] = useState("");

  useEffect(() => {
    getTelegramLink()
      .then((res) => {
        if (!res) { setState("hidden"); return; } // feature disabled server-side
        if (res.linked) { setState("linked"); return; }
        setDeepLink(res.deep_link || "");
        setState("ready");
      })
      .catch(() => setState("hidden"));
  }, []);

  if (state === "hidden" || state === "loading") return null;

  if (state === "linked") {
    return (
      <div className={clsx("rounded-2xl p-4 border w-full max-w-sm flex items-center gap-3", th.tabBg, th.border)}>
        <span className="text-xl">📲</span>
        <p className={clsx("text-sm font-medium", th.subText)}>Нагадування надійдуть вам у Telegram.</p>
      </div>
    );
  }

  return (
    <a
      href={deepLink}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "#229ED9" }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.6l-3.32 15.66c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.14L17.4 6.4c.4-.36-.09-.56-.62-.2L6.9 12.56l-4.98-1.56c-1.08-.34-1.1-1.08.23-1.6l19.46-7.5c.9-.33 1.69.2 1.33 1.7z"/></svg>
      Підключити Telegram для нагадувань
    </a>
  );
}

function CheckoutEngine() {
  const router = useRouter();
  const { th, setThemeId } = useTheme();
  const searchParams = useSearchParams();
  const proId = searchParams.get("professional_id") || "";
  const locId = searchParams.get("location_id") || "";
  const startTime = searchParams.get("start") || "";
  const endTime = searchParams.get("end") || "";
  const rawTime = searchParams.get("time") || "—";
  const rawDate = searchParams.get("date") || "";

  const user = getUser();
  const loggedIn = isLoggedIn();

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMode, setSuccessMode] = useState(false);

  useEffect(() => {
    if (!locId) return;
    fetchLocation(locId)
      .then((loc) => setThemeId(themeForLocationType(loc.type)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locId]);

  const formattedDate = rawDate
    ? new Date(rawDate + "T00:00:00").toLocaleDateString("uk-UA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "—";

  const handleConfirmBooking = async () => {
    if (!loggedIn) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      await createAppointment({ location_id: locId, professional_id: proId, start_time: startTime, end_time: endTime, client_notes: notes || undefined });
      setSuccessMode(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successMode) {
    return (
      <div className="flex flex-col items-center text-center space-y-8 py-10">
        <div className="relative">
          <div className={clsx("w-24 h-24 text-white rounded-full flex items-center justify-center shadow-xl", th.successCircle)}>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          </div>
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Запис підтверджено!</h2>
          <p className={clsx("font-medium text-lg mt-3 max-w-md mx-auto", th.subText)}>Ваш запис успішно створено. Усі деталі — у вашому кабінеті.</p>
        </div>
        <div className={clsx("rounded-2xl p-5 border w-full max-w-sm", th.tabBg, th.border)}>
          <div className="flex items-center justify-between mb-3">
            <span className={clsx("text-sm font-bold uppercase tracking-wider", th.subText)}>Дата</span>
            <span className="font-bold">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={clsx("text-sm font-bold uppercase tracking-wider", th.subText)}>Час</span>
            <span className="font-bold">{rawTime}</span>
          </div>
        </div>
        <TelegramReminderPrompt />
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.push('/bookings')} className={clsx("flex-1 py-4 font-bold rounded-xl transition-colors", th.brand)}>Мої записи</button>
          <button onClick={() => router.push('/')} className={clsx("py-4 px-6 font-bold rounded-xl transition-colors", th.tabBg)}>На головну</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={clsx("rounded-2xl p-6 shadow-sm border", th.cardBg, th.border)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Деталі запису</h2>
          <button onClick={() => router.back()} className={clsx("text-sm font-bold transition-colors flex items-center gap-1", th.subText)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Змінити
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={clsx("rounded-xl p-4", th.tabBg)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-1", th.subText)}>Дата</p>
            <p className="font-bold">{formattedDate}</p>
          </div>
          <div className={clsx("rounded-xl p-4", th.tabBg)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-1", th.subText)}>Час</p>
            <p className="font-bold text-xl">{rawTime}</p>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">{error}</div>}

      {!loggedIn ? (
        <div className={clsx("rounded-2xl p-8 shadow-sm border text-center space-y-5", th.cardBg, th.border)}>
          <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", th.tabBg)}>
            <svg className={clsx("w-7 h-7", th.accent)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <div>
            <p className="font-bold text-lg">Увійдіть, щоб завершити запис</p>
            <p className={clsx("text-sm mt-1", th.subText)}>Для запису потрібен акаунт — це займе хвилину.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/login")} className={clsx("flex-1 py-4 rounded-xl font-bold transition-colors", th.brand)}>Увійти</button>
            <button onClick={() => router.push("/register")} className={clsx("flex-1 py-4 border rounded-xl font-bold transition-colors", th.border)}>Створити акаунт</button>
          </div>
        </div>
      ) : (
        <>
          <div className={clsx("rounded-2xl p-6 shadow-sm border", th.cardBg, th.border)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Запис на ім'я</p>
            <div className="flex items-center gap-4">
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center font-bold", th.avatarBg)}>
                {user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-bold text-base">{user?.full_name}</p>
                {user?.phone && <p className={clsx("text-sm", th.subText)}>{user.phone}</p>}
              </div>
            </div>
          </div>

          <div className={clsx("rounded-2xl p-6 shadow-sm border", th.cardBg, th.border)}>
            <label className={clsx("block text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Коментар майстру (необов'язково)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={clsx("w-full px-4 py-4 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px] text-sm resize-none transition-shadow", th.inputBg, th.border, th.inputFocus)}
              placeholder="Щось, що варто знати перед вашим візитом?"
            />
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className={clsx("w-full py-5 rounded-2xl font-bold text-lg tracking-wide shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3", th.brand)}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Записуємо...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Підтвердити запис</>
            )}
          </button>
        </>
      )}
    </div>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const { th } = useTheme();
  return (
    <div className={clsx("min-h-screen font-sans transition-colors duration-500", th.bg, th.text)}>
      <header className={clsx("backdrop-blur-xl px-4 py-3 border-b sticky top-0 z-50 shadow-sm", th.headerGlass)}>
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm", th.cardBg, th.border)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="font-bold">Підтвердження запису</h1>
          <Link href="/" className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black", th.brand)}>Z</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
        <Suspense fallback={<div className="text-center py-16"><div className={clsx("w-8 h-8 border-4 rounded-full animate-spin mx-auto", th.border, "border-t-current")}></div></div>}>
          <CheckoutEngine />
        </Suspense>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <ThemeProvider persist={false}><CheckoutInner /></ThemeProvider>;
}
