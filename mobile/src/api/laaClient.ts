/**
 * Thin client for the local backend's LAA endpoint (Lethargic Asset
 * Allocation, Keller 2019).
 *
 * LAA's request shape differs from the breadth-momentum strategies:
 *   - Exactly 3 permanent tickers (held at 25% each unconditionally).
 *   - Single risky and cash tickers (the rotating 25% sleeve).
 *   - A signal-equity ticker and FRED unemployment series id, which
 *     drive the Growth-Trend timing rule. These are region-agnostic
 *     (SPY / UNRATE) — the macro signal is anchored to US data even
 *     when the actual portfolio assets are mapped to UK UCITS
 *     substitutes.
 */
import { baseUrl, type AllocationDecision } from './apiBase';

export async function fetchLaaDecision(
  asOf: string,
  permanent: readonly string[],
  risky: string,
  cash: string,
  signalEquity: string,
  unemploymentSeriesId: string,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  if (permanent.length !== 3) {
    throw new Error(`LAA expects exactly 3 permanent tickers, got ${permanent.length}.`);
  }
  if (!risky || !cash) {
    throw new Error('Risky and cash tickers must be non-empty.');
  }
  if (!signalEquity || !unemploymentSeriesId) {
    throw new Error('Signal equity and unemployment series id must be non-empty.');
  }

  const params = new URLSearchParams();
  params.set('asOf', asOf);
  for (const t of permanent) params.append('permanent', t);
  params.set('risky', risky);
  params.set('cash', cash);
  params.set('signalEquity', signalEquity);
  params.set('unemploymentSeriesId', unemploymentSeriesId);

  const url = `${baseUrl}/api/laa/decision?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
