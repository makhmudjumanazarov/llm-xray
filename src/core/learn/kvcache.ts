// Pure KV-cache helpers for the lesson: the cache stores keys/values for every
// past position so attention isn't recomputed; sliding-window models evict the
// oldest positions to cap memory.

/** Approximate KV-cache memory in bytes: 2 (K+V) · layers · kvHeads · headDim · seq · bytes/elem. */
export function cacheBytes(seqLen: number, layers: number, kvHeads: number, headDim: number, bytesPerElem = 2): number {
  return Math.max(0, seqLen) * layers * 2 * kvHeads * headDim * bytesPerElem;
}

/** Which positions are still cached vs evicted under an optional sliding window. */
export function windowKept(total: number, window?: number): { active: number[]; evicted: number[] } {
  const all = Array.from({ length: Math.max(0, total) }, (_, i) => i);
  if (!window || window >= total) return { active: all, evicted: [] };
  const cutoff = total - window;
  return { active: all.filter((i) => i >= cutoff), evicted: all.filter((i) => i < cutoff) };
}
