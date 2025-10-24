// Rate limiting storage
const rateLimit = new Map<string, number[]>();

/**
 * Checks if a request should be rate limited
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 100; // 100 requests per minute

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const requests = rateLimit.get(ip)!;
  const recent = requests.filter((time: number) => now - time < window);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}

/**
 * Gets client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Try multiple headers in order of preference
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    request.headers.get('X-Client-IP');

  if (ip) return ip;

  // Generate unique identifier for unknown IPs
  return (
    'unknown-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)
  );
}
