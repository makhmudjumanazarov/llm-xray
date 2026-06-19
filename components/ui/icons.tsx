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
