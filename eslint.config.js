import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Ignore patterns first
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      ".turbo/**",
      "coverage/**",
      "**/*.d.ts",
      "public/**",
    ],
  },

  // Use Next.js configuration via FlatCompat
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Additional custom rules
  {
    rules: {
      // Code quality rules
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      
      // Style rules
      "semi": ["error", "always"],
      "quotes": ["error", "single", { "avoidEscape": true }],
      "comma-dangle": ["error", "always-multiline"],
      
      // Best practices
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      
      // React/Next.js specific
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },

  // Configuration for config files
  {
    files: ["*.config.{js,ts}", "*.config.*.{js,ts}"],
    rules: {
      "no-console": "off", // Allow console in config files
    },
  },
];