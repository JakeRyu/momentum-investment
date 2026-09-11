# Onboarding Phase 1 — Mobile Decision Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile decision screen answer "what do I do now" without any background knowledge — fund names, a plain-language mode caption, a rebalance-cadence line, and an escape hatch to the web — while making the screen lighter, not heavier.

**Architecture:** Three small pure modules (`tickerDescriptions`, `rebalance`, `webLinks`) hold all new logic and are unit-tested; `DecisionScreen.tsx` only consumes them. Density added by the new lines is offset by collapsing the per-bucket momentum tables behind a tap.

**Tech Stack:** Expo 54 / React Native 0.81 / React 19 / TypeScript 5.9. Jest (added in Task 1 — mobile currently has no test runner).

**Spec:** `docs/superpowers/specs/2026-09-11-onboarding-education-design.md`

## Global Constraints

- **Phase 1 is `mobile/` only.** No backend, no `web/`, no API changes.
- **No in-app About / glossary / tutorial screens.** Depth goes to the web behind a link (spec: "Division of labour").
- **Rebalance guidance is month-granular, never a trading-day date.** No exchange calendar in the client.
- **Ticker descriptions are copied verbatim from `web/src/etfDescriptions.ts`** so both surfaces say the same thing about the same ticker.
- **Existing visual language stays:** dark palette (`#0b0d10` root, `#161a1f` card, `#8a93a0` muted text, `#7ed4a3` accent), no new colours.
- **Before any EAS build**, bump `mobile/app.json` `version` to match the App Store Connect prepared version. Not part of any task below — a release-time step.
- Verify every task with `cd mobile && npx tsc --noEmit` in addition to its own tests.

---

### Task 1: Test harness + ticker descriptions module

Mobile has no test runner today (`mobile/package.json` scripts are `start`, `ios`, `android`, `tsc`). This task adds one, because Tasks 1, 4 and 6 introduce pure functions with real edge cases and Phase 2 will restructure the home screen on top of them.

Only pure TypeScript modules are tested — no component rendering — so the React Native transform pitfalls do not apply.

**Files:**
- Modify: `mobile/package.json` (devDependencies + `test` script + jest preset)
- Create: `mobile/src/tickerDescriptions.ts`
- Test: `mobile/src/__tests__/tickerDescriptions.test.ts`

**Interfaces:**
- Consumes: `ASSET_CLASSES` from `mobile/src/etfCatalog.ts` (a `Record<AssetClassCode, AssetClassDefinition>`; each definition has `label: string`, `usDefault: string`, `ukAlternatives: EtfOption[]`, and each `EtfOption` has `ticker: string`, `name: string`).
- Produces: `describeTicker(ticker: string): string | undefined` — used by Task 2.

- [ ] **Step 1: Install the test harness**

```bash
cd mobile && npx expo install --dev jest-expo jest @types/jest
```

Then add to `mobile/package.json` — a `test` script alongside the existing ones, and a top-level `jest` key:

```json
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "tsc": "tsc --noEmit",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo"
  }
```

If `jest-expo`'s preset fails to resolve under Expo 54, fall back to plain babel-jest — replace the `jest` key with:

```json
  "jest": {
    "transform": { "^.+\\.[jt]sx?$": ["babel-jest", { "presets": ["babel-preset-expo"] }] },
    "testEnvironment": "node"
  }
```

- [ ] **Step 2: Write the failing test**

Create `mobile/src/__tests__/tickerDescriptions.test.ts`:

```typescript
import { describeTicker } from '../tickerDescriptions';

describe('describeTicker', () => {
  it('describes a US ticker from the curated map', () => {
    expect(describeTicker('SPY')).toBe('S&P 500 — US large-cap equities');
  });

  it('describes a UK UCITS ticker from the ETF catalog', () => {
    expect(describeTicker('VUAG.L')).toBe('Vanguard S&P 500 UCITS');
  });

  it('is case-insensitive', () => {
    expect(describeTicker('spy')).toBe('S&P 500 — US large-cap equities');
  });

  it('returns undefined for an unknown ticker so the UI can render nothing', () => {
    expect(describeTicker('ZZZZ')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd mobile && npx jest src/__tests__/tickerDescriptions.test.ts`
