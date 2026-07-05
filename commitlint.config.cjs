/** Conventional Commits config (see CONTRIBUTING.md). */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "test", "refactor", "perf", "build", "ci"],
    ],
    // Disabled: detailed multi-line bodies exceed 100 chars; commonly relaxed.
    // Authors should still wrap bodies for readability where practical.
    "body-max-line-length": [0, "always", 100],
  },
};
