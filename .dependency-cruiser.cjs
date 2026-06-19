/** Enforces the modulith layering: app → modules → core; modules → infra. */
module.exports = {
  forbidden: [
    {
      name: "core-stays-pure",
      comment: "core/ is the pure domain — it must not depend on modules, infra, app, components or workers.",
      severity: "error",
      from: { path: "^src/core" },
      to: { path: "^(src/modules|src/infra|app|components|workers)" },
    },
    {
      name: "modules-no-presentation",
      comment: "Bounded-context modules must not import the presentation layer.",
      severity: "error",
      from: { path: "^src/modules" },
      to: { path: "^(app|components)" },
    },
    {
      name: "presentation-no-direct-infra",
      comment: "Pages/components must go through a module service — never reach into infra (db/cache/config/env) directly.",
      severity: "error",
      from: { path: "^(app|components)" },
      to: { path: "^src/infra" },
    },
    {
      name: "no-circular",
      comment: "Circular dependencies signal a leaky boundary.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
