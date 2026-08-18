export const WHEEL_COUPON_KEY = "rr_wheel_coupon_v1";
export const DJ_CONTACTS_REGULAR = 8.99;
export const DJ_CONTACTS_DEAL = 5;

export type WheelCoupon = {
  code: string;
  productKey: "dj_contacts";
  prize: "50 DJs Contact List";
  regularPrice: number;
  dealPrice: number;
  wonAt: number;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randChunk(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function generateWheelCoupon(): WheelCoupon {
  return {
    code: `DJ5-${randChunk(4)}-${randChunk(4)}`,
    productKey: "dj_contacts",
    prize: "50 DJs Contact List",
    regularPrice: DJ_CONTACTS_REGULAR,
    dealPrice: DJ_CONTACTS_DEAL,
    wonAt: Date.now(),
  };
}

export function readWheelCoupon(): WheelCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WHEEL_COUPON_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WheelCoupon>;
    if (
      typeof parsed.code !== "string" ||
      !parsed.code.startsWith("DJ5-") ||
      parsed.productKey !== "dj_contacts"
    ) {
      return null;
    }
    return {
      code: parsed.code,
      productKey: "dj_contacts",
      prize: "50 DJs Contact List",
      regularPrice: DJ_CONTACTS_REGULAR,
      dealPrice: DJ_CONTACTS_DEAL,
      wonAt: typeof parsed.wonAt === "number" ? parsed.wonAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveWheelCoupon(coupon: WheelCoupon) {
  try {
    sessionStorage.setItem(WHEEL_COUPON_KEY, JSON.stringify(coupon));
  } catch {
    // Best-effort in private browsing.
  }
}

export function clearWheelCoupon() {
  try {
    sessionStorage.removeItem(WHEEL_COUPON_KEY);
  } catch {
    // Best-effort only.
  }
}

export function hasWheelCoupon() {
  return Boolean(readWheelCoupon());
}
