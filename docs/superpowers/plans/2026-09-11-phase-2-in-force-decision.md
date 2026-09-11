# Phase 2 — In-Force Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the app from "pick a strategy and a date, then see a reading" into "here is what you should be holding right now, per strategy you run" — and let the user tick it off once done.

**Architecture:** Decision building and fetching move out of the screens into one shared module so both Home and Detail can use them. Home fetches one in-force decision per registered strategy in parallel and renders a card each. Detail keeps phase 1's rendering and gains a two-way segment (Holding / Preview). Strategy registration and region move to a new Settings screen; the as-of date picker and `NotImplementedScreen` are deleted.

**Tech Stack:** Expo 54 / React Native 0.81 / React 19 / TypeScript 5.9 / jest (added in phase 1).

**Spec:** `docs/superpowers/specs/2026-09-11-phase-2-in-force-decision-design.md`

## Global Constraints

- **`mobile/` only.** No backend, no `web/`, no API changes.
- **The in-force `asOf` is the last calendar day of the previous month**, never a computed trading day. The backend resolves to the trading-day-on-or-before itself; no exchange calendar on the client.
- **Allocations are never combined across strategies.** A ticker in two strategies appears on both cards with each strategy's own weight.
- **Home cards show tickers and weights only** — no fund names. Fund names stay on the detail screen.
- **The done-marker is one string per strategy** (`"YYYY-MM"`). No portfolio state, no decision history.
- **Existing visual language stays:** `#0b0d10` root, `#161a1f` card, `#8a93a0` muted, `#cfd5dc` body, `#5e6671` fine print, `#7ed4a3` accent, `#ffb37e` defensive, `#ffd980` hybrid, `#ff8a8a` error. No new colours.
- Mobile style: 2-space indent, single quotes, semicolons.
- Every task ends green on `cd mobile && npx tsc --noEmit` and `cd mobile && npx jest`.
- **Do not run the iOS simulator.** Visual verification is a single consolidated pass by the controller after the last task.

---

### Task 1: Extract decision building and fetching into one module

Today the request is built in `App.tsx`'s `handleConfirm` and dispatched in `DecisionScreen`'s `load`. Home needs both, for several strategies at once, without mounting a screen. This task moves them out with **no behaviour change**.

