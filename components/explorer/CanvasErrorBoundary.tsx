"use client";

import { Component, type ReactNode } from "react";

/** Catches any render/runtime error from the WebGL 3D scene so a failure degrades
 *  to a readable fallback instead of a blank canvas or a stuck loading skeleton. */
export class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D explorer failed to render:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
