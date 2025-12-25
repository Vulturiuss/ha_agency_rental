export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  if (!host) return true;

  const expectedHost = host.toLowerCase();
  const matchesHost = (value: string) => {
    try {
      const url = new URL(value);
      return url.host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  };

  if (origin) return matchesHost(origin);
  if (referer) return matchesHost(referer);
  return true;
}
