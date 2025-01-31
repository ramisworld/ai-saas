import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow `any` but warn about it
      "@typescript-eslint/no-explicit-any": "warn",

      // Handle unused variables  
      "@typescript-eslint/no-unused-vars": [
        "warn", // Change to "warn" instead of "error"
        {
          args: "none", // Ignore unused function arguments
          varsIgnorePattern: "^_", // Ignore variables starting with an underscore
          caughtErrors: "none", // Ignore unused catch parameters
        },
      ],

      // Disable the base `no-unused-vars` rule in favor of the TypeScript version
      "no-unused-vars": "off",

      // Enforce `let` or `const` instead of `var`
      "no-var": "error",

      // Disallow unsafe non-null assertions with optional chaining
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",

      // Enforce React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;