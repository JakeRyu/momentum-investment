/**
 * Thin client for the local backend's PAA endpoint (PAA-G12).
 *
 * Two-bucket strategy: risky + cash. Same region-agnostic contract as
 * VAA/DAA — the caller resolves which tickers to send via
 * `src/universe.ts` (`resolvePaaUniverse`).
 *
 * The `a` argument selects the protection factor (0 = Aggressive,
 * 1 = Moderate, 2 = Vigilant). The backend uses 2 as default if the
 * query parameter is omitted, but we always send it explicitly so the
 * URL is self-describing in logs and so changing the picker selection
 * always round-trips through the API.
 */
import { baseUrl, type AllocationDecision } from './apiBase';

export type PaaProtectionFactor = 0 | 1 | 2;

export async function fetchPaaDecision(
  asOf: string,
  risky: readonly string[],
  cash: readonly string[],
  a: PaaProtectionFactor,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (risky.length === 0 || cash.length === 0) {
    throw new Error('Risky and cash ticker lists must both be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  params.set('a', String(a));
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
