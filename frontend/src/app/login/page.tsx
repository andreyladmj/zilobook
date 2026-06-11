"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login as apiLogin, saveTokens } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const data = await apiLogin({
        phone: formData.phone,
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
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="+380..." required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow" placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center">Don&apos;t have an account? <Link href="/register" className="text-gray-900 font-semibold hover:underline">Sign up</Link></p>
      </div>
    </div>
  );
}
