"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { clsx } from "clsx";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { createAppointment } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";

function CheckoutEngine() {
  const router = useRouter();
  const { th } = useTheme();
  const searchParams = useSearchParams();
  const proId = searchParams.get("professional_id") || "";
  const locId = searchParams.get("location_id") || "";
  const startTime = searchParams.get("start") || "";
  const endTime = searchParams.get("end") || "";
  const rawTime = searchParams.get("time") || "Select Time";
  const rawDate = searchParams.get("date") || "Select Date";

  const user = getUser();
  const loggedIn = isLoggedIn();

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMode, setSuccessMode] = useState(false);

  const formattedDate = rawDate !== "Select Date"
    ? new Date(rawDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : rawDate;

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
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Booking Confirmed!</h2>
          <p className={clsx("font-medium text-lg mt-3 max-w-md mx-auto", th.subText)}>Your appointment has been successfully booked. You&apos;ll find all details in your dashboard.</p>
        </div>
        <div className={clsx("rounded-2xl p-5 border w-full max-w-sm", th.tabBg, th.border)}>
          <div className="flex items-center justify-between mb-3">
            <span className={clsx("text-sm font-bold uppercase tracking-wider", th.subText)}>Date</span>
            <span className="font-bold">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={clsx("text-sm font-bold uppercase tracking-wider", th.subText)}>Time</span>
            <span className="font-bold">{rawTime}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.push('/dashboard')} className={clsx("flex-1 py-4 font-bold rounded-xl transition-colors", th.brand)}>Go to Dashboard</button>
          <button onClick={() => router.push('/explore')} className={clsx("py-4 px-6 font-bold rounded-xl transition-colors", th.tabBg)}>Browse More</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={clsx("rounded-2xl p-6 shadow-sm border", th.cardBg, th.border)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Appointment Details</h2>
          <button onClick={() => router.back()} className={clsx("text-sm font-bold transition-colors flex items-center gap-1", th.subText)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Change
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={clsx("rounded-xl p-4", th.tabBg)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-1", th.subText)}>Date</p>
            <p className="font-bold">{formattedDate}</p>
          </div>
          <div className={clsx("rounded-xl p-4", th.tabBg)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-1", th.subText)}>Time</p>
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
            <p className="font-bold text-lg">Sign in to complete your booking</p>
            <p className={clsx("text-sm mt-1", th.subText)}>You need an account to book appointments.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/login")} className={clsx("flex-1 py-4 rounded-xl font-bold transition-colors", th.brand)}>Sign In</button>
            <button onClick={() => router.push("/register")} className={clsx("flex-1 py-4 border rounded-xl font-bold transition-colors", th.border)}>Create Account</button>
          </div>
        </div>
      ) : (
        <>
          <div className={clsx("rounded-2xl p-6 shadow-sm border", th.cardBg, th.border)}>
            <p className={clsx("text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Booking As</p>
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
            <label className={clsx("block text-[11px] font-bold uppercase tracking-widest mb-3", th.subText)}>Notes for Professional (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={clsx("w-full px-4 py-4 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px] text-sm resize-none transition-shadow", th.inputBg, th.border, th.inputFocus)}
              placeholder="Anything they should know before you arrive?"
            />
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className={clsx("w-full py-5 rounded-2xl font-bold text-lg tracking-wide shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3", th.brand)}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Booking...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Confirm Booking</>
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
          <h1 className="font-bold">Checkout</h1>
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
  return <ThemeProvider><CheckoutInner /></ThemeProvider>;
}
