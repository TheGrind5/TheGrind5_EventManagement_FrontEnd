module.exports = function override(config, env) {
  // Ensure webpack can resolve .mjs files and handle package.json exports
  config.resolve = {
    ...config.resolve,
    extensions: [...(config.resolve.extensions || []), '.mjs', '.mjsx'],
    mainFields: ['browser', 'module', 'main'],
  };

  // Ensure .mjs files are processed correctly
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  return config;
};