Expected: FAIL — `Cannot find module '../tickerDescriptions'`

- [ ] **Step 4: Write the implementation**

Create `mobile/src/tickerDescriptions.ts`:

```typescript
/**
 * User-facing one-liners for the tickers shown on the decision screen.
 *
 * US entries are copied verbatim from `web/src/etfDescriptions.ts` so both
 * surfaces describe the same ticker the same way. UK UCITS tickers are not
 * listed here — they resolve through the ETF catalog, which already carries
 * a product name per alternative.
 *
 * The catalog's own `description` field is deliberately not used: it is
 * written for maintainers ("VAA EEM-style", "DAA canary (BND)") rather than
 * for someone deciding what to buy.
 */
import { ASSET_CLASSES } from './etfCatalog';

const DESCRIPTIONS: Record<string, string> = {
  // Equities — US
  SPY: 'S&P 500 — US large-cap equities',
  IWM: 'Russell 2000 — US small-cap equities',
  QQQ: 'Nasdaq 100 — US tech-heavy large caps',
  IWD: 'Russell 1000 Value — US large-cap value',

  // Equities — international
  EFA: 'MSCI EAFE — developed equities ex-US/Canada',
  VEA: 'Developed equities ex-US (Vanguard)',
  EEM: 'MSCI Emerging Markets — EM equities',
  VWO: 'Emerging-market equities (Vanguard)',
  VGK: 'Developed European equities',
  EWJ: 'Japanese equities',

  // Real assets
  VNQ: 'US real estate (REITs)',
  GSG: 'Broad commodities (S&P GSCI)',
  DBC: 'Diversified commodities (Deutsche Bank)',
  GLD: 'Physical gold',

  // Fixed income
  AGG: 'US aggregate investment-grade bonds',
  BND: 'Total US bond market (Vanguard)',
  LQD: 'Investment-grade US corporate bonds',
  HYG: 'US high-yield corporate bonds',
  TIP: 'US Treasury Inflation-Protected Securities',
  IEF: '7–10 year US Treasuries',
  TLT: '20+ year US Treasuries',
  SHY: '1–3 year US Treasuries',
  BIL: '1–3 month US Treasury bills',

  // Macro signals (LAA)
  UNRATE: 'US unemployment rate — FRED monthly series',
};

export function describeTicker(ticker: string): string | undefined {
  const upper = ticker.toUpperCase();
  const curated = DESCRIPTIONS[upper];
  if (curated) return curated;

  for (const definition of Object.values(ASSET_CLASSES)) {
    const option = definition.ukAlternatives.find(
      (o) => o.ticker.toUpperCase() === upper,
    );
    if (option) return option.name;
  }

  return undefined;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd mobile && npx jest src/__tests__/tickerDescriptions.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 6: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: no output

- [ ] **Step 7: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/src/tickerDescriptions.ts mobile/src/__tests__/tickerDescriptions.test.ts
git commit -m "feat(mobile): ticker descriptions module with a jest harness"
```

---

### Task 2: Show fund names under allocation tickers

The payoff line today is a bare `SPY  100%`. A newcomer cannot act on a ticker they do not recognise.

**Files:**
- Modify: `mobile/src/screens/DecisionScreen.tsx` — `AllocationsBlock` (lines 337-373) and the `styles` object (lines 449-664)

**Interfaces:**
- Consumes: `describeTicker(ticker: string): string | undefined` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Import the helper**

Add to the import block at the top of `DecisionScreen.tsx`, after the `strategies` import:

```typescript
import { describeTicker } from '../tickerDescriptions';
```

- [ ] **Step 2: Render the description in the single-asset hero**

In `AllocationsBlock`, replace the `allocations.length === 1` branch:

