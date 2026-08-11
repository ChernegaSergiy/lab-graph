export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { console: "readonly" },
    },
    rules: {
      "no-unused-vars": ["warn", { "args": "none" }],
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
    },
  },
];
