import * as Application from 'expo-application';

/**
 * The version of the binary actually running, read from the native
 * `CFBundleShortVersionString` rather than from `app.json`.
 *
 * `Constants.expoConfig.version` would read the app config's copy, baked
 * into the JS bundle at build time. Expo's own guidance is to use
 * `expo-application` instead, and the reason matters for what this value is
 * for: the question a version handshake asks is "which binary is this
 * person running", and only the binary can answer it. The two agree today —
 * they part company the day an over-the-air update swaps the JS bundle
 * without replacing the binary, which is exactly when the answer counts.
 *
 * Null off a device (web, and anywhere the module is unavailable). Callers
 * send no header at all in that case, and the server reads a missing header
 * as current — so a dev build that cannot answer is never nagged.
 *
 * In Expo Go the native application is Expo Go, so this reports Expo Go's
 * own version rather than this app's — don't be alarmed by a 2.x in the
 * request header while developing. It is harmless: the server's line sits
 * far below it, so a dev session reads as current either way. A standalone
 * build reports the version from `app.json` that EAS wrote into the
 * Info.plist, which is the number this is actually about.
 */
export function appVersion(): string | null {
  return Application.nativeApplicationVersion;
}

/**
 * Only an explicit "outdated" nags. A missing field (an older server), an
 * unrecognised one (a newer server with more to say), or a failed request
 * all leave the app quiet.
 *
 * The bias is deliberate and matches the server's: the cost of a banner
 * that should not be there is that the next real one gets ignored.
 */
export function isOutdated(clientStatus: string | undefined | null): boolean {
  return clientStatus === 'outdated';
}

/**
 * Home holds one result per registered strategy, any of which may still be
 * loading or have failed. One verdict is enough — they all carried the same
 * version header — so this asks whether any answer that did arrive says the
 * app is stale.
 */
export function anyOutdated(
  results: Iterable<{ decision: { clientStatus?: string } | null } | undefined>,
): boolean {
  for (const result of results) {
    if (isOutdated(result?.decision?.clientStatus)) return true;
  }
  return false;
}
