/**
 * Thin client for the local backend's VAA-G4/B3 endpoint.
 *
 * Configure the host via the EXPO_PUBLIC_API_BASE_URL env var. On a real
 * device, point this at your machine's LAN IP (e.g. http://192.168.1.10:5000)
 * since `localhost` resolves to the device itself, not the dev machine.
 */
const DEFAULT_BASE_URL = 'http://localhost:5000';

const baseUrl =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

export type VaaMode = 'Offensive' | 'Defensive';

export type AssetMomentum = {
  ticker: string;
  score: number;
};

export type VaaDecision = {
  asOfMonth: string;
  mode: VaaMode;
  selectedTicker: string;
  selectedScore: number;
  offensiveScores: AssetMomentum[];
  defensiveScores: AssetMomentum[];
  reasoning: string;
};

export async function fetchVaaDecision(asOf: string, signal?: AbortSignal): Promise<VaaDecision> {
  const url = `${baseUrl}/api/vaa-g4b3/decision?asOf=${encodeURIComponent(asOf)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as VaaDecision;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}
