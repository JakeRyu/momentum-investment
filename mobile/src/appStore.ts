/**
 * App Store identity, and the app's own version.
 *
 * The id is duplicated from `web/src/appStore.ts` rather than shared: the
 * two are separate packages and Metro resolves from the mobile project
 * root, the same reason `universes.generated.json` is a copy. If the
 * listing ever moves, both files change together.
 */
export const APP_STORE_ID = '6785231353';

/**
 * Storefront-less App Store URL — Apple redirects the visitor to their own
 * regional storefront, which matters here because the holder we are most
 * likely to be nagging is a UK one.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
