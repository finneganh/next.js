'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Next.js needs to use module.resolve to generate paths to modules it includes,
// but those paths need to be relative to something so that they're portable
// across directories and machines.
//
// This function returns paths relative to the top-level 'node_modules'
// directory found in the path. If none is found, returns the complete path.

var RELATIVE_START = 'node_modules/';

// Pass in the module's `require` object since it's module-specific.

exports.default = function (moduleRequire) {
  return function (path) {
    var absolutePath = moduleRequire.resolve(path).replace(/[\\/]package\.json$/, '');

    var relativeStartIndex = absolutePath.indexOf(RELATIVE_START);

    if (relativeStartIndex === -1) {
      return absolutePath;
    }

    return absolutePath.substring(relativeStartIndex + RELATIVE_START.length);
  };
};