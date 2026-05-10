/**
 * Thin client for the local backend's BAA-G12 endpoint.
 *
 * Three-bucket strategy: canary[3] + risky[12] + cash[5] (canonical
 * sizes). Same region-agnostic contract as VAA/DAA/PAA/HAA — caller
 * resolves tickers via `src/universe.ts` (`resolveBaaUniverse`).
 */
import { baseUrl, type AllocationDecision } from './apiBase';

export async function fetchBaaDecision(
  asOf: string,
  canary: readonly string[],
  risky: readonly string[],
  cash: readonly string[],
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (canary.length === 0 || risky.length === 0 || cash.length === 0) {
    throw new Error('Canary, risky, and cash ticker lists must all be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  for (const t of canary) params.append('canary', t);
  for (const t of risky) params.append('risky', t);
  for (const t of cash) params.append('cash', t);

  const url = `${baseUrl}/api/baa/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