**Files:**
- Create: `mobile/src/decisions.ts`
- Test: `mobile/src/__tests__/decisions.test.ts`
- Modify: `mobile/src/screens/DecisionScreen.tsx` (remove the `DecisionRequest` type and the `load` switch; import instead)
- Modify: `mobile/App.tsx` (replace `handleConfirm`'s if/else chain with a call)

**Interfaces:**
- Consumes: the `resolve*Universe` / `*TickerArrays` pairs from `mobile/src/universe.ts`; the six `fetch*Decision` functions from `mobile/src/api/*Client.ts`.
- Produces, used by Tasks 5 and 6:
  - `type DecisionRequest` — moved verbatim from `DecisionScreen.tsx`, same six variants.
  - `buildDecisionRequest(id: StrategyId, region: Region, overrides: Overrides): DecisionRequest`
  - `fetchDecisionFor(request: DecisionRequest, asOf: string, paaA: PaaProtectionFactor): Promise<AllocationDecision>`

- [ ] **Step 1: Write the failing test**

Create `mobile/src/__tests__/decisions.test.ts`:

```typescript
import { buildDecisionRequest } from '../decisions';

describe('buildDecisionRequest', () => {
  it('builds the VAA request from the US universe', () => {
    const r = buildDecisionRequest('vaa', 'US', {});
    expect(r).toEqual({
      kind: 'vaa',
      offensive: ['SPY', 'EFA', 'EEM', 'AGG'],
      defensive: ['LQD', 'IEF', 'SHY'],
    });
  });

  it('builds the DAA request with its canary bucket', () => {
    const r = buildDecisionRequest('daa', 'US', {});
    expect(r.kind).toBe('daa-g12');
    if (r.kind !== 'daa-g12') throw new Error('wrong kind');
    expect(r.canary).toEqual(['VWO', 'BND']);
    expect(r.risky).toHaveLength(12);
    expect(r.cash).toEqual(['SHY', 'IEF', 'LQD']);
  });

  it('builds a request for every strategy id', () => {
    const ids = ['vaa', 'paa', 'daa', 'baa', 'haa', 'laa'] as const;
    for (const id of ids) {
      expect(buildDecisionRequest(id, 'US', {}).kind).toBeTruthy();
    }
  });

  it('applies a UK override to the resolved tickers', () => {
    const r = buildDecisionRequest('vaa', 'UK', {});
    if (r.kind !== 'vaa') throw new Error('wrong kind');
    expect(r.offensive[0]).not.toBe('SPY');
    expect(r.offensive[0]).toMatch(/\.L$/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd mobile && npx jest src/__tests__/decisions.test.ts`
Expected: FAIL — `Cannot find module '../decisions'`

- [ ] **Step 3: Create the module**

Create `mobile/src/decisions.ts`. Move the `DecisionRequest` union out of `DecisionScreen.tsx` verbatim (including its doc comment), then add the two functions by moving the bodies of `App.tsx`'s `handleConfirm` if/else chain and `DecisionScreen`'s `load` switch:

```typescript
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
```

- [ ] **Step 4: Rewire the two call sites**

In `DecisionScreen.tsx`: delete the local `DecisionRequest` union and its doc comment, delete the six `fetch*Decision` imports, and import instead:

```typescript
import { fetchDecisionFor, type DecisionRequest } from '../decisions';
```

Keep `export type { DecisionRequest }` out of this file — consumers import it from `../decisions` now. Replace the body of `load`'s try block with:

```typescript
      const d = await fetchDecisionFor(request, asOf, paaA);
      setDecision(d);
```

In `App.tsx`: delete the `if (strategy.id === 'daa') … else …` chain in `handleConfirm` and the now-unused `resolve*`/`*TickerArrays` imports, and replace the chain with:

```typescript
    const request = buildDecisionRequest(strategy.id, region, overrides);
```

Update `App.tsx`'s `DecisionRequest` import to come from `./src/decisions`.

- [ ] **Step 5: Verify**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: tsc silent; all tests pass (4 new + 17 existing).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/decisions.ts mobile/src/__tests__/decisions.test.ts mobile/src/screens/DecisionScreen.tsx mobile/App.tsx
git commit -m "refactor(mobile): extract decision building and fetching from the screens"
```

---

### Task 2: In-force date helpers and the two cadence lines

**Files:**
- Modify: `mobile/src/rebalance.ts`
- Modify: `mobile/src/__tests__/rebalance.test.ts`

**Interfaces:**
- Produces, used by Tasks 3, 5 and 6:
  - `inForceAsOf(today?: string): string` — last calendar day of the previous month, `YYYY-MM-DD`.
  - `inForceMonthKey(today?: string): string` — that month as `YYYY-MM`, the done-marker value.
  - `holdingHint(today?: string): string`
  - `previewHint(today?: string): string`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `mobile/src/__tests__/rebalance.test.ts` with:

```typescript
import {
  holdingHint,
  inForceAsOf,
  inForceMonthKey,
  previewHint,
} from '../rebalance';

describe('inForceAsOf', () => {
  it('is the last day of the previous month', () => {
    expect(inForceAsOf('2026-09-11')).toBe('2026-08-31');
  });

  it('handles a 30-day previous month', () => {
    expect(inForceAsOf('2026-05-02')).toBe('2026-04-30');
  });

  it('crosses the year boundary', () => {
    expect(inForceAsOf('2026-01-04')).toBe('2025-12-31');
  });

  it('handles a leap-year February', () => {
    expect(inForceAsOf('2028-03-01')).toBe('2028-02-29');
    expect(inForceAsOf('2026-03-01')).toBe('2026-02-28');
  });

  it('still points at the previous month on the last day of this one', () => {
    expect(inForceAsOf('2026-09-30')).toBe('2026-08-31');
  });
});

describe('inForceMonthKey', () => {
  it('is the previous month', () => {
    expect(inForceMonthKey('2026-09-11')).toBe('2026-08');
  });

  it('crosses the year boundary', () => {
    expect(inForceMonthKey('2026-01-04')).toBe('2025-12');
  });
});

describe('holdingHint', () => {
  it('names where the allocation came from and when it changes', () => {
    expect(holdingHint('2026-09-11')).toBe(
      'Set at the 31 August rebalance · next at the end of September',
    );
  });

  it('crosses the year boundary', () => {
    expect(holdingHint('2026-01-04')).toBe(
      'Set at the 31 December rebalance · next at the end of January',
    );
  });
});

describe('previewHint', () => {
  it('says the reading is not yet in force', () => {
    expect(previewHint('2026-09-11')).toBe(
      'Not in force yet · takes effect at the end of September',
    );
  });
});

describe('defaults', () => {
  it('uses today when no date is passed', () => {
    expect(inForceAsOf()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inForceMonthKey()).toMatch(/^\d{4}-\d{2}$/);
    expect(holdingHint()).toMatch(/^Set at the /);
    expect(previewHint()).toMatch(/^Not in force yet · /);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mobile && npx jest src/__tests__/rebalance.test.ts`
Expected: FAIL — `inForceAsOf is not a function`

- [ ] **Step 3: Rewrite `rebalance.ts`**

The old `rebalanceHint` goes away entirely — with the date picker deleted, `asOf` is only ever the in-force month-end or today, so its past-date branch is unreachable. Keep `MONTH_NAMES`, `daysInMonth`, and the string-splitting approach (which avoids the `new Date('YYYY-MM-DD')` UTC-midnight bug); reuse `formatYmd` from `./utils` for the default `today`.

```typescript
/**
 * Keller's strategies compute a signal at month-end close and hold that
 * allocation through the following month. So the allocation a user should be
 * holding on any given day comes from the last month-end — not from today,
 * whose reading is a preview of a rebalance that has not happened yet.
 *
 * The in-force date is the last *calendar* day of the previous month, not a
 * computed trading day: the backend already resolves to the
 * trading-day-on-or-before the date it is given, so no exchange calendar is
 * needed here.
 *
 * Dates are split as strings rather than passed to `new Date()`, which parses
 * `YYYY-MM-DD` as UTC midnight and lands on the previous day west of
 * Greenwich.
 */
import { formatYmd } from './utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Year and 0-based month of the month before `today`. */
function previousMonth(today: string): { year: number; monthIndex: number } {
  const [year, month] = today.split('-').map(Number);
  const monthIndex = month - 1;
  return monthIndex === 0
    ? { year: year - 1, monthIndex: 11 }
    : { year, monthIndex: monthIndex - 1 };
}

function currentMonthName(today: string): string {
  const [, month] = today.split('-').map(Number);
  return MONTH_NAMES[month - 1];
}

export function inForceAsOf(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  const day = daysInMonth(year, monthIndex);
  const mm = String(monthIndex + 1).padStart(2, '0');
  return `${year}-${mm}-${day}`;
}

export function inForceMonthKey(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function holdingHint(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  const day = daysInMonth(year, monthIndex);
  return (
    `Set at the ${day} ${MONTH_NAMES[monthIndex]} rebalance` +
    ` · next at the end of ${currentMonthName(today)}`
  );
}

export function previewHint(today: string = formatYmd(new Date())): string {
  return `Not in force yet · takes effect at the end of ${currentMonthName(today)}`;
}
```

Note `inForceAsOf` must zero-pad the day too — every month's last day is two digits already (28–31), so no padding is needed there, but the month is.

- [ ] **Step 4: Verify**

Run: `cd mobile && npx jest src/__tests__/rebalance.test.ts && npx tsc --noEmit`
Expected: all pass. `tsc` will report `rebalanceHint` missing in `DecisionScreen.tsx` — leave that; Task 6 fixes it. If you prefer a green tree at every commit, temporarily keep the old `rebalanceHint` export and delete it in Task 6.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/rebalance.ts mobile/src/__tests__/rebalance.test.ts
git commit -m "feat(mobile): in-force date helpers and holding/preview cadence lines"
```

---

### Task 3: Persist registered strategies and done markers

**Files:**
- Modify: `mobile/src/storage.ts`
- Create: `mobile/src/__tests__/storage.test.ts`
- Modify: `mobile/package.json` (AsyncStorage jest mock)

**Interfaces:**
- Produces, used by Tasks 5 and 7:
  - `loadRegisteredStrategies(): Promise<StrategyId[]>` — defaults to `['vaa']` when nothing is stored.
  - `saveRegisteredStrategies(ids: StrategyId[]): Promise<void>`
  - `loadDoneMarkers(): Promise<Partial<Record<StrategyId, string>>>`
  - `saveDoneMarker(id: StrategyId, monthKey: string): Promise<void>`
  - `clearDoneMarker(id: StrategyId): Promise<void>`

- [ ] **Step 1: Register the AsyncStorage jest mock**

The library ships one. Add to `mobile/package.json`'s `jest` block:

```json
  "jest": {
    "preset": "jest-expo",
    "setupFiles": ["<rootDir>/jest.setup.js"]
  }
```

Create `mobile/jest.setup.js`:

```javascript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
```

- [ ] **Step 2: Write the failing tests**

Create `mobile/src/__tests__/storage.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearDoneMarker,
  loadDoneMarkers,
  loadRegisteredStrategies,
  saveDoneMarker,
  saveRegisteredStrategies,
} from '../storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('registered strategies', () => {
  it('defaults to VAA alone when nothing is stored', async () => {
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('round-trips a saved set', async () => {
    await saveRegisteredStrategies(['vaa', 'daa']);
    expect(await loadRegisteredStrategies()).toEqual(['vaa', 'daa']);
  });

  it('drops ids that are no longer known strategies', async () => {
    await AsyncStorage.setItem('momentum:registeredStrategies', '["vaa","gone"]');
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('falls back to the default when the stored value is corrupt', async () => {
    await AsyncStorage.setItem('momentum:registeredStrategies', 'not json');
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('never returns an empty set', async () => {
    await saveRegisteredStrategies([]);
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });
});

describe('done markers', () => {
  it('is empty before anything is marked', async () => {
    expect(await loadDoneMarkers()).toEqual({});
  });

  it('round-trips a marker per strategy', async () => {
    await saveDoneMarker('vaa', '2026-08');
    await saveDoneMarker('daa', '2026-08');
    expect(await loadDoneMarkers()).toEqual({ vaa: '2026-08', daa: '2026-08' });
  });

  it('clears one without disturbing the others', async () => {
    await saveDoneMarker('vaa', '2026-08');
    await saveDoneMarker('daa', '2026-08');
    await clearDoneMarker('vaa');
    expect(await loadDoneMarkers()).toEqual({ daa: '2026-08' });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd mobile && npx jest src/__tests__/storage.test.ts`
Expected: FAIL — `loadRegisteredStrategies is not a function`

- [ ] **Step 4: Implement**

Append to `mobile/src/storage.ts`, and add the two keys next to the existing `KEY_*` constants:

```typescript
const KEY_REGISTERED = 'momentum:registeredStrategies';
const KEY_DONE = 'momentum:done';
```

```typescript
// ----------------------------------------------------------------------
// Registered strategies — the ones the user actually runs, shown on Home.
// A newcomer starts with VAA alone so the home screen is never empty and
// never asks for a choice the app cannot help with.

export const DEFAULT_REGISTERED: StrategyId[] = ['vaa'];

export async function loadRegisteredStrategies(): Promise<StrategyId[]> {
  const raw = await AsyncStorage.getItem(KEY_REGISTERED);
  if (!raw) return [...DEFAULT_REGISTERED];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_REGISTERED];
    // Same defensive filter as loadSelectedStrategyId: an id we no longer
    // ship is dropped rather than crashing a screen that maps over it.
    const known = parsed.filter((id): id is StrategyId =>
      STRATEGIES.some((s) => s.id === id),
    );
    return known.length > 0 ? known : [...DEFAULT_REGISTERED];
  } catch {
    return [...DEFAULT_REGISTERED];
  }
}

export async function saveRegisteredStrategies(ids: StrategyId[]): Promise<void> {
  await AsyncStorage.setItem(KEY_REGISTERED, JSON.stringify(ids));
}

// ----------------------------------------------------------------------
// Done markers — per strategy, the in-force month the user ticked off
// (e.g. "2026-08"). When the month rolls over the stored key stops matching
// the current in-force month and the card reverts to pending on its own.

export async function loadDoneMarkers(): Promise<Partial<Record<StrategyId, string>>> {
  const raw = await AsyncStorage.getItem(KEY_DONE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveDoneMarker(id: StrategyId, monthKey: string): Promise<void> {
  const markers = await loadDoneMarkers();
  markers[id] = monthKey;
  await AsyncStorage.setItem(KEY_DONE, JSON.stringify(markers));
}

export async function clearDoneMarker(id: StrategyId): Promise<void> {
  const markers = await loadDoneMarkers();
  delete markers[id];
  await AsyncStorage.setItem(KEY_DONE, JSON.stringify(markers));
}
```

Also update the file's header comment: it lists the five persisted pieces and must now list seven, and note that `asOfDate` is gone rather than "not persisted".

- [ ] **Step 5: Verify**

Run: `cd mobile && npx jest && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add mobile/src/storage.ts mobile/src/__tests__/storage.test.ts mobile/package.json mobile/jest.setup.js
git commit -m "feat(mobile): persist registered strategies and per-strategy done markers"
```

---

### Task 4: The home card component

Presentational only — no fetching, no storage. Everything arrives as props so it can be reasoned about and restyled without touching the screen that orchestrates it.

**Files:**
- Create: `mobile/src/components/StrategyDecisionCard.tsx` (first file in a new `components/` directory)

**Interfaces:**
- Consumes: `AllocationDecision` from `../api/apiBase`, `Strategy` from `../strategies`.
- Produces, used by Task 5:

```typescript
export type StrategyDecisionCardProps = {
  strategy: Strategy;
  /** null while loading. */
  decision: AllocationDecision | null;
  /** Non-null when this card's fetch failed; the card shows it inline. */
  error: string | null;
  /** Output of holdingHint() — the same line on every card. */
  holdingLine: string;
  done: boolean;
  onToggleDone: () => void;
  onPress: () => void;
};
```

- [ ] **Step 1: Build the card**

Structure, top to bottom inside one `Pressable` (whole card opens detail; the done control stops propagation):

1. Header row — `strategy.shortName` (bold, `#f4f6f8`, 16) + `strategy.fullName` (`#8a93a0`, 13, `flexShrink: 1`) on the left, the mode badge on the right: `decision.modeLabel.toUpperCase()` at 11px/letterSpacing 1.2 in the mode colour. Reuse the same map as the detail screen — `Offensive: '#7ed4a3'`, `Defensive: '#ffb37e'`, `Hybrid: '#ffd980'`, unknown → `#8a93a0`.
2. `holdingLine` — `#8a93a0`, 12.
3. Allocation rows — **ticker and weight only**. Ticker `#f4f6f8` 16 weight 600; weight `#cfd5dc` 15 with `fontVariant: ['tabular-nums']`, right-aligned via `justifyContent: 'space-between'`. Format weights exactly as the detail screen does: integer percentages with no decimals, others with two (`16.67%`, `100%`).
4. Footer row — the done control: a bordered pill reading `Done` when `done` is false and a filled `✓ Done` in `#7ed4a3` when true.

States:
- `decision === null && error === null` → three muted placeholder bars in place of the allocation rows (skeleton), header and hint still rendered.
- `error !== null` → `#ff8a8a` one-liner (`Could not load`) in place of the rows; the card stays tappable so the detail screen can retry.

Card container matches the existing card treatment: `backgroundColor: '#161a1f'`, `borderRadius: 16`, `padding: 16`, and pending cards (`!done`) additionally carry `borderWidth: 1, borderColor: '#2a2f37'` while done cards use `borderColor: 'transparent'` and `opacity: 0.65`, so what still needs doing is what stands out.

Keep the file under ~200 lines including styles. No `useEffect`, no state beyond what props give.

- [ ] **Step 2: Verify**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: clean. (No test — this is presentational; it is covered by the consolidated visual pass.)

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/StrategyDecisionCard.tsx
git commit -m "feat(mobile): home card for one strategy's in-force allocation"
```

---

### Task 5: Home becomes the card list

**Files:**
- Rewrite: `mobile/src/screens/HomeScreen.tsx`
- Modify: `mobile/App.tsx`

**Interfaces:**
- Consumes: `buildDecisionRequest` / `fetchDecisionFor` (Task 1), `inForceAsOf` / `inForceMonthKey` / `holdingHint` (Task 2), `loadDoneMarkers` / `saveDoneMarker` / `clearDoneMarker` (Task 3), `StrategyDecisionCard` (Task 4).
- Produces: new `HomeScreenProps`:

```typescript
export type HomeScreenProps = {
  registered: StrategyId[];
  region: Region;
  overrides: Overrides;
  paaA: PaaProtectionFactor;
  onOpenStrategy: (id: StrategyId) => void;
  onOpenSettings: () => void;
};
```

- [ ] **Step 1: Rewrite the screen**

Delete outright: the as-of date picker and both its platform branches, the `DateTimePicker` import, the region segmented control, the strategy radio list, `StrategyRow`, and the `Show recommendation` footer button. The `REGION_OPTIONS` constant and `MIN_AS_OF` go with them.

Keep: the header (title, subtitle, gear → `onOpenSettings`) and the footer disclaimer.

Add, in place of the form:

- Local state `Record<StrategyId, { decision: AllocationDecision | null; error: string | null }>`, seeded to loading for every registered id.
- One `useEffect` keyed on `registered.join(',')`, `region`, `paaA` and a stable serialisation of `overrides` that fires all fetches **in parallel**:

```typescript
    const asOf = inForceAsOf();
    await Promise.all(
      registered.map(async (id) => {
        try {
          const request = buildDecisionRequest(id, region, overrides);
          const decision = await fetchDecisionFor(request, asOf, paaA);
          if (!cancelled) setResult(id, { decision, error: null });
        } catch (e) {
          if (!cancelled) {
            setResult(id, {
              decision: null,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }),
    );
```

  A failing card must not clear the others — hence per-id state rather than one screen-level error. Use a `cancelled` flag in the effect's cleanup, matching the pattern already in `App.tsx`'s hydration effect.
- Done markers in local state, loaded once on mount via `loadDoneMarkers()`. A card is `done` when `markers[id] === inForceMonthKey()`. Toggling calls `saveDoneMarker(id, inForceMonthKey())` or `clearDoneMarker(id)` and updates local state — same write-through pattern as `App.tsx`'s other persisted setters.
- A `ScrollView` with `RefreshControl` that re-runs the fetch, one `StrategyDecisionCard` per registered id in `registered` order, then a final `Add another strategy →` row (`#7ed4a3`, 14, weight 600) calling `onOpenSettings`.

- [ ] **Step 2: Rewire `App.tsx`**

- Delete `asOfDate` state, `setAsOfDate`, and the `formatYmd` import if it becomes unused.
- Replace `selectedStrategyId` state with `registered: StrategyId[]`, hydrated via `loadRegisteredStrategies()`; keep `loadSelectedStrategyId`/`saveSelectedStrategyId` in `storage.ts` only if something still uses them — if not, delete both and their key.
- `handleConfirm` disappears. The home screen navigates with `onOpenStrategy(id)`, which sets `{ kind: 'decision', strategy: findStrategy(id) }`:

```typescript
type Screen =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'config' }
  | { kind: 'decision'; strategy: Strategy };
```

  **`DecisionScreen`'s own props do not change in this task** — Task 6 owns that. So keep feeding it what it still expects, computed at the render site from state App already holds:

```typescript
      <DecisionScreen
        strategy={screen.strategy}
        asOf={inForceAsOf()}
        region={region}
        request={buildDecisionRequest(screen.strategy.id, region, overrides)}
        paaA={paaProtectionFactor}
        onPaaAChange={handlePaaAChange}
        onBack={() => setScreen({ kind: 'home' })}
      />
```

  This keeps the tree compiling and the detail screen working (showing the in-force decision) between this task and Task 6, which then removes `asOf` and `request` in favour of the screen deriving both per segment.

- [ ] **Step 3: Verify**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: clean apart from anything Task 6 and 7 still owe (`settings` screen not yet rendered — return `null` for that branch with a `// Task 7` comment rather than leaving a type error).

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/HomeScreen.tsx mobile/App.tsx
git commit -m "feat(mobile): home shows the in-force allocation per registered strategy"
```

---

### Task 6: Detail screen segments Holding against Preview

**Files:**
- Modify: `mobile/src/screens/DecisionScreen.tsx`

**Interfaces:**
- Consumes: `inForceAsOf`, `holdingHint`, `previewHint` (Task 2); `buildDecisionRequest`, `fetchDecisionFor` (Task 1).
- New props — the screen now builds its own request per segment, so it needs the inputs rather than the result. `asOf` and `request` are removed; App's render site (set up in Task 5) drops those two lines and adds `overrides`:

```typescript
export type DecisionScreenProps = {
  strategy: Strategy;
  region: Region;
  overrides: Overrides;
  paaA: PaaProtectionFactor;
  onPaaAChange: (a: PaaProtectionFactor) => void;
  onBack: () => void;
};
```

- [ ] **Step 1: Add the segment**

Add state `const [view, setView] = useState<'holding' | 'preview'>('holding');` and a two-way segmented control directly under the subtitle, styled exactly like the existing `ProtectionFactorPicker` — reuse `protectionWrap` / `protectionRow` / `protectionSegment` / `protectionSegmentSelected` / `protectionSegmentLabel` / `protectionSegmentLabelSelected` rather than defining a parallel set. Labels: `Holding` with sub `what to hold now`, `Preview` with sub `next rebalance`.

When both this and the PAA picker render (PAA only), this one sits above it.

- [ ] **Step 2: Fetch per view**

`asOf` becomes derived: `const asOf = view === 'holding' ? inForceAsOf() : formatYmd(new Date());`

Keep the existing `requestKey` memo approach and add `view` to it so switching refetches. Both calls hit the same cached price series on the backend, so the second is fast. Build the request with `buildDecisionRequest(strategy.id, region, overrides)`.

Cache both results in state — `Record<'holding' | 'preview', AllocationDecision | null>` — so flipping back and forth does not refetch within a session.

- [ ] **Step 3: Swap the cadence line**

Replace the `rebalanceHint(asOf)` call with `view === 'holding' ? holdingHint() : previewHint()`, and delete the now-unused `rebalanceHint` import. If Task 2 left the old `rebalanceHint` in place for a green tree, delete it from `mobile/src/rebalance.ts` now.

The subtitle's `As of ${asOf}` stays and now reflects whichever view is active, which is the point — in Holding it reads the month-end date, in Preview today's.

- [ ] **Step 4: Verify**

Run: `cd mobile && npx tsc --noEmit && npx jest`

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/DecisionScreen.tsx mobile/src/rebalance.ts
git commit -m "feat(mobile): segment the decision screen into holding and preview"
```

---

### Task 7: Settings screen, and delete the dead screen

**Files:**
- Create: `mobile/src/screens/SettingsScreen.tsx`
- Delete: `mobile/src/screens/NotImplementedScreen.tsx`
- Modify: `mobile/App.tsx`

**Interfaces:**

```typescript
export type SettingsScreenProps = {
  registered: StrategyId[];
  onRegisteredChange: (ids: StrategyId[]) => void;
  region: Region;
  onRegionChange: (r: Region) => void;
  onOpenEtfConfig: () => void;
  onBack: () => void;
};
```

- [ ] **Step 1: Build the screen**

Three sections under a `← Back` header, reusing the visual language of the screen it replaces:

1. **My strategies** — one row per entry in `STRATEGIES`: short name, full name, and a checkbox. Toggling calls `onRegisteredChange` with the new set, **preserving `STRATEGIES` order** so home's card order is stable. Unchecking the last remaining strategy is refused — keep at least one registered, matching `loadRegisteredStrategies`' guarantee, and show no error for it beyond the control simply not toggling.
2. **Region** — the segmented control moved verbatim out of the old `HomeScreen` (`REGION_OPTIONS`, `segmented`/`segment`/`segmentSelected`/`segmentLabel`/`segmentSub` styles and their selected variants come with it).
3. **ETF universe** — a single row with a `→` calling `onOpenEtfConfig`.

- [ ] **Step 2: Delete `NotImplementedScreen`**

All six strategies carry `implemented: true`, so the branch that routed here cannot be taken. Delete the file, its import in `App.tsx`, and the `notImplemented` member of the `Screen` union. The `implemented` field on `Strategy` itself stays — `STRATEGIES` still declares it and nothing else depends on removing it.

- [ ] **Step 3: Wire it up**

In `App.tsx`: render `SettingsScreen` for `screen.kind === 'settings'` (replacing the Task 5 placeholder), with `onOpenEtfConfig` setting `{ kind: 'config' }` and `ETFConfigScreen`'s `onBack` returning to `{ kind: 'settings' }` rather than home. Add `handleRegisteredChange` alongside the other persisted setters:

```typescript
  const handleRegisteredChange = (ids: StrategyId[]) => {
    setRegistered(ids);
    void persistRegisteredStrategies(ids);
  };
```

`ETFConfigScreen` takes a `strategyId` prop for its section layout. With no single selected strategy any more, pass `registered[0]`.

- [ ] **Step 4: Verify**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: both clean, no unused imports left anywhere.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/SettingsScreen.tsx mobile/App.tsx
git rm mobile/src/screens/NotImplementedScreen.tsx
git commit -m "feat(mobile): settings screen for registered strategies and region"
```

---

## Done when

- `cd mobile && npx tsc --noEmit && npx jest` clean.
- Launching the app shows a decision with no input at all.
- Two registered strategies both load, and one failing leaves the other intact.
- The done toggle survives a relaunch and resets when the in-force month changes.
- No as-of date picker and no `NotImplementedScreen` remain in the tree.
