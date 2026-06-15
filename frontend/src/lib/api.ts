import { authFetch } from "./auth";

// "" (empty string) is a valid value: same-origin requests, routed to the backend by Caddy in prod.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// --- Types ---

export interface LocationImage {
  id: string;
  image_url: string;
  display_order: number;
}

export interface Professional {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  bio: string | null;
  role_description: string | null;
}

export interface Location {
  id: string;
  owner_id?: string;
  name: string;
  title_slug: string;
  type: string;
  address: string;
  description?: string;
  images: LocationImage[];
  professionals?: Professional[];
  created_at: string;
}

export interface LocationListResponse {
  locations: Location[];
  total: number;
  page: number;
  per_page: number;
}

// --- Public fetches (no auth required) ---

export async function fetchLocations(params?: {
  type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<LocationListResponse> {
  const query = new URLSearchParams();
  if (params?.type && params.type !== "All") query.set("type", params.type);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));

  const res = await fetch(`${API_URL}/api/locations?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export async function fetchLocation(id: string): Promise<Location> {
  const res = await fetch(`${API_URL}/api/locations/${id}`);
  if (!res.ok) throw new Error("Location not found");
  return res.json();
}

// --- Authenticated fetches ---

export async function fetchMyLocations(): Promise<{ locations: Location[] }> {
  const res = await authFetch("/api/users/me/locations");
  if (!res.ok) throw new Error("Failed to fetch your locations");
  return res.json();
}

export async function createLocation(data: {
  name: string;
  type: string;
  address: string;
  description?: string;
}): Promise<Location> {
  const res = await authFetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create location");
  }
  return res.json();
}

// --- Notifications (Telegram) ---

export interface TelegramLinkResponse {
  linked: boolean;
  deep_link?: string;
}

// Returns a one-time deep link to connect Telegram, or {linked:true} if already done.
// Returns null if the feature is disabled server-side (no bot configured).
export async function getTelegramLink(): Promise<TelegramLinkResponse | null> {
  const res = await authFetch("/api/notifications/telegram/link");
  if (res.status === 503) return null;
  if (!res.ok) throw new Error("Failed to get Telegram link");
  return res.json();
}

// --- Professional search ---

export interface ProfessionalSearchResult {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string;
}

export interface ProfessionalSearchResponse {
  professionals: ProfessionalSearchResult[];
  total: number;
  page: number;
  per_page: number;
}

export async function searchProfessionals(
  query?: string,
  page = 1,
  perPage = 20
): Promise<ProfessionalSearchResponse> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  const res = await authFetch(`/api/professionals/search?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to search professionals");
  return res.json();
}

export async function fetchMyStaff(
  query?: string,
  page = 1,
  perPage = 40
): Promise<ProfessionalSearchResponse> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  const res = await authFetch(`/api/professionals/my-staff?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch staff");
  return res.json();
}

export async function linkProfessionalToLocations(
  professionalId: string,
  locationIds: string[]
): Promise<{ linked: number }> {
  const res = await authFetch("/api/professionals/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ professional_id: professionalId, location_ids: locationIds }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to link professional");
  }
  return res.json();
}

export async function unlinkProfessionalFromLocation(
  professionalId: string,
  locationId: string
): Promise<void> {
  const res = await authFetch("/api/professionals/unlink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ professional_id: professionalId, location_id: locationId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to unlink professional");
  }
}

// --- Booking & Availability ---

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  professional_id: string;
  location_id: string;
  slots: TimeSlot[];
}

export interface AppointmentResponse {
  id: string;
  location_id: string;
  location_name: string;
  professional: { id: string; full_name: string };
  client: { id: string; full_name: string; phone?: string };
  start_time: string;
  end_time: string;
  status: string;
  client_notes?: string;
  created_at: string;
}

export interface AppointmentListResponse {
  appointments: AppointmentResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface TodayScheduleItem {
  id: string;
  hour: string;
  client: string | null;
  client_phone?: string;
  service: string;
  status: string;
  duration: string;
  notes?: string;
  is_block: boolean;
  block_reason?: string;
}

export interface TodayScheduleResponse {
  date: string;
  items: TodayScheduleItem[];
  total_today: number;
  pending_count: number;
}

export async function fetchAvailability(
  professionalId: string,
  locationId: string,
  date: string
): Promise<AvailabilityResponse> {
  const res = await fetch(
    `${API_URL}/api/availability?professional_id=${professionalId}&location_id=${locationId}&date=${date}`
  );
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function createAppointment(data: {
  location_id: string;
  professional_id: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  client_notes?: string;
}): Promise<AppointmentResponse> {
  const res = await authFetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create appointment");
  }
  return res.json();
}

export async function fetchMyAppointments(
  page = 1,
  perPage = 20
): Promise<AppointmentListResponse> {
  const res = await authFetch(`/api/appointments?page=${page}&per_page=${perPage}`);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<AppointmentResponse> {
  const res = await authFetch(`/api/appointments/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update status");
  }
  return res.json();
}

export async function fetchTodaySchedule(
  date?: string
): Promise<TodayScheduleResponse> {
  const query = date ? `?date=${date}` : "";
  const res = await authFetch(`/api/dashboard/today${query}`);
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}

// --- Settings ---

export interface SettingsResponse {
  theme: string;
  language: string;
  timezone: string;
  currency: string;
  allow_client_self_booking: boolean;
  require_booking_approval: boolean;
  min_booking_lead_hours: number;
  max_booking_advance_days: number;
  slot_duration_minutes: number;
  slot_gap_minutes: number;
  max_daily_appointments: number | null;
  cancellation_window_hours: number;
  notify_new_booking: boolean;
  notify_cancellation: boolean;
  notify_reminder_hours: number;
  notify_via_sms: boolean;
  notify_via_push: boolean;
  notify_via_email: boolean;
  show_phone_to_pro: boolean;
  auto_confirm_rebooking: boolean;
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await authFetch("/api/users/me/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(
  data: Partial<SettingsResponse>
): Promise<SettingsResponse> {
  const res = await authFetch("/api/users/me/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

// --- Schedule Blocks ---

export async function rescheduleAppointment(
  id: string,
  startTime: string,
  endTime: string
): Promise<AppointmentResponse> {
  const res = await authFetch(`/api/appointments/${id}/reschedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start_time: startTime, end_time: endTime }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to reschedule");
  }
  return res.json();
}

export async function fetchAppointment(id: string): Promise<AppointmentResponse> {
  const res = await authFetch(`/api/appointments/${id}`);
  if (!res.ok) throw new Error("Appointment not found");
  return res.json();
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  const res = await authFetch(`/api/schedule/blocks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete block");
}

export interface CreateWorkingHoursRequest {
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  valid_from?: string;
  valid_until?: string;
}

export interface WorkingHoursResponse {
  id: string;
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_until: string | null;
}

export async function fetchWorkingHours(): Promise<WorkingHoursResponse[]> {
  const res = await authFetch("/api/schedule/working-hours");
  if (!res.ok) throw new Error("Failed to fetch working hours");
  return res.json();
}

export async function updateWorkingHours(
  data: CreateWorkingHoursRequest[]
): Promise<WorkingHoursResponse[]> {
  const res = await authFetch("/api/schedule/working-hours", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update working hours");
  return res.json();
}