```typescript
  if (allocations.length === 1) {
    const a = allocations[0];
    const description = describeTicker(a.ticker);
    return (
      <View>
        <Text style={styles.heroTicker}>{a.ticker}</Text>
        {description && <Text style={styles.heroDescription}>{description}</Text>}
        <Text style={[styles.heroWeight, { color: accent }]}>{formatPercent(a.weight)}</Text>
      </View>
    );
  }
```

- [ ] **Step 3: Render the description in the multi-asset list**

Replace the `allocations.map` row in the same function:

```typescript
      {allocations.map((a) => {
        const description = describeTicker(a.ticker);
        return (
          <View key={a.ticker} style={styles.allocRow}>
            <View style={styles.allocRowLeft}>
              <Text style={[styles.allocTicker, { color: accent }]}>{a.ticker}</Text>
              {description && (
                <Text style={styles.allocDescription} numberOfLines={1}>
                  {description}
                </Text>
              )}
            </View>
            <Text style={styles.allocWeight}>{formatPercent(a.weight)}</Text>
          </View>
        );
      })}
```

`numberOfLines={1}` keeps a six-row allocation list from doubling in height on a narrow screen.

- [ ] **Step 4: Add the styles**

In the `styles` object, add after `heroTicker` and after `allocTicker` respectively:

```typescript
  heroDescription: {
    color: '#8a93a0',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  allocRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  allocDescription: {
    color: '#8a93a0',
    fontSize: 12,
    marginTop: 1,
  },
```

- [ ] **Step 5: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: no output

- [ ] **Step 6: Verify in the simulator**

Run: `cd mobile && npx expo start --ios`

Check: VAA (single-asset hero shows `SPY` with `S&P 500 — US large-cap equities` beneath it) and DAA offensive (six-row list, each row one description line, weights still right-aligned and not pushed off-screen).

- [ ] **Step 7: Commit**

```bash
git add mobile/src/screens/DecisionScreen.tsx
git commit -m "feat(mobile): name the funds behind allocation tickers"
```

---

### Task 3: Plain-language mode caption

`OFFENSIVE MODE` is jargon the app never defines. One line beneath it carries the meaning.

**Files:**
- Modify: `mobile/src/screens/DecisionScreen.tsx` — the `MODE_BADGE_COLOR` map (lines 97-101), `DecisionCard` (lines 304-335), and `styles`

