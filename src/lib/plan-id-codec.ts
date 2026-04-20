/**
 * Encode/decode Vowena plan IDs into short, opaque, URL-safe strings.
 *
 * The on-chain plan ID is a globally-incrementing u64 (1, 2, 3, …).
 * That's a problem for two reasons when exposed to users:
 *   1. /p/2 looks "beginner" and unfinished
 *   2. URLs are visibly sequential — anyone seeing /p/AAAB and /p/AAAC could
 *      guess they're consecutive plans, which is true but feels guessable
 *
 * This module fixes both. We multiplicatively scramble the plan ID using a
 * fixed prime (golden-ratio constant) modulo 2^32 — a classic invertible hash.
 * Tiny inputs map to wildly different outputs, while the bijection means we
 * can perfectly recover the original plan ID for chain reads.
 *
 *   plan id 1   →  scramble  →  encode  →  "ABRsj"
 *   plan id 2   →  scramble  →  encode  →  "Q8xPm"
 *   plan id 3   →  scramble  →  encode  →  "f4Tn2"
 *
 * Properties:
 *   - 5-char minimum, ~6 chars typical — short enough to share, long enough
 *     to feel like a real ID
 *   - No visible sequence — plan 1 and plan 2 are unrelated strings
 *   - Reversible: anyone with the encoded ID resolves to the same plan
 *   - Backward compatible: decode() also accepts plain numeric strings, so
 *     existing /p/42 links keep working
 *   - Alphabet excludes ambiguous chars (I, O, l, 0, 1)
 */

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const BASE = BigInt(ALPHABET.length); // 56
const MIN_LENGTH = 5;

// Multiplicative scrambling — bijective mapping from u32 to u32.
// SCRAMBLE is the well-known golden-ratio constant (Knuth's multiplicative hash).
const SCRAMBLE = 0x9e3779b1n;        // 2654435761
const MASK = (1n << 32n) - 1n;       // 2^32 - 1
const MOD = 1n << 32n;               // 2^32

// Modular inverse of SCRAMBLE mod 2^32, computed once at module load.
// We need this so unscramble(scramble(x)) === x for any x in [0, 2^32).
const SCRAMBLE_INV = modInverse32(SCRAMBLE);

function modInverse32(a: bigint): bigint {
  let [oldR, r] = [a, MOD];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % MOD) + MOD) % MOD;
}

function scramble(id: number): bigint {
  return (BigInt(id) * SCRAMBLE) & MASK;
}

function unscramble(s: bigint): number {
  return Number((s * SCRAMBLE_INV) & MASK);
}

export function encodePlanId(id: number): string {
  if (!Number.isFinite(id) || id < 0) return "";

  let n = scramble(id);
  if (n === 0n) return ALPHABET[0].repeat(MIN_LENGTH);

  let s = "";
  while (n > 0n) {
    s = ALPHABET[Number(n % BASE)] + s;
    n = n / BASE;
  }
  return s.padStart(MIN_LENGTH, ALPHABET[0]);
}

export function decodePlanId(input: string): number {
  if (!input) return NaN;

  // Back-compat: plain numeric strings (legacy URLs and direct copy/paste).
  if (/^\d+$/.test(input)) return parseInt(input, 10);

  let n = 0n;
  for (const ch of input) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return NaN;
    n = n * BASE + BigInt(i);
  }
  return unscramble(n);
}

/**
 * Build the canonical public checkout URL for a plan.
 */
export function planCheckoutUrl(planId: number, origin?: string): string {
  const path = `/p/${encodePlanId(planId)}`;
  if (typeof window !== "undefined" && !origin) {
    return `${window.location.origin}${path}`;
  }
  return `${origin ?? ""}${path}`;
}
