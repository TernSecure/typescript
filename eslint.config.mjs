import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        process: true,
        React: true
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': pluginReact
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",  // Disable no-explicit-any rule
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React import
      "react/prop-types": "off", // We're using TypeScript for prop validation
      "no-undef": "off" // TypeScript handles this
    }
  }
];