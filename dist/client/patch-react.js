'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getOwnPropertyDescriptor = require('babel-runtime/core-js/object/get-own-property-descriptor');

var _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getOwnPropertyDescriptors = require('babel-runtime/core-js/object/get-own-property-descriptors');

var _getOwnPropertyDescriptors2 = _interopRequireDefault(_getOwnPropertyDescriptors);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var patched = false; // monkeypatch React for fixing https://github.com/facebook/react/issues/2461
// based on https://gist.github.com/Aldredcz/4d63b0a9049b00f54439f8780be7f0d8

exports.default = function () {
  var handleError = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

  if (patched) {
    throw new Error('React is already monkeypatched');
  }

  patched = true;

  var createElement = _react2.default.createElement;


  _react2.default.createElement = function (Component) {
    if (typeof Component === 'function') {
      // We need to get the prototype which has the render method.
      // It's possible to have render inside a deeper prototype due to
      // class extending.
      var prototypeWithRender = getRenderPrototype(Component);
      var _Component = Component,
          prototype = _Component.prototype;

      // assumes it's a class component if render method exists.

      var isClassComponent = Boolean(prototypeWithRender) ||
      // subclass of React.Component or PureComponent with no render method.
      // There's no render method in prototype
      // when it's created with class-properties.
      prototype instanceof _react2.default.Component || prototype instanceof _react2.default.PureComponent;

      var dynamicWrapper = withWrapOwnRender;

      if (isClassComponent) {
        if (prototypeWithRender) {
          // Sometimes render method is created with only a getter.
          // In that case we can't override it with a prototype. We need to
          // do it dynamically.
          if (canOverrideRender(prototypeWithRender)) {
            prototypeWithRender.render = wrapRender(prototypeWithRender.render);
          } else {
            dynamicWrapper = withWrapRenderAlways;
          }
        }

        // wrap the render method in runtime when the component initialized
        // for class-properties.
        Component = wrap(Component, dynamicWrapper);
      } else {
        // stateless component
        Component = wrapRender(Component);
      }
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return createElement.call.apply(createElement, [this, Component].concat(rest));
  };

  var componentPrototype = _react2.default.Component.prototype;
  var forceUpdate = componentPrototype.forceUpdate;


  componentPrototype.forceUpdate = function () {
    if (this.render) {
      this.render = wrapRender(this.render);
    }

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return forceUpdate.apply(this, args);
  };

  function wrapRender(render) {
    return wrap(render, withHandleError);
  }

  function withHandleError(fn) {
    try {
      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      return fn.apply(this, args);
    } catch (err) {
      handleError(err);
      return null;
    }
  }

  function withWrapOwnRender(fn) {
    for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }

    var result = fn.apply(this, args);
    if (this.render && this.hasOwnProperty('render')) {
      this.render = wrapRender(this.render);
    }
    return result;
  }

  function withWrapRenderAlways(fn) {
    for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }

    var result = fn.apply(this, args);
    if (this.render) {
      Object.defineProperty(this, 'render', { writable: true, value: wrapRender(this.render) });
    }
    return result;
  }
};

function wrap(fn, around) {
  if (fn.__wrapped) {
    return fn.__wrapped;
  }

  var _fn = function _fn() {
    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    return around.call.apply(around, [this, fn].concat(args));
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)((0, _entries2.default)((0, _getOwnPropertyDescriptors2.default)(fn))), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = (0, _slicedToArray3.default)(_step.value, 2),
          k = _step$value[0],
          d = _step$value[1];

      try {
        (0, _defineProperty2.default)(_fn, k, d);
      } catch (e) {}
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  _fn.__wrapped = fn.__wrapped = _fn;

  return _fn;
}

function getRenderPrototype(Component) {
  var proto = Component.prototype;

  while (true) {
    if (proto.hasOwnProperty('render')) return proto;
    proto = (0, _getPrototypeOf2.default)(proto);
    if (!proto) return null;
  }
}

function canOverrideRender(prototype) {
  var descriptor = (0, _getOwnPropertyDescriptor2.default)(prototype, 'render');
  if (!descriptor) return true;

  return descriptor.writable;
}