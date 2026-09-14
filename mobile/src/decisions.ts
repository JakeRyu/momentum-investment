/**
 * Builds and dispatches strategy decision requests.
 *
 * Extracted from the screens because Home now needs a decision per
 * registered strategy without mounting anything, and Detail needs two
 * (in-force and preview) for the same request.
 *
 * PAA's protection factor stays outside `DecisionRequest`: the request says
 * what to evaluate, `paaA` says at which protection level, and the detail
 * screen toggles the latter without rebuilding the former.
 */
import type { AllocationDecision, Region } from './api/apiBase';
import { fetchDecision } from './api/decisionClient';
import type { PaaProtectionFactor } from './api/paaTypes';
import type { Overrides } from './storage';
import type { StrategyId } from './strategies';
import { buildSubstitutions } from './universe';

export type DecisionRequest = {
  id: StrategyId;
  substitutions: Record<string, string>;
};

export function buildDecisionRequest(
  id: StrategyId,
  region: Region,
  overrides: Overrides,
): DecisionRequest {
  return { id, substitutions: buildSubstitutions(id, region, overrides) };
}

export function fetchDecisionFor(
  request: DecisionRequest,
  asOf: string,
  paaA: PaaProtectionFactor,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  return fetchDecision(request.id, asOf, request.substitutions, paaA, signal);
}
