declare module "react-katex" {
  import type { ComponentType, ReactNode } from "react";
  type KatexProps = {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
    settings?: Record<string, unknown>;
    as?: string;
  };
  export const InlineMath: ComponentType<KatexProps>;
  export const BlockMath: ComponentType<KatexProps>;
}
