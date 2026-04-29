import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "none",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-unused-vars": "off",
      "no-var": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
