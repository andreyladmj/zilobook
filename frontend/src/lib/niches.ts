// Niche/domain configuration.
// One deployment serves multiple marketing domains; the Host header decides
// which niche (theme, copy, SEO meta, default location type) a visitor sees.
// Visual theme tokens stay in LandingClient.tsx (THEMES) keyed by the same ids.

export type NicheId = "fitness" | "beauty" | "service";

export interface NicheConfig {
  id: NicheId;
  label: string;
  /** Matches locations.type in the backend (Gym | Saloon | Station) */
  locationType: string;
  /** Production hostnames that resolve to this niche. Update before launch. */
  domains: string[];
  meta: {
    title: string;
    description: string;
  };
}

export const NICHES: Record<NicheId, NicheConfig> = {
  beauty: {
    id: "beauty",
    label: "Beauty",
    locationType: "Saloon",
    domains: ["nails.zilobook.com", "beauty.zilobook.com"],
    meta: {
      title: "Zilobook — онлайн-запис для майстрів краси",
      description:
        "Персональне посилання для запису в Instagram-біо. Нагадування клієнтам і передоплата проти no-show — для майстрів манікюру та б'юті-спеціалістів.",
    },
  },
  fitness: {
    id: "fitness",
    label: "Fitness",
    locationType: "Gym",
    domains: ["fit.zilobook.com", "trainer.zilobook.com"],
    meta: {
      title: "Zilobook — онлайн-запис для тренерів",
      description:
        "Розклад тренувань і запис клієнтів в одному посиланні. Індивідуальні та групові заняття, нагадування, передоплата.",
    },
  },
  service: {
    id: "service",
    label: "Auto Service",
    locationType: "Station",
    domains: ["auto.zilobook.com"],
    meta: {
      title: "Zilobook — онлайн-запис на СТО",
      description:
        "Запис клієнтів на сервіс без дзвінків: вільні слоти, нагадування та передоплата для СТО і автомайстрів.",
    },
  },
};

export const DEFAULT_NICHE: NicheId = "fitness";

// Feature flags for pre-release. Marketplace (public /explore discovery)
// is hidden until there is enough supply; the page itself stays reachable by URL.
export const FEATURES = {
  marketplace: false,
};

/** Resolve a niche from a Host header. Returns null for unknown hosts (dev, app domain). */
export function getNicheFromHost(host: string | null | undefined): NicheId | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  for (const niche of Object.values(NICHES)) {
    if (niche.domains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return niche.id;
    }
  }
  return null;
}

export function isNicheId(value: string | undefined | null): value is NicheId {
  return value === "fitness" || value === "beauty" || value === "service";
}
