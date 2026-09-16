/**
 * One client for all six strategies.
 *
 * The backend owns each universe, so a request carries the date, the
 * holder's substitutions, and — for PAA alone — the protection factor.
 * Six near-identical clients existed only to assemble six different
 * ticker parameter sets that no longer exist.
 */
import { appVersion } from '../appVersion';
import type { StrategyId } from '../strategies';

import { baseUrl, type AllocationDecision } from './apiBase';
import type { PaaProtectionFactor } from './paaTypes';

/**
 * The server judges whether this version is still one whose answers it
 * stands behind, and says so in `clientStatus`. Omitting the header when
 * the version is unreadable is deliberate: the server reads a missing
 * header as current, so a build that cannot identify itself is left alone
 * rather than nagged on a guess.
 */
function versionHeader(): Record<string, string> {
  const version = appVersion();
  return version ? { 'X-App-Version': version } : {};
}

const PATHS: Record<StrategyId, string> = {
  vaa: '/api/vaa-g4b3/decision',
  daa: '/api/daa-g12/decision',
  paa: '/api/paa/decision',
  haa: '/api/haa/decision',
  baa: '/api/baa/decision',
  laa: '/api/laa/decision',
};

export async function fetchDecision(
  id: StrategyId,
  asOf: string,
  substitutions: Record<string, string>,
  paaA: PaaProtectionFactor = 2,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  const params = new URLSearchParams();
  params.set('asOf', asOf);
  if (id === 'paa') params.set('a', String(paaA));
  for (const [original, replacement] of Object.entries(substitutions)) {
    params.append('substitute', `${original}:${replacement}`);
  }

  const res = await fetch(`${baseUrl}${PATHS[id]}?${params.toString()}`, {
    signal,
    headers: versionHeader(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
