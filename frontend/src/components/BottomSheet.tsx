"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { clsx } from "clsx";

export type ClientData = {
  id: string;
  client: string | null;
  service?: string;
  status?: "Confirmed" | "Pending" | "Cancelled";
  duration?: string;
  phone?: string;
  notes?: string;
  locationName?: string;
  attendees?: { name: string }[] | null;
  isBlock?: boolean;
  blockReason?: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDeleteBlock?: (id: string) => void;
}

export default function BottomSheet({ isOpen, onClose, client, onConfirm, onCancel, onDeleteBlock }: BottomSheetProps) {
  const router = useRouter();
  const { th } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!mounted) return null;

  const handleConfirm = async () => {
    if (!client || !onConfirm) return;
    setActionLoading("confirm");
    try {
      await onConfirm(client.id);
      onClose();
    } finally {
      setActionLoading("");
    }
  };

  const handleCancel = async () => {
    if (!client || !onCancel) return;
    setActionLoading("cancel");
    try {
      await onCancel(client.id);
      onClose();
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteBlock = async () => {
    if (!client || !onDeleteBlock) return;
    setActionLoading("deleteBlock");
    try {
      await onDeleteBlock(client.id);
      onClose();
    } finally {
      setActionLoading("");
    }
  };

  const handleReschedule = () => {
    if (!client) return;
    onClose();
    router.push(`/dashboard/calendar/new?edit=${client.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] p-6 pb-12 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        th.cardBg, th.text,
        isOpen ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className={clsx("w-12 h-1.5 rounded-full mx-auto mb-6", th.tabBg)} />

        {client && client.isBlock ? (
          <div className="space-y-6">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-2xl font-bold tracking-tight">{client.blockReason || client.client || "Blocked Time"}</h3>
                 <p className={clsx("font-medium mt-1", th.subText)}>Personal or Unavailable</p>
               </div>
               <span className={clsx("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl", th.tabBg, th.subText)}>
                 Block
               </span>
             </div>
             <div className="pt-4 flex flex-col gap-3">
               <button onClick={() => { onClose(); router.push('/dashboard/calendar/new'); }} className={clsx("w-full py-4 rounded-2xl font-bold transition-colors", th.brand)}>
                 Edit Block
               </button>
               <button
                 onClick={handleDeleteBlock}
                 disabled={actionLoading === "deleteBlock"}
                 className={clsx("w-full py-4 rounded-2xl font-bold transition-colors disabled:opacity-50", th.dangerBg)}
               >
                 {actionLoading === "deleteBlock" ? "Removing..." : "Remove Block"}
               </button>
             </div>
          </div>
        ) : client && (
          <div className="space-y-6">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-2xl font-bold tracking-tight">{client.client}</h3>
                 <p className={clsx("font-medium mt-1", th.subText)}>{client.service} • {client.duration}</p>
                 {client.phone && (
                   <a href={`tel:${client.phone}`} className={clsx("inline-block font-bold text-sm mt-1", th.accent, "hover:underline")}>{client.phone}</a>
                 )}
               </div>
               <span className={clsx("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl",
                 client.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                 client.status === 'Confirmed' ? clsx(th.tabBg, th.text) : th.pendingBadge
               )}>
                 {client.status}
               </span>
             </div>

             {client.locationName && (
               <p className={clsx("text-sm font-medium", th.subText)}>Location: {client.locationName}</p>
             )}

             {client.notes && (
               <div className={clsx("p-4 rounded-2xl border", th.tabBg, th.border)}>
                  <p className={clsx("text-xs font-bold uppercase tracking-widest mb-2", th.subText)}>Notes</p>
                  <p className="text-sm">{client.notes}</p>
               </div>
             )}

             {client.attendees && (
               <div className={clsx("p-4 rounded-2xl border", th.tabBg, th.border)}>
                  <p className={clsx("text-xs font-bold uppercase tracking-widest mb-2", th.subText)}>Group Attendees</p>
                  <ul className="space-y-2">
                    {client.attendees.map((a, i) => (
                      <li key={i} className={clsx("text-sm font-medium border-b pb-2 last:border-0", th.border)}>{a.name}</li>
                    ))}
                  </ul>
               </div>
             )}

             <div className="pt-4 flex flex-col gap-3">
               {client.status === 'Pending' && (
                  <button
                    onClick={handleConfirm}
                    disabled={!!actionLoading}
                    className={clsx("w-full py-4 rounded-2xl text-white font-bold transition-colors disabled:opacity-50", th.successBg)}
                  >
                    {actionLoading === "confirm" ? "Confirming..." : "Confirm Appointment"}
                  </button>
               )}
               <button
                 onClick={handleReschedule}
                 className={clsx("w-full py-4 rounded-2xl font-bold transition-colors", th.brand)}
               >
                 Edit/Reschedule
               </button>
               <button
                 onClick={() => { onClose(); router.push('/dashboard/calendar/new'); }}
                 className={clsx("w-full py-4 rounded-2xl border font-bold transition-colors", th.cardBg, th.border, th.text)}
               >
                 Add a new event
               </button>
               <button
                 onClick={handleCancel}
                 disabled={!!actionLoading}
                 className={clsx("w-full py-4 rounded-2xl font-bold transition-colors disabled:opacity-50", th.dangerBg)}
               >
                 {actionLoading === "cancel" ? "Cancelling..." : `Cancel & Notify ${client.attendees ? 'All' : 'Client'}`}
               </button>
             </div>
          </div>
        )}
      </div>
    </>
  );
}
