export const LUCKY_COUPON_STORAGE_KEY = "rr_lucky_dj_coupon_v1";
export const LUCKY_COUPON_DURATION_MS = 15 * 60 * 1000; // 15 minutes urgency

export type LuckyCoupon = {
  code: string;
  productKey: "dj_pack_50";
  originalPrice: number;
  discountedPrice: number;
  discountPct: number;
  wonAt: number;
  expiresAt: number;
  winnerNumber: number; // 1-10000
  winnerId: string; // short unique id for feeling
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `LUCKY-${out}`;
}

function randomWinnerMeta() {
  const n = Math.floor(Math.random() * 9000) + 1000; // 1000-9999 feels rare
  return n;
}

export function generateLuckyCoupon(): LuckyCoupon {
  const now = Date.now();
  const winnerNumber = randomWinnerMeta();
  // make winnerId like #00847
  const winnerId = `RR-${String(winnerNumber).padStart(5, "0")}-${Math.floor(Math.random() * 90 + 10)}`;
  return {
    code: randomCode(),
    productKey: "dj_pack_50",
    originalPrice: 8.99,
    discountedPrice: 5,
    discountPct: 44,
    wonAt: now,
    expiresAt: now + LUCKY_COUPON_DURATION_MS,
    winnerNumber,
    winnerId,
  };
}

export function saveLuckyCoupon(coupon: LuckyCoupon) {
  try {
    localStorage.setItem(LUCKY_COUPON_STORAGE_KEY, JSON.stringify(coupon));
    // also session for cross-tab
    sessionStorage.setItem(LUCKY_COUPON_STORAGE_KEY, JSON.stringify(coupon));
  } catch {}
}

export function loadLuckyCoupon(): LuckyCoupon | null {
  try {
    const raw = localStorage.getItem(LUCKY_COUPON_STORAGE_KEY) || sessionStorage.getItem(LUCKY_COUPON_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LuckyCoupon;
    if (!parsed.code || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      // expired - clear
      clearLuckyCoupon();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLuckyCoupon() {
  try {
    localStorage.removeItem(LUCKY_COUPON_STORAGE_KEY);
    sessionStorage.removeItem(LUCKY_COUPON_STORAGE_KEY);
  } catch {}
}

export function isLuckyCouponValid(coupon: LuckyCoupon | null): boolean {
  if (!coupon) return false;
  return Date.now() < coupon.expiresAt;
}

export function getLuckyCouponRemainingMs(coupon: LuckyCoupon | null): number {
  if (!coupon) return 0;
  return Math.max(0, coupon.expiresAt - Date.now());
}

export function formatRemainingMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
