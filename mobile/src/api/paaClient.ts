/**
 * Thin client for the local backend's PAA endpoint (PAA-G12, a=2 default).
 *
 * Two-bucket strategy: risky + cash. Same region-agnostic contract as
 * VAA/DAA — the caller resolves which tickers to send via
 * `src/universe.ts` (`resolvePaaUniverse`).
 */
import { baseUrl, type AllocationDecision } from './apiBase';

export async function fetchPaaDecision(
  asOf: string,
  risky: readonly string[],
  cash: readonly string[],
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (risky.length === 0 || cash.length === 0) {
    throw new Error('Risky and cash ticker lists must both be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  for (const t of risky) params.append('risky', t);
  for (const t of cash) params.append('cash', t);

  const url = `${baseUrl}/api/paa/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
