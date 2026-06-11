"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { register as apiRegister, saveTokens } from "@/lib/auth";

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<"pro" | "client">("pro");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    niche: "Манікюр / б'юті",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const data = await apiRegister({
        full_name: formData.name,
        role: role === "pro" ? "PROFESSIONAL" : "CLIENT",
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
      });

      saveTokens(data);
      router.push("/dashboard");
    } catch (err: any) {
       setErrorMsg(err.message);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm font-black">Z</div>
            <span className="text-xl font-bold tracking-tight">Zilobook</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Створіть акаунт</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Онлайн-запис для вас і ваших клієнтів</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Role Toggle */}
          <div className="mb-6">
            <div className="flex p-1 bg-gray-100 rounded-xl relative">
               <div className={clsx(
                 "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300",
                 role === "pro" ? "left-1" : "left-[calc(50%+2px)]"
               )}></div>
               <button onClick={() => setRole("pro")} className={clsx("flex-1 py-2.5 text-sm font-semibold z-10 transition-colors", role === "pro" ? "text-gray-900" : "text-gray-500")}>Я майстер</button>
               <button onClick={() => setRole("client")} className={clsx("flex-1 py-2.5 text-sm font-semibold z-10 transition-colors", role === "client" ? "text-gray-900" : "text-gray-500")}>Я клієнт</button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
               {errorMsg}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            {role === "pro" ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Повне ім'я</label>
                  <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="Олена Коваленко" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Професія / ніша</label>
                  <select name="niche" value={formData.niche} onChange={handleChange} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow">
                     <option>Манікюр / б'юті</option>
                     <option>Фітнес-тренер</option>
                     <option>Автомеханік</option>
                     <option>Інша професія</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Повне ім'я</label>
                <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="Іван Шевченко" required />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Номер телефону</label>
              <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="+380..." required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email (необов'язково)</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="olena@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Пароль</label>
              <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="••••••••" required minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? "Створюємо..." : (role === "pro" ? "Почати свою справу" : "Створити акаунт")}
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center">Вже є акаунт? <Link href="/login" className="text-gray-900 font-semibold hover:underline">Увійти</Link></p>
      </div>
    </div>
  );
}
