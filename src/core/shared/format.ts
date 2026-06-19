// Compact, locale-light formatters for the ranking table.

export function compactNumber(n: number): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function params(paramsB: number): string {
  if (!paramsB) return "—";
  if (paramsB < 1) return `${Math.round(paramsB * 1000)}M`;
  return `${paramsB}B`;
}

export function contextLen(n: number): string {
  if (!n) return "—";
  if (n >= 1024) return `${Math.round(n / 1024)}K`;
  return String(n);
}

export function mmlu(v?: number): string {
  return v == null ? "—" : v.toFixed(1);
}
