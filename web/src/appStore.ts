/**
 * App Store identity for the companion iPhone app.
 *
 * Single source of truth for the listing: the numeric id also drives the
 * Smart App Banner (`apple-itunes-app`) meta tag in `index.html`, so if the
 * listing ever moves, both need updating together.
 */
export const APP_STORE_ID = '6785231353'

/**
 * Storefront-less App Store URL. Apple redirects the visitor to their own
 * regional storefront, so a UK reader and a US reader both land somewhere
 * they can actually install from — important because the site's whole pitch
 * is that the app localises the ticker universe.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`

/** Apple's prescribed call-to-action wording; also the badge's alt text. */
export const APP_STORE_CTA = 'Download on the App Store'
