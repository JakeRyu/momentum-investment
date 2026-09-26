import { Platform } from 'react-native';

/**
 * Store identities, and which one this build came from.
 *
 * The App Store id is duplicated from `web/src/appStore.ts` rather than
 * shared: the two are separate packages and Metro resolves from the mobile
 * project root, the same reason `universes.generated.json` is a copy. If
 * the listing ever moves, both files change together.
 */
export const APP_STORE_ID = '6785231353';

/**
 * Storefront-less App Store URL — Apple redirects the visitor to their own
 * regional storefront, which matters here because the holder we are most
 * likely to be nagging is a UK one.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/**
 * The https form rather than `market://`. The Play Store app claims these
 * links, so on a device with Play this opens the listing directly; on one
 * without, it still lands somewhere instead of throwing.
 */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.jake.momentuminvestment';

/**
 * The store that can update this install. Takes the OS as an argument so
 * both branches can be tested without mocking `Platform`.
 */
export function storeFor(os: string = Platform.OS): { name: string; url: string } {
  return os === 'android'
    ? { name: 'Google Play', url: PLAY_STORE_URL }
    : { name: 'the App Store', url: APP_STORE_URL };
}
