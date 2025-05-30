module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding tests
        'chore',    // Maintenance
        'ci',       // CI/CD changes
        'revert',   // Revert changes
      ],
    ],
    'scope-enum': [
      2,
      'always',
      ['root', 'web-app', 'landing', 'ai-server', 'shared', 'deps'],
    ],
  },
};
