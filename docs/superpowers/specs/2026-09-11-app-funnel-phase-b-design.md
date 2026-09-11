# Web → App Funnel, Phase B — Design

Date: 2026-09-11
Scope: `web/` only. Swaps Phase A's placeholder marker for the real App
Store link now that the iPhone app is live.

## Background

Phase A (2026-07-19, #8) shipped the funnel structure — `AppPromo` on every
strategy page, a `TAKE IT WITH YOU` section on Home, and corrected About
copy — but the app was still pending App Store review, so both CTAs were a
static `COMING SOON TO THE APP STORE` marker.

The listing is now live:

- App ID: `6785231353`
- Bundle: `com.jake.momentuminvestment`
- Seller: ECOMCRAFT LTD
- Version 1.0

Phase B replaces the markers and adds the Smart App Banner Phase A deferred.

## Changes

### 1. New module: `web/src/appStore.ts`

Single source of truth for the listing, so the id and URL are not repeated
across components:

- `APP_STORE_ID` — `6785231353`
- `APP_STORE_URL` — `https://apps.apple.com/app/id${APP_STORE_ID}`
- `APP_STORE_CTA` — `Download on the App Store`

The URL deliberately carries **no storefront segment** (not `/gb/`). Apple
redirects visitors to their own regional storefront, which matters here:
the site's pitch is that the app localises the ticker universe, so a US
reader landing on a GB-locked page would be a poor first impression.

### 2. Smart App Banner in `web/index.html`

`<meta name="apple-itunes-app" content="app-id=6785231353" />` — iOS Safari
then offers the app above the page. The id is duplicated here because a
meta tag cannot read a TS constant; a comment in both files flags the pair.

### 3. `AppPromo` CTA → text link

The `<span class="app-promo__cta">` becomes an `<a>` to `APP_STORE_URL`
(`target="_blank"`, `rel="noreferrer"`), reading `Download on the App Store →`.

Styling shifts from `--muted` to `--ink` — it is now interactive, so it
should not read as disabled — and gains a hover/focus state that inverts to
ink-on-cream. No transition: the design system has none.

**Why not the official badge here?** Apple's badge is black-filled with
rounded corners, which fights the Brutalist Quarterly grid
(`DESIGN.md`: sharp 90° corners, three colours, no fills). At the size the
promo box allows it reads as a foreign object. Apple's marketing guidelines
permit a plain-text CTA using the prescribed wording, which is what this is.

### 4. Home section → official Apple badge

The Home marker becomes the real badge (`web/public/app-store-badge.svg`,
Apple's US-UK RGB black SVG, 119.66×40 native) linked to `APP_STORE_URL`.

Home is the marketing surface where recognition beats grid purity — a
reader scanning the page should spot a badge they already know. Rendered at
48px tall (above Apple's 40px web minimum) with 5px padding as clear space,
negative-margined so it does not disturb the section's spacing.

Alt text is the CTA wording, not a description of the image.

### 5. Unchanged

- About copy — Phase A already rewrote it to describe the app in the
  present tense; nothing to correct.
- `AppPromo` body copy, Home comparison columns, hero.
- No backend, mobile, or API changes.

## Out of scope

- Home card live-decision restyle (still backlog).
- Mobile "Learn more" back-link to web (declined in Phase A).
- Any App Store campaign/attribution tokens on the URL.

## Verification

No JS test infra in `web/`; verify with `npm run lint`, `npm run build`,
and browse:

1. Strategy page (desktop + 375px): CTA renders as a link, hover inverts,
   opens the listing.
2. Home (desktop + 375px): badge renders at 48px, no overflow.
3. Built `dist/index.html` contains the `apple-itunes-app` tag.
4. Error state on a strategy page: promo box still renders below the error.
