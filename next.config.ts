import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
export default function config(phase: string): NextConfig {
  return {
    devIndicators: false,
    // The workspace seeds real citation sources at runtime; include these
    // files in both serverless API bundles so source previews keep working.
    outputFileTracingIncludes: {
      "/api/workspace": [
        "./source_pack_index.json",
        "./ALP_Alpha/**/*",
        "./BET_Beta/**/*",
        "./DEL_Delta/**/*",
        "./EPS_Epsilon/**/*",
        "./GAM_Gamma/**/*",
      ],
      "/api/work-engine": [
        "./source_pack_index.json",
        "./ALP_Alpha/**/*",
        "./BET_Beta/**/*",
        "./DEL_Delta/**/*",
        "./EPS_Epsilon/**/*",
        "./GAM_Gamma/**/*",
      ],
    },
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
