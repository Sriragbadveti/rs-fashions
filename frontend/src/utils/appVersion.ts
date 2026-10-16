/**
 * Picks up new website releases in tabs that were opened before the release.
 *
 * The site is a single-page app: moving between pages in an open tab never reloads its code, so a
 * tab opened before a deploy keeps showing the old version until it is refreshed. The release is
 * identified by the hashed name of the main script in index.html (/assets/index-<hash>.js), which
 * changes with every build. When it differs from the one running, the next page change becomes a
 * normal full page load instead (never on checkout/payment/login pages, at most once per release).
 */

const BUNDLE_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/;

/** "/assets/index-<hash>.js" from an index.html (or script URL), or null. */
export function extractBundle(source: string | null | undefined): string | null {
  const m = BUNDLE_RE.exec(String(source || ""));
  return m ? m[0] : null;
}

// Pages where a reload could interrupt a payment or a sign-in.
const PROTECTED_PATHS = [/^\/checkout/, /^\/pay\b/, /^\/login/, /^\/auth/, /\/login$/];

export function shouldReloadForUpdate(opts: {
  current: string | null;
  latest: string | null;
  nextPath: string;
  alreadyReloadedFor?: string | null;
}): boolean {
  const { current, latest, nextPath, alreadyReloadedFor } = opts;
  if (!current || !latest || current === latest) return false;
  if (alreadyReloadedFor === latest) return false; // loop guard
  return !PROTECTED_PATHS.some((re) => re.test(nextPath));
}
