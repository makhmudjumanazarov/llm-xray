/**
 * llm-xray mark: a scan aperture — a ring + crosshair ticks focusing on a cyan
 * core (the "x-ray scan point", echoes the forward-pass pulse).
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="lx-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#lx-grad)" />
      {/* aperture ring */}
      <circle cx="14" cy="14" r="6" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.9" />
      {/* crosshair ticks */}
      <g stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <line x1="14" y1="3.4" x2="14" y2="6" />
        <line x1="14" y1="22" x2="14" y2="24.6" />
        <line x1="3.4" y1="14" x2="6" y2="14" />
        <line x1="22" y1="14" x2="24.6" y2="14" />
      </g>
      {/* scan core */}
      <circle cx="14" cy="14" r="2.4" fill="#22d3ee" />
      <circle cx="14" cy="14" r="2.4" fill="#22d3ee" opacity="0.35">
        <animate attributeName="r" values="2.4;5;2.4" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
