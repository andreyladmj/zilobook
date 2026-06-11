import type { Metadata } from "next";
import { headers } from "next/headers";
import LandingClient from "./components/LandingClient";
import { DEFAULT_NICHE, NICHES, getNicheFromHost, isNicheId } from "@/lib/niches";

type HomeProps = { searchParams: Promise<{ theme?: string }> };

// Niche resolution order: ?theme= override (dev/demo) → domain → default.
async function resolveNiche(props: HomeProps) {
  const params = await props.searchParams;
  const host = (await headers()).get("host");
  const domainNiche = getNicheFromHost(host);
  const themeParam = isNicheId(params?.theme) ? params.theme : null;
  return {
    nicheId: themeParam ?? domainNiche ?? DEFAULT_NICHE,
    // A niche-specific domain locks the landing to its niche (no switcher).
    locked: Boolean(domainNiche && !themeParam),
  };
}

export async function generateMetadata(props: HomeProps): Promise<Metadata> {
  const { nicheId } = await resolveNiche(props);
  return NICHES[nicheId].meta;
}

export default async function Home(props: HomeProps) {
  const { nicheId, locked } = await resolveNiche(props);

  return <LandingClient initialTheme={nicheId} lockTheme={locked} />;
}
