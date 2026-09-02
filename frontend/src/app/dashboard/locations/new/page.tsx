"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { createLocation } from "@/lib/api";

// Displayed labels → backend location type values
const TYPE_MAP: Record<string, string> = {
  "Зал / Фітнес-центр": "Gym",
  "Салон краси": "Saloon",
  "СТО / Автосервіс": "Station",
  "Приватний кабінет": "Workspace",
};

export default function NewLocationPage() {
  const router = useRouter();
  const { th } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "Зал / Фітнес-центр",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createLocation({
        name: form.name,
        type: TYPE_MAP[form.type] || "Gym",
        address: form.address,
        description: form.description || undefined,
      });
      router.push("/dashboard/locations");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto min-h-screen p-4 md:p-10 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:opacity-80", th.cardBg, th.border, th.text)}>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Нова локація</h1>
      </div>

      <form onSubmit={handleSubmit} className={clsx("rounded-2xl border shadow-sm p-6 md:p-8 space-y-8", th.cardBg, th.border)}>
         {error && (
           <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">{error}</div>
         )}

         <div className={clsx("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors", th.border, th.tabBg)}>
            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p className={clsx("text-sm font-bold", th.subText)}>Фото локації (незабаром)</p>
         </div>

         <div className="space-y-6">
            <div>
               <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Назва</label>
               <input name="name" value={form.name} onChange={handleChange} type="text" required className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} placeholder="напр. Студія в центрі" />
            </div>

            <div>
               <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Адреса</label>
               <input name="address" value={form.address} onChange={handleChange} type="text" required className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)} placeholder="Вулиця, місто" />
            </div>

            <div>
               <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Тип закладу</label>
               <select name="type" value={form.type} onChange={handleChange} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2", th.inputBg, th.border, th.inputFocus)}>
                 <option>Зал / Фітнес-центр</option>
                 <option>Салон краси</option>
                 <option>СТО / Автосервіс</option>
                 <option>Приватний кабінет</option>
               </select>
            </div>

            <div>
               <label className={clsx("block text-xs font-bold uppercase tracking-wider mb-2", th.subText)}>Опис (необов&apos;язково)</label>
               <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={clsx("w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 resize-none", th.inputBg, th.border, th.inputFocus)} placeholder="Розкажіть про це місце..." />
            </div>
         </div>

         <button
           type="submit"
           disabled={loading}
           className={clsx("w-full py-4 rounded-xl font-bold tracking-wide transition-colors disabled:opacity-50", th.brand)}
         >
           {loading ? "Зберігаємо..." : "Зберегти локацію"}
         </button>
      </form>
    </div>
  );
}
