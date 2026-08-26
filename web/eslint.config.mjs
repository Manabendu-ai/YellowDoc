/**
 * ESLint 9 flat config.
 *
 * `eslint-config-next` still ships as an eslintrc-style config, so it comes in
 * through FlatCompat — this is the same shape create-next-app generates for
 * Next 15. Two rule sets:
 *   next/core-web-vitals — the accessibility and performance rules
 *   next/typescript      — the TypeScript-aware layer on top
 *
 * There are a handful of `eslint-disable-next-line` comments in src/ (deliberate
 * exhaustive-deps exceptions, one control-character regex); they are annotated
 * with the reason at the call site.
 */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
