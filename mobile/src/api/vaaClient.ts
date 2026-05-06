/**
 * Thin client for the local backend's VAA-G4/B3 endpoint.
 *
 * Returns the unified `AllocationDecision` shape — for VAA this is always
 * a single-asset allocation (100% in the picked offensive or defensive
 * ticker) plus per-asset scores tagged with bucket "Offensive" / "Defensive".
 */
import { baseUrl, type AllocationDecision } from './apiBase';

// Re-export so existing imports `from '../api/vaaClient'` keep working.
export type { AllocationDecision, Allocation, AssetMomentum, Region } from './apiBase';
export { getApiBaseUrl } from './apiBase';

/**
 * Runs a VAA-G4/B3 decision against an explicit ticker universe.
 * The backend is region-agnostic — the caller is responsible for picking
 * the offensive/defensive ticker sets (see `src/universe.ts`).
 */
export async function fetchVaaDecision(
  asOf: string,
  offensive: string[],
  defensive: string[],
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (offensive.length === 0 || defensive.length === 0) {
    throw new Error('Both offensive and defensive ticker lists must be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  for (const t of offensive) params.append('offensive', t);
  for (const t of defensive) params.append('defensive', t);

  const url = `${baseUrl}/api/vaa-g4b3/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
