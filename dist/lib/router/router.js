'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _url = require('url');

var _events = require('events');

var _evalScript = require('../eval-script');

var _evalScript2 = _interopRequireDefault(_evalScript);

var _shallowEquals = require('../shallow-equals');

var _shallowEquals2 = _interopRequireDefault(_shallowEquals);

var _pQueue = require('../p-queue');

var _pQueue2 = _interopRequireDefault(_pQueue);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Add "fetch" polyfill for older browsers
/* global fetch */

if (typeof window !== 'undefined') {
  require('whatwg-fetch');
}

var Router = function (_EventEmitter) {
  (0, _inherits3.default)(Router, _EventEmitter);

  function Router(pathname, query) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        Component = _ref.Component,
        ErrorComponent = _ref.ErrorComponent,
        err = _ref.err;

    (0, _classCallCheck3.default)(this, Router);

    // represents the current component key
    var _this = (0, _possibleConstructorReturn3.default)(this, (Router.__proto__ || (0, _getPrototypeOf2.default)(Router)).call(this));

    _this.route = toRoute(pathname);

    // set up the component cache (by route keys)
    _this.components = (0, _defineProperty3.default)({}, _this.route, { Component: Component, err: err });

    // contain a map of promise of fetch routes
    _this.fetchingRoutes = {};

    _this.prefetchQueue = new _pQueue2.default({ concurrency: 2 });
    _this.ErrorComponent = ErrorComponent;
    _this.pathname = pathname;
    _this.query = query;
    _this.subscriptions = new _set2.default();
    _this.componentLoadCancel = null;
    _this.onPopState = _this.onPopState.bind(_this);

    if (typeof window !== 'undefined') {
      // in order for `e.state` to work on the `onpopstate` event
      // we have to register the initial route upon initialization
      _this.changeState('replaceState', (0, _url.format)({ pathname: pathname, query: query }), getURL());

      window.addEventListener('popstate', _this.onPopState);
    }
    return _this;
  }

  (0, _createClass3.default)(Router, [{
    key: 'onPopState',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(e) {
        var _pathname, _query, _e$state, url, as, _parse, pathname, query, route, _ref3, data, props, error;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (e.state) {
                  _context.next = 4;
                  break;
                }

                // We get state as undefined for two reasons.
                //  1. With older safari (< 8) and older chrome (< 34)
                //  2. When the URL changed with #
                //
                // In the both cases, we don't need to proceed and change the route.
                // (as it's already changed)
                // But we can simply replace the state with the new changes.
                // Actually, for (1) we don't need to nothing. But it's hard to detect that event.
                // So, doing the following for (1) does no harm.
                _pathname = this.pathname, _query = this.query;

                this.replace((0, _url.format)({ pathname: _pathname, query: _query }), getURL());
                return _context.abrupt('return');

              case 4:

                this.abortComponentLoad();

                _e$state = e.state, url = _e$state.url, as = _e$state.as;
                _parse = (0, _url.parse)(url, true), pathname = _parse.pathname, query = _parse.query;

                if (this.urlIsNew(pathname, query)) {
                  _context.next = 11;
                  break;
                }

                this.emit('routeChangeStart', as);
                this.emit('routeChangeComplete', as);
                return _context.abrupt('return');

              case 11:
                route = toRoute(pathname);


                this.emit('routeChangeStart', as);
                _context.next = 15;
                return this.getRouteInfo(route, pathname, query);

              case 15:
                _ref3 = _context.sent;
                data = _ref3.data;
                props = _ref3.props;
                error = _ref3.error;

                if (!(error && error.cancelled)) {
                  _context.next = 22;
                  break;
                }

                this.emit('routeChangeError', error, as);
                return _context.abrupt('return');

              case 22:

                this.route = route;
                this.set(pathname, query, (0, _extends3.default)({}, data, { props: props }));

                if (error) {
                  this.emit('routeChangeError', error, as);
                } else {
                  this.emit('routeChangeComplete', as);
                }

              case 25:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onPopState(_x2) {
        return _ref2.apply(this, arguments);
      }

      return onPopState;
    }()
  }, {
    key: 'update',
    value: function update(route, Component) {
      var data = this.components[route] || {};
      var newData = (0, _extends3.default)({}, data, { Component: Component });
      this.components[route] = newData;

      if (route === this.route) {
        this.notify(newData);
      }
    }
  }, {
    key: 'reload',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(route) {
        var url, _parse2, pathname, query, _ref5, data, props, error;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                delete this.components[route];
                delete this.fetchingRoutes[route];

                if (!(route !== this.route)) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt('return');

              case 4:
                url = window.location.href;
                _parse2 = (0, _url.parse)(url, true), pathname = _parse2.pathname, query = _parse2.query;


                this.emit('routeChangeStart', url);
                _context2.next = 9;
                return this.getRouteInfo(route, pathname, query);

              case 9:
                _ref5 = _context2.sent;
                data = _ref5.data;
                props = _ref5.props;
                error = _ref5.error;

                if (!(error && error.cancelled)) {
                  _context2.next = 16;
                  break;
                }

                this.emit('routeChangeError', error, url);
                return _context2.abrupt('return');

              case 16:

                this.notify((0, _extends3.default)({}, data, { props: props }));

                if (!error) {
                  _context2.next = 20;
                  break;
                }

                this.emit('routeChangeError', error, url);
                throw error;

              case 20:

                this.emit('routeChangeComplete', url);

              case 21:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function reload(_x3) {
        return _ref4.apply(this, arguments);
      }

      return reload;
    }()
  }, {
    key: 'back',
    value: function back() {
      window.history.back();
    }
  }, {
    key: 'push',
    value: function push(url) {
      var as = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : url;

      return this.change('pushState', url, as);
    }
  }, {
    key: 'replace',
    value: function replace(url) {
      var as = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : url;

      return this.change('replaceState', url, as);
    }
  }, {
    key: 'change',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(method, url, as) {
        var _parse3, pathname, query, route, _ref7, data, props, error;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.abortComponentLoad();
                _parse3 = (0, _url.parse)(url, true), pathname = _parse3.pathname, query = _parse3.query;

                // If asked to change the current URL we should reload the current page
                // (not location.reload() but reload getInitalProps and other Next.js stuffs)
                // We also need to set the method = replaceState always
                // as this should not go into the history (That's how browsers work)

                if (!this.urlIsNew(pathname, query)) {
                  method = 'replaceState';
                }

                route = toRoute(pathname);


                this.emit('routeChangeStart', as);
                _context3.next = 7;
                return this.getRouteInfo(route, pathname, query);

              case 7:
                _ref7 = _context3.sent;
                data = _ref7.data;
                props = _ref7.props;
                error = _ref7.error;

                if (!(error && error.cancelled)) {
                  _context3.next = 14;
                  break;
                }

                this.emit('routeChangeError', error, as);
                return _context3.abrupt('return', false);

              case 14:

                this.changeState(method, url, as);

                this.route = route;
                this.set(pathname, query, (0, _extends3.default)({}, data, { props: props }));

                if (!error) {
                  _context3.next = 20;
                  break;
                }

                this.emit('routeChangeError', error, as);
                throw error;

              case 20:

                this.emit('routeChangeComplete', as);
                return _context3.abrupt('return', true);

              case 22:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function change(_x6, _x7, _x8) {
        return _ref6.apply(this, arguments);
      }

      return change;
    }()
  }, {
    key: 'changeState',
    value: function changeState(method, url, as) {
      if (method !== 'pushState' || getURL() !== as) {
        window.history[method]({ url: url, as: as }, null, as);
      }
    }
  }, {
    key: 'getRouteInfo',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(route, pathname, query) {
        var routeInfo, _routeInfo$data, Component, err, jsonPageRes, ctx, _Component, _ctx;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                routeInfo = {};
                _context4.prev = 1;
                _context4.next = 4;
                return this.fetchComponent(route);

              case 4:
                _routeInfo$data = routeInfo.data = _context4.sent;
                Component = _routeInfo$data.Component;
                err = _routeInfo$data.err;
                jsonPageRes = _routeInfo$data.jsonPageRes;
                ctx = { err: err, pathname: pathname, query: query, jsonPageRes: jsonPageRes };
                _context4.next = 11;
                return this.getInitialProps(Component, ctx);

              case 11:
                routeInfo.props = _context4.sent;
                _context4.next = 26;
                break;

              case 14:
                _context4.prev = 14;
                _context4.t0 = _context4['catch'](1);

                if (!_context4.t0.cancelled) {
                  _context4.next = 18;
                  break;
                }

                return _context4.abrupt('return', { error: _context4.t0 });

              case 18:
                _Component = this.ErrorComponent;

                routeInfo.data = { Component: _Component, err: _context4.t0 };
                _ctx = { err: _context4.t0, pathname: pathname, query: query };
                _context4.next = 23;
                return this.getInitialProps(_Component, _ctx);

              case 23:
                routeInfo.props = _context4.sent;


                routeInfo.error = _context4.t0;
                console.error(_context4.t0);

              case 26:
                return _context4.abrupt('return', routeInfo);

              case 27:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[1, 14]]);
      }));

      function getRouteInfo(_x9, _x10, _x11) {
        return _ref8.apply(this, arguments);
      }

      return getRouteInfo;
    }()
  }, {
    key: 'set',
    value: function set(pathname, query, data) {
      this.pathname = pathname;
      this.query = query;
      this.notify(data);
    }
  }, {
    key: 'urlIsNew',
    value: function urlIsNew(pathname, query) {
      return this.pathname !== pathname || !(0, _shallowEquals2.default)(query, this.query);
    }
  }, {
    key: 'prefetch',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(url) {
        var _this2 = this;

        var _parse4, pathname, route;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _parse4 = (0, _url.parse)(url), pathname = _parse4.pathname;
                route = toRoute(pathname);
                return _context5.abrupt('return', this.prefetchQueue.add(function () {
                  return _this2.fetchRoute(route);
                }));

              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function prefetch(_x12) {
        return _ref9.apply(this, arguments);
      }

      return prefetch;
    }()
  }, {
    key: 'fetchComponent',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(route) {
        var data, cancelled, cancel, jsonPageRes, jsonData, newData, error;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                data = this.components[route];

                if (!data) {
                  _context6.next = 3;
                  break;
                }

                return _context6.abrupt('return', data);

              case 3:
                cancelled = false;

                cancel = this.componentLoadCancel = function () {
                  cancelled = true;
                };

                _context6.next = 7;
                return this.fetchRoute(route);

              case 7:
                jsonPageRes = _context6.sent;
                _context6.next = 10;
                return jsonPageRes.json();

              case 10:
                jsonData = _context6.sent;
                newData = (0, _extends3.default)({}, loadComponent(jsonData), {
                  jsonPageRes: jsonPageRes
                });

                if (!cancelled) {
                  _context6.next = 16;
                  break;
                }

                error = new Error('Abort fetching component for route: "' + route + '"');

                error.cancelled = true;
                throw error;

              case 16:

                if (cancel === this.componentLoadCancel) {
                  this.componentLoadCancel = null;
                }

                this.components[route] = newData;
                return _context6.abrupt('return', newData);

              case 19:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function fetchComponent(_x13) {
        return _ref10.apply(this, arguments);
      }

      return fetchComponent;
    }()
  }, {
    key: 'getInitialProps',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(Component, ctx) {
        var cancelled, cancel, props, err;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                cancelled = false;

                cancel = function cancel() {
                  cancelled = true;
                };

                this.componentLoadCancel = cancel;

                _context7.next = 5;
                return (0, _utils.loadGetInitialProps)(Component, ctx);

              case 5:
                props = _context7.sent;


                if (cancel === this.componentLoadCancel) {
                  this.componentLoadCancel = null;
                }

                if (!cancelled) {
                  _context7.next = 11;
                  break;
                }

                err = new Error('Loading initial props cancelled');

                err.cancelled = true;
                throw err;

              case 11:
                return _context7.abrupt('return', props);

              case 12:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getInitialProps(_x14, _x15) {
        return _ref11.apply(this, arguments);
      }

      return getInitialProps;
    }()
  }, {
    key: 'fetchRoute',
    value: function fetchRoute(route) {
      var promise = this.fetchingRoutes[route];
      if (!promise) {
        promise = this.fetchingRoutes[route] = this.doFetchRoute(route);
      }
      return promise;
    }
  }, {
    key: 'doFetchRoute',
    value: function doFetchRoute(route) {
      var buildId = window.__NEXT_DATA__.buildId;

      var url = '/_next/' + encodeURIComponent(buildId) + '/pages' + route;
      return fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
    }
  }, {
    key: 'abortComponentLoad',
    value: function abortComponentLoad() {
      if (this.componentLoadCancel) {
        this.componentLoadCancel();
        this.componentLoadCancel = null;
      }
    }
  }, {
    key: 'notify',
    value: function notify(data) {
      this.subscriptions.forEach(function (fn) {
        return fn(data);
      });
    }
  }, {
    key: 'subscribe',
    value: function subscribe(fn) {
      var _this3 = this;

      this.subscriptions.add(fn);
      return function () {
        return _this3.subscriptions.delete(fn);
      };
    }
  }]);
  return Router;
}(_events.EventEmitter);

exports.default = Router;


function getURL() {
  var href = window.location.href;

  var origin = (0, _utils.getLocationOrigin)();
  return href.substring(origin.length);
}

function toRoute(path) {
  return path.replace(/\/$/, '') || '/';
}

function loadComponent(jsonData) {
  var module = (0, _evalScript2.default)(jsonData.component);
  var Component = module.default || module;

  return { Component: Component, err: jsonData.err };
}