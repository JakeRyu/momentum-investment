/**
 * Thin client for the local backend's DAA-G12 endpoint.
 *
 * DAA-G12 (Keller & Keuning, 2018) is a three-bucket strategy: canary,
 * risky, cash. The caller supplies the resolved ticker lists explicitly —
 * the backend stays region-agnostic, and region/UK-override resolution
 * lives in `src/universe.ts` (`resolveDaaG12Universe`) the same way VAA's
 * does.
 *
 * Note: a ticker may appear in multiple buckets (e.g. VWO in canary+risky,
 * LQD in risky+cash). The backend dedupes when fetching prices.
 */
import { baseUrl, type AllocationDecision } from './apiBase';

/**
 * Runs a DAA-G12 decision against an explicit ticker universe (canary,
 * risky, cash). Same region-agnostic contract as VAA — the caller decides
 * which tickers to send.
 */
export async function fetchDaaG12Decision(
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

  const url = `${baseUrl}/api/daa-g12/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
