// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    // Ignore build output and dependencies
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,

  // App source (browser + React)
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React rules (includes react/jsx-uses-vars)
      ...(react.configs?.flat?.recommended?.rules ?? react.configs.recommended.rules),

      // React 17+ JSX transform (no need for React in scope)
      ...(react.configs?.flat?.["jsx-runtime"]?.rules ?? {}),
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // If you aren't using PropTypes
      "react/prop-types": "off",

      // Hooks rules
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Tooling/config files (node)
  {
    files: ["vite.config.*", "*.config.*", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
