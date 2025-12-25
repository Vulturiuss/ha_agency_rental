type RateState = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateState>();

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function isRateLimited(req: Request, options: RateLimitOptions) {
  const ip = getClientIp(req);
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, resetAt: now + options.windowMs };
  }

  if (existing.count >= options.limit) {
    return { limited: true, resetAt: existing.resetAt };
  }

  existing.count += 1;
  store.set(key, existing);
  return { limited: false, resetAt: existing.resetAt };
}
