/**
 * Thin client for the local backend's HAA endpoint (HAA-Balanced).
 *
 * Three-bucket strategy: 8 risky + 1 canary + 1 cash. Same
 * region-agnostic contract as VAA/DAA/PAA — the caller resolves which
 * tickers to send via `src/universe.ts` (`resolveHaaUniverse`).
 */
import { baseUrl, type AllocationDecision } from './apiBase';

export async function fetchHaaDecision(
  asOf: string,
  risky: readonly string[],
  canary: string,
  cash: string,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (risky.length === 0) {
    throw new Error('Risky ticker list must be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  params.set('canary', canary);
  params.set('cash', cash);
  for (const t of risky) params.append('risky', t);

  const url = `${baseUrl}/api/haa/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
