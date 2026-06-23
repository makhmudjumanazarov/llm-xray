// Pure normalization math for the lesson. RMSNorm only rescales by the root-mean-
// square (no mean subtraction); LayerNorm centers then rescales. Both then apply a
// learned gain γ (LayerNorm also a bias β).

export function mean(x: number[]): number {
  return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0;
}

export function rms(x: number[]): number {
  return x.length ? Math.sqrt(x.reduce((a, b) => a + b * b, 0) / x.length) : 0;
}

export function rmsnorm(x: number[], gamma = 1, eps = 1e-6): number[] {
  const r = Math.sqrt(rms(x) ** 2 + eps) || 1;
  return x.map((v) => (v / r) * gamma);
}

export function layernorm(x: number[], gamma = 1, beta = 0, eps = 1e-6): number[] {
  const m = mean(x);
  const variance = x.length ? x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length : 0;
  const s = Math.sqrt(variance + eps) || 1;
  return x.map((v) => ((v - m) / s) * gamma + beta);
}
