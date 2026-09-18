/**
 * Links back to the companion web site. The app deliberately carries no
 * explanatory screens of its own — depth lives on the web, which is also
 * the acquisition funnel.
 */
import type { StrategyId } from './strategies';

export const WEB_BASE_URL = 'https://monthlyrule.com';

export function strategyWebUrl(id: StrategyId): string {
  return `${WEB_BASE_URL}/strategies/${id}`;
}
