export function getLegacyHashRedirect(rawUrl: string): string | null {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (!url.hash.startsWith('#/')) return null;
  const hashValue = url.hash.slice(1);
  if (/^\/https?:\/\//i.test(hashValue) || hashValue.startsWith('//')) return null;
  let route: URL;
  try { route = new URL(hashValue, url.origin); } catch { return null; }
  if (route.origin !== url.origin || !route.pathname.startsWith('/')) return null;
  const merged = new URLSearchParams(url.search);
  route.searchParams.forEach((value, key) => merged.set(key, value));
  const query = merged.toString();
  return `${route.pathname}${query ? `?${query}` : ''}${route.hash}`;
}
