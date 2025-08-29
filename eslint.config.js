let config;
try {
  const js = (await import("@eslint/js")).default;
  const globals = (await import("globals")).default;
  const reactHooks = (await import("eslint-plugin-react-hooks")).default;
  const reactRefresh = (await import("eslint-plugin-react-refresh")).default;
  const tseslint = (await import("typescript-eslint")).default;

  config = tseslint.config(
    { ignores: ["dist"] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
          "warn",
          { allowConstantExport: true },
        ],
        "@typescript-eslint/no-unused-vars": "off",
      },
    }
  );
  // Test and functions overrides
  config.push(
    {
      files: [
        "test/**/*.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "supabase/functions/**/*.ts",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    }
  );
} catch {
  config = [
    {
      files: ["**/*.js"],
      ignores: ["eslint.config.js"],
      languageOptions: { ecmaVersion: 2022 },
    },
  ];
}

export default config;
