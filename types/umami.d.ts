// The global injected by the Umami analytics script (loaded only when the
// NEXT_PUBLIC_UMAMI_* env vars are set). Optional everywhere.
declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number>) => void;
    };
  }
}

export {};
