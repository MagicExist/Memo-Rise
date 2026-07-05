/** Conventional Commits config (see CONTRIBUTING.md). */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "test", "refactor", "perf", "build", "ci"],
    ],
  },
};
