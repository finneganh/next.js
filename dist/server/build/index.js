'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var writeBuildId = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(dir) {
    var buildIdPath, buildId;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            buildIdPath = (0, _path.join)(dir, '.next', 'BUILD_ID');
            buildId = _uuid2.default.v4();
            _context2.next = 4;
            return _fs2.default.writeFile(buildIdPath, buildId, 'utf8');

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function writeBuildId(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var _os = require('os');

var _path = require('path');

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _webpack = require('./webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _replace = require('./replace');

var _replace2 = _interopRequireDefault(_replace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(dir) {
    var buildDir, compiler;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            buildDir = (0, _path.join)((0, _os.tmpdir)(), _uuid2.default.v4());
            _context.next = 3;
            return (0, _webpack2.default)(dir, { buildDir: buildDir });

          case 3:
            compiler = _context.sent;
            _context.prev = 4;
            _context.next = 7;
            return runCompiler(compiler);

          case 7:
            _context.next = 9;
            return writeBuildId(buildDir);

          case 9:
            _context.next = 15;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](4);

            console.error('> Failed to build on ' + buildDir);
            throw _context.t0;

          case 15:
            _context.next = 17;
            return (0, _replace2.default)(dir, buildDir);

          case 17:

            // no need to wait
            (0, _del2.default)(buildDir, { force: true });

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 11]]);
  }));

  function build(_x) {
    return _ref.apply(this, arguments);
  }

  return build;
}();

function runCompiler(compiler) {
  return new _promise2.default(function (resolve, reject) {
    compiler.run(function (err, stats) {
      if (err) return reject(err);

      var jsonStats = stats.toJson();
      if (jsonStats.errors.length > 0) {
        var error = new Error(jsonStats.errors[0]);
        error.errors = jsonStats.errors;
        error.warnings = jsonStats.warnings;
        return reject(error);
      }

      resolve();
    });
  });
}