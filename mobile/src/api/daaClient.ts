/**
 * Thin client for the local backend's DAA-G12 endpoint.
 *
 * DAA-G12 (Keller & Keuning, 2018) is a three-bucket strategy: canary,
 * risky, cash. The default universe below is the original 2018 Keller
 * paper universe — US-listed ETFs.
 *
 * Phase 1 ships DAA with this hardcoded US universe only. UK substitutes
 * and per-asset-class user overrides (the way VAA handles them) will come
 * after the basic flow is validated end-to-end.
 */
import { baseUrl, type AllocationDecision } from './apiBase';

/**
 * Keller 2018 DAA-G12 US universe.
 *   - Canary: VWO (emerging markets), BND (US aggregate bonds).
 *   - Risky: 12 globally diversified equity / commodity / bond ETFs.
 *   - Cash: short-Treasury, 7-10y Treasury, IG corp.
 *
 * Note: VWO appears in both Canary and Risky; LQD appears in both Risky
 * and Cash. The backend dedupes when fetching prices.
 */
export const DAA_G12_US_UNIVERSE = {
  canary: ['VWO', 'BND'] as const,
  risky: [
    'SPY', 'IWM', 'QQQ', 'VGK', 'EWJ', 'VWO',
    'VNQ', 'GSG', 'GLD', 'TLT', 'HYG', 'LQD',
  ] as const,
  cash: ['SHY', 'IEF', 'LQD'] as const,
} as const;

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
