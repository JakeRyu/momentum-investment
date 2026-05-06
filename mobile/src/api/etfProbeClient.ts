/**
 * Calls the backend `/api/etf/probe` endpoint to validate a user-supplied
 * ticker against Yahoo Finance and fetch its meta block (name, currency,
 * exchange, first-trade date).
 */
import { getApiBaseUrl } from './vaaClient';

export type EtfMetadata = {
  ticker: string;
  name: string;
  currency: string;
  exchange: string;
  firstAvailableDate: string | null; // ISO yyyy-MM-dd
};

/** Thrown when Yahoo can't resolve the ticker. UI uses this to show a friendly message. */
export class TickerNotFoundError extends Error {
  readonly ticker: string;
  constructor(ticker: string) {
    super(`Ticker '${ticker}' was not found on Yahoo Finance.`);
    this.ticker = ticker;
    this.name = 'TickerNotFoundError';
  }
}

export async function probeTicker(
  ticker: string,
  signal?: AbortSignal,
): Promise<EtfMetadata> {
  const url = `${getApiBaseUrl()}/api/etf/probe?ticker=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, { signal });

  if (res.status === 404) {
    throw new TickerNotFoundError(ticker);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Probe failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as EtfMetadata;
}
