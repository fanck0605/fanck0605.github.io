function readPackage(pkg, context) {
  if (pkg.name === 'hexo-renderer-stylus') {
    pkg.dependencies = {
      ...pkg.dependencies,
      stylus: '0.54.5',
    };
    context.log(
      'stylus@^0.54.8 => stylus@0.54.5 in dependencies of hexo-renderer-stylus@^2.0.0'
    );
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
