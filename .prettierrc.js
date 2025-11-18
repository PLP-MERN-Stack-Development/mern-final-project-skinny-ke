module.exports = {
  // Basic formatting options
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // JSX specific options
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Import sorting
  importOrder: [
    '^react$',
    '^react-dom$',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@/',
    '^~/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // File extensions to format
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'preserve',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};