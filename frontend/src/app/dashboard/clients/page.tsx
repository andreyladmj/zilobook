"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";
import { fetchMyAppointments, type AppointmentResponse } from "@/lib/api";

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  sessions: number;
}

export default function ClientsPage() {
  const { th } = useTheme();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAppointments(1, 100)
      .then((data) => {
        const map = new Map<string, ClientRow>();
        for (const appt of data.appointments || []) {
          if (!appt.client.id || appt.client.full_name === "Open Slot") continue;
          const existing = map.get(appt.client.id);
          if (existing) {
            existing.sessions++;
          } else {
            map.set(appt.client.id, {
              id: appt.client.id,
              name: appt.client.full_name,
              phone: appt.client.phone || "—",
              sessions: 1,
            });
          }
        }
        setClients(Array.from(map.values()));
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 relative pb-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients Directory</h1>
          <p className={clsx("mt-1 font-medium", th.subText)}>Your clients aggregated from appointment history.</p>
        </div>
      </div>

      {loading ? (
        <div className={clsx("text-center py-20 font-semibold", th.subText)}>Loading clients...</div>
      ) : (
      <div className={clsx("rounded-2xl border shadow-sm overflow-hidden", th.cardBg, th.border)}>
         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className={clsx("border-b text-xs uppercase tracking-wider font-bold", th.tabBg, th.border, th.subText)}>
                     <th className="p-4 md:p-6">Name</th>
                     <th className="p-4 md:p-6">Phone</th>
                     <th className="p-4 md:p-6">Sessions</th>
                  </tr>
               </thead>
               <tbody>
                  {clients.map(client => (
                     <tr key={client.id} className={clsx("border-b last:border-0 transition-colors", th.border)}>
                        <td className="p-4 md:p-6 font-bold text-sm">{client.name}</td>
                        <td className={clsx("p-4 md:p-6 text-sm font-medium", th.subText)}>
                          {client.phone !== "—" ? (
                            <a href={`tel:${client.phone}`} className={clsx("hover:underline", th.accent)}>{client.phone}</a>
                          ) : "—"}
                        </td>
                        <td className="p-4 md:p-6 text-sm font-semibold">{client.sessions}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {clients.length === 0 && (
            <div className={clsx("p-10 text-center font-medium", th.subText)}>No clients yet. Clients will appear here once they book appointments.</div>
         )}
      </div>
      )}
    </div>
  );
}
