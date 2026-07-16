const usageByUser = new Map();

const DEFAULT_BURST_MAX = 5;
const DEFAULT_BURST_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_DAILY_MAX = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneAll(now, dailyWindowMs) {
  if (usageByUser.size <= 1000) {
    return;
  }

  for (const [userId, timestamps] of usageByUser) {
    if (timestamps.every((timestamp) => now - timestamp >= dailyWindowMs)) {
      usageByUser.delete(userId);
    }
  }
}

export function aiRateLimit(req, res, next) {
  const userId = req.user._id.toString();
  const now = Date.now();
  const burstMax = positiveInteger(process.env.AI_RATE_LIMIT_BURST, DEFAULT_BURST_MAX);
  const dailyMax = positiveInteger(process.env.AI_RATE_LIMIT_DAILY, DEFAULT_DAILY_MAX);
  const burstWindowMs = positiveInteger(
    process.env.AI_RATE_LIMIT_WINDOW_MS,
    DEFAULT_BURST_WINDOW_MS
  );
  const dailyWindowMs = DAY_MS;

  pruneAll(now, dailyWindowMs);

  const recent = (usageByUser.get(userId) || []).filter(
    (timestamp) => now - timestamp < dailyWindowMs
  );
  const burstCount = recent.filter((timestamp) => now - timestamp < burstWindowMs).length;

  if (burstCount >= burstMax || recent.length >= dailyMax) {
    const oldestRelevant = burstCount >= burstMax ? recent[recent.length - burstCount] : recent[0];
    const windowMs = burstCount >= burstMax ? burstWindowMs : dailyWindowMs;
    const retrySeconds = Math.max(1, Math.ceil((oldestRelevant + windowMs - now) / 1000));
    res.set("Retry-After", String(retrySeconds));
    return res.status(429).json({
      message: "AI food logging limit reached. Please wait before trying again."
    });
  }

  recent.push(now);
  usageByUser.set(userId, recent);
  next();
}

export function resetAiRateLimits() {
  usageByUser.clear();
}
