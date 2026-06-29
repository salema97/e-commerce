/** @type {import('@lhci/utils').LHCI.LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    assert: {
      budgetPath: './lighthouse-budget.json',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
