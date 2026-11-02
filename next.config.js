module.exports = {
  output: 'standalone',
  ...(process.env.INCLUDE_PARTIALS === '1'
    ? {
        outputFileTracingIncludes: {
          '/api/markdown/*': ['./content/partials/**/*.mdx'],
        },
      }
    : {}),
};
