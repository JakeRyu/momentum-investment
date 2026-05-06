/**
 * Shared types and base URL for the backend API. The backend exposes one
 * decision endpoint per strategy (VAA, DAA, ...) but they all return the
 * unified `AllocationDecision` shape so the mobile UI can render any of
 * them with one rendering path.
 *
 * Configure the host via the EXPO_PUBLIC_API_BASE_URL env var. On a real
 * device, point this at your machine's LAN IP (e.g. http://192.168.1.10:5050)
 * since `localhost` resolves to the device itself, not the dev machine.
 */
const DEFAULT_BASE_URL = 'http://localhost:5050';

export const baseUrl =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

export function getApiBaseUrl(): string {
  return baseUrl;
}

/** Investor region. Drives which ticker set the frontend resolves to (VAA only for now). */
export type Region = 'US' | 'UK';

/** One asset's portfolio weight in a strategy's chosen allocation. */
export type Allocation = {
  ticker: string;
  weight: number; // 0..1
};

/**
 * One asset's 13612W score and its role in the strategy's universe. The
 * `bucket` label is strategy-specific:
 *   - VAA-G4/B3: "Offensive" | "Defensive"
 *   - DAA-G12:   "Canary"    | "Risky"     | "Cash"
 */
export type AssetMomentum = {
  ticker: string;
  score: number;
  bucket: string;
};

/** Generic per-strategy decision response. */
export type AllocationDecision = {
  strategyId: string;
  asOf: string;
  modeLabel: string;
  allocations: Allocation[];
  scores: AssetMomentum[];
  reasoning: string;
};
