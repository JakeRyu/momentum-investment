/**
 * Builds and dispatches strategy decision requests.
 *
 * Extracted from the screens because Home now needs a decision per
 * registered strategy without mounting anything, and Detail needs two
 * (in-force and preview) for the same request.
 *
 * PAA's protection factor stays outside `DecisionRequest`: the request says
 * which universe to evaluate, `paaA` says at which protection level, and the
 * detail screen toggles the latter without rebuilding the former.
 */
import type { AllocationDecision, Region } from './api/apiBase';
import { fetchBaaDecision } from './api/baaClient';
import { fetchDaaG12Decision } from './api/daaClient';
import { fetchHaaDecision } from './api/haaClient';
import { fetchLaaDecision } from './api/laaClient';
import { fetchPaaDecision, type PaaProtectionFactor } from './api/paaClient';
import { fetchVaaDecision } from './api/vaaClient';
import type { Overrides } from './storage';
import type { StrategyId } from './strategies';
import {
  baaTickerArrays,
  daaG12TickerArrays,
  haaTickerArrays,
  laaTickerArrays,
  paaTickerArrays,
  resolveBaaUniverse,
  resolveDaaG12Universe,
  resolveHaaUniverse,
  resolveLaaUniverse,
  resolvePaaUniverse,
  resolveUniverse,
  tickerArrays,
} from './universe';

export type DecisionRequest =
  | { kind: 'vaa'; offensive: string[]; defensive: string[] }
  | { kind: 'daa-g12'; canary: readonly string[]; risky: readonly string[]; cash: readonly string[] }
  | { kind: 'paa'; risky: readonly string[]; cash: readonly string[] }
  | { kind: 'haa'; risky: readonly string[]; canary: string; cash: string }
  | { kind: 'baa-g12'; canary: readonly string[]; risky: readonly string[]; cash: readonly string[] }
  | {
      kind: 'laa';
      permanent: readonly string[];
      risky: string;
      cash: string;
      signalEquity: string;
      unemploymentSeriesId: string;
    };

export function buildDecisionRequest(
  id: StrategyId,
  region: Region,
  overrides: Overrides,
): DecisionRequest {
  switch (id) {
    case 'daa': {
      const { canary, risky, cash } = daaG12TickerArrays(resolveDaaG12Universe(region, overrides));
      return { kind: 'daa-g12', canary, risky, cash };
    }
    case 'paa': {
      const { risky, cash } = paaTickerArrays(resolvePaaUniverse(region, overrides));
      return { kind: 'paa', risky, cash };
    }
    case 'haa': {
      const { risky, canary, cash } = haaTickerArrays(resolveHaaUniverse(region, overrides));
      return { kind: 'haa', risky, canary, cash };
    }
    case 'baa': {
      const { canary, risky, cash } = baaTickerArrays(resolveBaaUniverse(region, overrides));
      return { kind: 'baa-g12', canary, risky, cash };
    }
    case 'laa': {
      const { permanent, risky, cash, signalEquity, unemploymentSeriesId } =
        laaTickerArrays(resolveLaaUniverse(region, overrides));
      return { kind: 'laa', permanent, risky, cash, signalEquity, unemploymentSeriesId };
    }
    case 'vaa': {
      const { offensive, defensive } = tickerArrays(resolveUniverse(region, overrides));
      return { kind: 'vaa', offensive, defensive };
    }
  }
}

export function fetchDecisionFor(
  request: DecisionRequest,
  asOf: string,
  paaA: PaaProtectionFactor,
): Promise<AllocationDecision> {
  switch (request.kind) {
    case 'vaa':
      return fetchVaaDecision(asOf, request.offensive, request.defensive);
    case 'daa-g12':
      return fetchDaaG12Decision(asOf, request.canary, request.risky, request.cash);
    case 'paa':
      return fetchPaaDecision(asOf, request.risky, request.cash, paaA);
    case 'haa':
      return fetchHaaDecision(asOf, request.risky, request.canary, request.cash);
    case 'baa-g12':
      return fetchBaaDecision(asOf, request.canary, request.risky, request.cash);
    case 'laa':
      return fetchLaaDecision(
        asOf,
        request.permanent,
        request.risky,
        request.cash,
        request.signalEquity,
        request.unemploymentSeriesId,
      );
  }
}
