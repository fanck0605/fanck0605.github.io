function readPackage(package, context) {
    if (package.name === 'hexo-renderer-stylus') {
        package.dependencies = {
            ...package.dependencies,
            stylus: '0.54.5'
        }
        context.log('stylus@^0.54.8 => stylus@0.54.5 in dependencies of hexo-renderer-stylus@v2.0.0')
    }

    return package
}

module.exports = {
    hooks: {
        readPackage
    }
}