**Interfaces:**
- Consumes: `decision.modeLabel: string` (values observed from the backend: `Offensive`, `Defensive`, `Hybrid`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the caption map**

Directly below `MODE_BADGE_COLOR` in `DecisionScreen.tsx`:

```typescript
/**
 * Plain-language gloss per mode, shown under the badge. Keyed on the same
 * `modeLabel` the backend emits; an unknown label renders no caption rather
 * than a wrong one.
 */
const MODE_CAPTION: Record<string, string> = {
  Offensive: 'Momentum is healthy — the strategy is invested in risk assets.',
  Defensive: 'Momentum has deteriorated — the strategy has moved to bonds or cash.',
  Hybrid: 'Momentum is mixed — the strategy is only partly invested in risk assets.',
};
```

- [ ] **Step 2: Render it**

In `DecisionCard`, replace the mode label block:

```typescript
      <Text style={[styles.modeLabel, { color: modeColor }]}>
        {decision.modeLabel.toUpperCase()} MODE
      </Text>
      {MODE_CAPTION[decision.modeLabel] && (
        <Text style={styles.modeCaption}>{MODE_CAPTION[decision.modeLabel]}</Text>
      )}
```

- [ ] **Step 3: Add the style**

After `modeLabel` in the `styles` object:

```typescript
  modeCaption: {
    color: '#8a93a0',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
```

- [ ] **Step 4: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: no output

- [ ] **Step 5: Verify in the simulator**

Run: `cd mobile && npx expo start --ios`

Check all three modes render their caption. Reaching a non-offensive mode with today's data may not be possible — use the as-of date picker on the home screen to pick a date in a known drawdown (e.g. 2022-06-30 for DAA, which should print Defensive or Hybrid).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/DecisionScreen.tsx
git commit -m "feat(mobile): explain what offensive/defensive/hybrid mode means"
```

---

### Task 4: Rebalance cadence line

The largest gap in the app: it says what to hold but never that these are monthly strategies, nor when to come back.

Deliberately month-granular. Resolving the last *trading* day would mean shipping an exchange calendar to the client, and "end of September" is the guidance a user actually acts on.

**Files:**
- Create: `mobile/src/rebalance.ts`
- Test: `mobile/src/__tests__/rebalance.test.ts`
- Modify: `mobile/src/screens/DecisionScreen.tsx` — `DecisionCard` and `styles`

**Interfaces:**
- Consumes: the `asOf` string already threaded into `DecisionScreen` as a prop, format `YYYY-MM-DD`.
- Produces: `rebalanceHint(asOf: string): string` — used in this task only.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/__tests__/rebalance.test.ts`:

```typescript
import { rebalanceHint } from '../rebalance';

describe('rebalanceHint', () => {
  it('points at the end of the current month mid-month', () => {
    expect(rebalanceHint('2026-09-11')).toBe(
      'Rebalance monthly · next at the end of September',
    );
  });

  it('rolls to the next month when the date is already month-end', () => {
    expect(rebalanceHint('2026-09-30')).toBe(
      'Rebalance monthly · next at the end of October',
    );
  });

  it('rolls across the year boundary', () => {
    expect(rebalanceHint('2026-12-31')).toBe(
      'Rebalance monthly · next at the end of January',
    );
  });

  it('handles a short month', () => {
    expect(rebalanceHint('2026-02-28')).toBe(
      'Rebalance monthly · next at the end of March',
    );
  });

  it('handles a leap-year February', () => {
    expect(rebalanceHint('2028-02-28')).toBe(
      'Rebalance monthly · next at the end of February',
    );
    expect(rebalanceHint('2028-02-29')).toBe(
      'Rebalance monthly · next at the end of March',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd mobile && npx jest src/__tests__/rebalance.test.ts`
Expected: FAIL — `Cannot find module '../rebalance'`

- [ ] **Step 3: Write the implementation**

Create `mobile/src/rebalance.ts`:

```typescript
/**
 * Keller's strategies are month-end rebalanced, so the only cadence the
 * user needs is "once a month, at month-end".
 *
 * Month-granular on purpose: naming the last *trading* day would require an
 * exchange calendar on the client, and the extra precision does not change
 * what the user does.
 *
 * The date string is split rather than passed to `new Date()`, which would
 * parse `YYYY-MM-DD` as UTC midnight and land on the previous day for any
 * user west of Greenwich.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function rebalanceHint(asOf: string): string {
  const [year, month, day] = asOf.split('-').map(Number);
  const monthIndex = month - 1;

  // On month-end itself the current month's rebalance is already the one
  // being shown, so the next one is a month out.
  const isMonthEnd = day >= daysInMonth(year, monthIndex);
  const targetIndex = isMonthEnd ? (monthIndex + 1) % 12 : monthIndex;

  return `Rebalance monthly · next at the end of ${MONTH_NAMES[targetIndex]}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd mobile && npx jest src/__tests__/rebalance.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Render it on the decision card**

`DecisionCard` does not currently receive `asOf`. Thread it through — in `DecisionScreen`, change the render call:

```typescript
        {decision && <DecisionCard decision={decision} asOf={asOf} />}
```

and the component signature and body:

```typescript
function DecisionCard({ decision, asOf }: { decision: AllocationDecision; asOf: string }) {
```

Then, immediately after `<AllocationsBlock ... />` and before the `reasoning` text:

```typescript
      <Text style={styles.rebalanceHint}>{rebalanceHint(asOf)}</Text>
```

Placed there because the order a user reads the card in is: what to hold → when to act → why.

Add the import alongside the others:

```typescript
import { rebalanceHint } from '../rebalance';
```

- [ ] **Step 6: Add the style**

After `allocTotalWeight` in the `styles` object:

```typescript
  rebalanceHint: {
    color: '#cfd5dc',
    fontSize: 13,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2f37',
  },
```

- [ ] **Step 7: Typecheck and test**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: no tsc output; all tests pass

- [ ] **Step 8: Verify in the simulator**

Run: `cd mobile && npx expo start --ios`

Check the line appears under the allocation on the decision screen, and that picking a month-end as-of date on the home screen rolls the named month forward.

Watch the multi-asset case (DAA offensive): the allocation list already ends with a bordered `Total` row, so the hint's own top border can read as a doubled divider. If it does, drop `borderTopWidth`/`borderTopColor` from `rebalanceHint` and keep the spacing.

- [ ] **Step 9: Commit**

```bash
git add mobile/src/rebalance.ts mobile/src/__tests__/rebalance.test.ts mobile/src/screens/DecisionScreen.tsx
git commit -m "feat(mobile): state the monthly rebalance cadence on the decision"
```

---

### Task 5: Collapse the momentum tables

Three lines were added above. This takes more away: the per-bucket score tables (up to 12 rows for DAA/PAA/BAA) become tap-to-expand, closed by default, so the default view is the decision alone.

**Files:**
- Modify: `mobile/src/screens/DecisionScreen.tsx` — `ScoreSection` (lines 375-422) and `styles`

**Interfaces:**
- Consumes: `AssetMomentum` rows, already passed in.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add collapse state to `ScoreSection`**

Replace the component's opening and header with a pressable header that toggles a local `useState`. `useState` is already imported at the top of the file; add `TouchableOpacity` to the `react-native` import if it is not already there (it is — the PAA picker uses it).

```typescript
function ScoreSection({
  title,
  rows,
  allocatedTickers,
}: {
  title: string;
  rows: AssetMomentum[];
  allocatedTickers: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);

  // The "Signal" bucket (currently only LAA) carries macro trend
  // deviations rather than per-asset momentum, and the bearish-trigger
  // direction is signal-specific (SPY: bearish when below SMA → score
  // negative; UNRATE: bearish when above SMA → score positive). The
  // generic "negative = red" colouring used for momentum scores would be
  // misleading here, so we render Signal rows neutrally and add a
  // direction hint underneath the value.
  const isSignalSection = title.toLowerCase() === 'signal';

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <Text style={styles.sectionTitle}>
          {isSignalSection ? 'MACRO SIGNALS' : title.toUpperCase()}
        </Text>
        <Text style={styles.sectionChevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded &&
        rows.map((r) => (
          <View key={`${r.bucket}:${r.ticker}`} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text
                style={[styles.rowTicker, allocatedTickers.has(r.ticker) && styles.rowTickerHighlight]}
              >
                {r.ticker}
              </Text>
              {isSignalSection && (
                <Text style={styles.signalCaption}>{signalCaption(r.ticker, r.score)}</Text>
              )}
            </View>
            <Text
              style={[
                styles.rowScore,
                !isSignalSection && r.score < 0 && styles.rowScoreNegative,
              ]}
            >
              {isSignalSection ? formatSignal(r.score) : formatScore(r.score)}
            </Text>
          </View>
        ))}
    </View>
  );
}
```

- [ ] **Step 2: Add the header styles**

`sectionTitle` currently carries `marginBottom: 8`, which would leave a gap under a collapsed header. Move that spacing onto the header row. Replace the `sectionTitle` entry and add two new ones:

```typescript
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#8a93a0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  sectionChevron: {
    color: '#8a93a0',
    fontSize: 12,
  },
```

- [ ] **Step 3: Typecheck and test**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: no tsc output; all tests pass

- [ ] **Step 4: Verify in the simulator**

Run: `cd mobile && npx expo start --ios`

Check: sections start closed and the whole decision fits without scrolling on VAA; tapping a header expands just that section; the chevron flips; LAA's `MACRO SIGNALS` section still shows its direction captions when expanded; allocated tickers are still highlighted green inside an expanded section.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/DecisionScreen.tsx
git commit -m "feat(mobile): collapse momentum tables behind a tap"
```

---

### Task 6: Outbound link to the web strategy page

The app has no outbound link of any kind today, so a user who wants to understand the strategy has no exit. This reverses the Phase A decision to decline a mobile back-link (see `2026-09-11-app-funnel-phase-b-design.md`, Out of scope) — the funnel is now live and one-directional.

The web route is `https://investment.ecomcraft.co.uk/strategies/<id>`, where `<id>` matches `StrategyId` exactly (`vaa` | `paa` | `daa` | `baa` | `haa` | `laa`); both the site root and `/strategies/vaa` were confirmed to return 200.

**Files:**
- Create: `mobile/src/webLinks.ts`
- Test: `mobile/src/__tests__/webLinks.test.ts`
- Modify: `mobile/src/screens/DecisionScreen.tsx` — imports, `DecisionScreen` body, `styles`

**Interfaces:**
- Consumes: `StrategyId` from `mobile/src/strategies.ts`; `strategy.id` is already a prop on `DecisionScreen`.
- Produces: `strategyWebUrl(id: StrategyId): string`.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/__tests__/webLinks.test.ts`:

```typescript
import { strategyWebUrl } from '../webLinks';

describe('strategyWebUrl', () => {
  it('builds the strategy page URL', () => {
    expect(strategyWebUrl('vaa')).toBe(
      'https://investment.ecomcraft.co.uk/strategies/vaa',
    );
  });

  it('uses the strategy id verbatim', () => {
    expect(strategyWebUrl('laa')).toBe(
      'https://investment.ecomcraft.co.uk/strategies/laa',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd mobile && npx jest src/__tests__/webLinks.test.ts`
Expected: FAIL — `Cannot find module '../webLinks'`

- [ ] **Step 3: Write the implementation**

Create `mobile/src/webLinks.ts`:

```typescript
/**
 * Links back to the companion web site. The app deliberately carries no
 * explanatory screens of its own — depth lives on the web, which is also
 * the acquisition funnel.
 */
import type { StrategyId } from './strategies';

export const WEB_BASE_URL = 'https://investment.ecomcraft.co.uk';

export function strategyWebUrl(id: StrategyId): string {
  return `${WEB_BASE_URL}/strategies/${id}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd mobile && npx jest src/__tests__/webLinks.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Render the link**

Add to the `react-native` import in `DecisionScreen.tsx`:

```typescript
  Linking,
```

and alongside the other local imports:

```typescript
import { strategyWebUrl } from '../webLinks';
```

Then, inside `DecisionScreen`'s `ScrollView`, after `{decision && <DecisionCard ... />}`, add:

```typescript
        <Pressable
          style={styles.learnMore}
          onPress={() => Linking.openURL(strategyWebUrl(strategy.id))}
          hitSlop={8}
        >
          <Text style={styles.learnMoreText}>How this strategy works →</Text>
        </Pressable>
```

`Pressable` is already imported (the back link uses it). The link renders unconditionally — it is most useful precisely when the decision failed to load.

- [ ] **Step 6: Add the styles**

At the end of the `styles` object:

```typescript
  learnMore: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  learnMoreText: {
    color: '#7ed4a3',
    fontSize: 14,
    fontWeight: '600',
  },
```

- [ ] **Step 7: Typecheck and test**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: no tsc output; all tests pass

- [ ] **Step 8: Verify in the simulator**

Run: `cd mobile && npx expo start --ios`

Check: the link sits below the card on every strategy, tapping it opens Safari on the matching strategy page (try VAA and LAA), and it is still present when the decision errors (airplane mode).

- [ ] **Step 9: Commit**

```bash
git add mobile/src/webLinks.ts mobile/src/__tests__/webLinks.test.ts mobile/src/screens/DecisionScreen.tsx
git commit -m "feat(mobile): link out to the web strategy page"
```

---

## Done when

- `cd mobile && npx tsc --noEmit && npx jest` is clean.
- The decision screen for VAA fits on one iPhone screen without scrolling.
- A reader who has never heard of Keller can answer, from that screen alone: what am I holding, what does it mean, and when do I act next.
