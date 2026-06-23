import type { ReactNode } from "react";

// Tiny dependency-free icon set (lucide-style geometry, currentColor stroke).
type IconProps = { size?: number; className?: string; strokeWidth?: number };

function make(path: ReactNode) {
  return function Icon({ size = 14, className = "", strokeWidth = 2.2 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };
}

export const ChevronUp = make(<path d="m18 15-6-6-6 6" />);
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const ChevronRight = make(<path d="m9 18 6-6-6-6" />);
export const ChevronsUpDown = make(<path d="m7 15 5 5 5-5M7 9l5-5 5 5" />);
export const ArrowLeft = make(<path d="M19 12H5M12 19l-7-7 7-7" />);
export const Search = make(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>,
);
export const Play = make(<path d="M6 4v16l13-8z" />);
export const Square = make(<rect x="6" y="6" width="12" height="12" rx="1.5" />);
export const Menu = make(<path d="M4 6h16M4 12h16M4 18h16" />);
export const X = make(<path d="M18 6 6 18M6 6l12 12" />);
export const Sparkles = make(
  <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />,
);

// Training-lifecycle stage glyphs.
export const Database = make(
  <>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </>,
);
export const Target = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </>,
);
export const Scale = make(
  <>
    <path d="M12 3v18" />
    <path d="M7 21h10" />
    <path d="M5 7h14" />
    <path d="M5 7l-3 6a3 3 0 0 0 6 0z" />
    <path d="M19 7l-3 6a3 3 0 0 0 6 0z" />
  </>,
);
export const Trophy = make(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.7V18c0 .8-.6 1.2-1.2 1.5C7.8 20 7 21 7 22" />
    <path d="M14 14.7V18c0 .8.6 1.2 1.2 1.5C16.2 20 17 21 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>,
);

// Inference-journey stage glyphs.
export const Type = make(
  <>
    <path d="M4 7V5h16v2" />
    <path d="M9 19h6" />
    <path d="M12 5v14" />
  </>,
);
export const Grid = make(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>,
);
export const Layers = make(
  <>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <rect x="3" y="16" width="18" height="4" rx="1" />
  </>,
);
export const BarChart = make(
  <>
    <path d="M3 3v18h18" />
    <path d="M8 17v-5" />
    <path d="M13 17V8" />
    <path d="M18 17v-9" />
  </>,
);
export const Dice = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8" cy="8" r="1" />
    <circle cx="16" cy="8" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="8" cy="16" r="1" />
    <circle cx="16" cy="16" r="1" />
  </>,
);
export const Repeat = make(
  <>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </>,
);

// Evolution-timeline era glyphs.
// Classical ML — an f(x) curve crossing axes (a fitted function / boundary).
export const Function = make(
  <>
    <path d="M4 20V6a2 2 0 0 1 2-2" />
    <path d="M4 13h6" />
    <path d="M20 6c-6 0-7 14-12 14" />
  </>,
);
// Perceptron / neural net — input nodes wired to an output node.
export const Network = make(
  <>
    <circle cx="5" cy="6" r="2" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="19" cy="12" r="2.5" />
    <path d="M7 6.8 16.7 11M7 17.2 16.7 13" />
  </>,
);
// Vision — an eye (perception).
export const Eye = make(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
// LLMs — a friendly bot head.
export const Bot = make(
  <>
    <rect x="4" y="8" width="16" height="11" rx="2.5" />
    <path d="M12 5v3M12 3.5h.01" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M2 13v2M22 13v2" />
  </>,
);
// Frontier — a connected globe (multimodal, open, worldwide).
export const Globe = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
  </>,
);
