import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
export default function config(phase: string): NextConfig {
  return {
    devIndicators: false,
    distDir:
      process.env.NEXT_DIST_DIR ||
      (phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"),
    webpack(config, { dev }) {
      // Avoid reloading stale filesystem-cache modules after Windows restarts.
      if (dev) config.cache = false;
      return config;
    },
  };
}
