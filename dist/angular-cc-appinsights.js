var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        var AppInsightsProvider = (function () {
            function AppInsightsProvider(_$provide, _$httpProvider) {
                this._$provide = _$provide;
                this._$httpProvider = _$httpProvider;
                this.configOptions = {};
                this.defaultOptions = {
                    autoRun: true,
                    autoTrackExceptions: true,
                    autoTrackPageViews: true,
                    addPageViewCorrelationHeader: false,
                    ajaxTelemetryInitializers: [],
                    pageViewTelemetryInitializers: ['_ccDefaultPageViewTelemetryInitializer'],
                    telemetryInitializers: []
                };
                this.$get.$inject = ['$injector'];
                this._decorateExceptionHandler.$inject = ['$delegate', '$window'];
            }
            AppInsightsProvider.prototype.$get = function ($injector) {
                return $injector.instantiate(appinsights.AppInsights, { configOptions: this.configOptions });
            };
            AppInsightsProvider.prototype.configure = function (options) {
                // todo: replace extend with a Object.assign (will require a polyfill for older browsers)
                this.configOptions = this._extend(this.configOptions, this.defaultOptions, options);
                if (this.configOptions.autoTrackExceptions) {
                    this._$provide.decorator("$exceptionHandler", this._decorateExceptionHandler);
                }
                if (this.configOptions.addPageViewCorrelationHeader) {
                    this._$httpProvider.interceptors.push('_ccAppInsightsHttpInterceptor');
                }
            };
            AppInsightsProvider.prototype._decorateExceptionHandler = function ($delegate, $window) {
                // note: using a direct reference to appInsights SDK (ie via $window) as worried about 
                // an exception being thrown by appInsights angular service itself
                return function appInsightsExceptionHandler(exception, cause) {
                    $delegate(exception, cause);
                    if ($window.appInsights) {
                        try {
                            $window.appInsights.trackException(exception);
                        }
                        catch (ex) {
                            $delegate(ex, 'Application Insights');
                        }
                    }
                };
            };
            AppInsightsProvider.prototype._extend = function (target) {
                var sources = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    sources[_i - 1] = arguments[_i];
                }
                for (var i = 0; i < sources.length; i++) {
                    var source = sources[i] || {};
                    for (var prop in source) {
                        if (source.hasOwnProperty(prop)) {
                            target[prop] = source[prop];
                        }
                    }
                }
                return target;
            };
            AppInsightsProvider.$inject = ['$provide', '$httpProvider'];
            return AppInsightsProvider;
        }());
        appinsights.AppInsightsProvider = AppInsightsProvider;
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        var AppInsights = (function () {
            function AppInsights(_$rootScope, _$location, _$window, configOptions, _$injector) {
                this._$rootScope = _$rootScope;
                this._$location = _$location;
                this._$window = _$window;
                this.configOptions = configOptions;
                this._$injector = _$injector;
                this._hasRun = false;
                this._appInsights = _$window.appInsights;
                this.service = _$window.appInsights;
            }
            AppInsights.prototype.run = function () {
                var _this = this;
                if (this._hasRun || !this._appInsights)
                    return;
                this._hasRun = true;
                // todo: consider changing pattern of making configOptions have optional members, then remove '[]'
                this._addTelemetryInitializers(this.configOptions.pageViewTelemetryInitializers || [], function (envelope) { return _this._isPageViewTelemetryItem(envelope); });
                this._addTelemetryInitializers(this.configOptions.ajaxTelemetryInitializers || [], function (envelope) { return _this._isAjaxTelemetryItem(envelope); });
                this._addTelemetryInitializers(this.configOptions.telemetryInitializers || []);
                if (this.configOptions.autoTrackPageViews) {
                    this._autoTrackPageViews();
                }
            };
            AppInsights.prototype._addTelemetryInitializers = function (initializers, condition) {
                var _this = this;
                if (!initializers)
                    return;
                initializers.forEach(function (initializer) {
                    if (typeof initializer === 'string') {
                        initializer = _this._$injector.get(initializer);
                    }
                    var ti = condition != null
                        ? _this._createConditionalTelemetryInitializer(initializer, condition)
                        : initializer;
                    _this._appInsights.context.addTelemetryInitializer(ti);
                });
            };
            AppInsights.prototype._autoTrackPageViews = function () {
                var _this = this;
                this._$rootScope.$on('$routeChangeStart', function (evt, next) {
                    _this._trackNewPage(evt, next);
                });
                this._$rootScope.$on('$routeChangeSuccess', function (evt, current) {
                    _this._recordPageView(evt, current);
                });
                this._$rootScope.$on('$routeChangeError', function (evt, route) {
                    _this._recordPageView(evt, route);
                    _this._appInsights.context.operation = _this._previousOperation;
                });
            };
            AppInsights.prototype._createConditionalTelemetryInitializer = function (initializer, condition) {
                return function (envelope) {
                    if (!condition(envelope))
                        return;
                    return initializer.apply(null, arguments);
                };
            };
            AppInsights.prototype._isPageViewTelemetryItem = function (envelope) {
                return envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType;
            };
            AppInsights.prototype._isAjaxTelemetryItem = function (envelope) {
                return envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType &&
                    envelope.data.baseData.dependencyKind === AI.DependencyKind.Http;
            };
            AppInsights.prototype._recordPageView = function (evt, route) {
                if (this._pageInProgress == null)
                    return;
                this._appInsights.stopTrackPage(this._pageInProgress.name, this._pageInProgress.url);
            };
            AppInsights.prototype._trackNewPage = function (evt, route) {
                // tried to navigate to a route that does not exist, requires url normalization, 
                // or is null as a result of an error; either way a route change shouldn't be recorded
                if (!route || route.redirectTo != null) {
                    this._pageInProgress = null;
                    return;
                }
                this._pageInProgress = { name: this._$location.path() || '/', url: this._$location.url() || '/' };
                var newOperation = new this._$window.Microsoft.ApplicationInsights.Context.Operation();
                newOperation.name = this._pageInProgress.name;
                this._previousOperation = this._appInsights.context.operation;
                this._appInsights.context.operation = newOperation;
                // start timer for page load timings
                this._appInsights.startTrackPage(this._pageInProgress.name);
            };
            AppInsights.$inject = ['$rootScope', '$location', '$window', 'configOptions', '$injector'];
            return AppInsights;
        }());
        appinsights.AppInsights = AppInsights;
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        var _AppInsightsHttpInterceptor = (function () {
            function _AppInsightsHttpInterceptor(appInsights) {
                var _this = this;
                this._impl = appInsights.service;
                if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                    this._pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
                }
                else {
                    this._pageViewIdHeaderKey = 'ai-pv-opid';
                }
                this.request = this._impl ? function (config) { return _this._addHeaders(config); } : angular.identity;
            }
            _AppInsightsHttpInterceptor.prototype._addHeaders = function (config) {
                if (config.headers && this._impl) {
                    config.headers[this._pageViewIdHeaderKey] = this._impl.context.operation.id;
                }
                return config;
            };
            _AppInsightsHttpInterceptor.$inject = ['ccAppInsights'];
            return _AppInsightsHttpInterceptor;
        }());
        appinsights._AppInsightsHttpInterceptor = _AppInsightsHttpInterceptor;
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        _defaultPageViewTelemetryInitializer.$inject = ['$route'];
        function _defaultPageViewTelemetryInitializer($route) {
            return setPageViewProperties;
            function parseControllerName(name) {
                if (typeof name !== "string") {
                    return null;
                }
                return name.split(' as')[0];
            }
            function setPageViewProperties(envelope) {
                if (!$route.current)
                    return;
                var pageView = envelope.data.baseData;
                pageView.properties = pageView.properties || {};
                pageView.properties["controller"] = parseControllerName($route.current.controller);
                pageView.properties["routePath"] = $route.current.originalPath || "/";
            }
        }
        appinsights._defaultPageViewTelemetryInitializer = _defaultPageViewTelemetryInitializer;
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        _maybeAutoRun.$inject = ['ccAppInsights'];
        function _maybeAutoRun(appInsights) {
            if (!appInsights.configOptions.autoRun)
                return;
            appInsights.run();
        }
        appinsights._maybeAutoRun = _maybeAutoRun;
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        appinsights.module = angular.module('cc-appinsights', []);
        appinsights.module
            .provider('ccAppInsights', appinsights.AppInsightsProvider)
            .service('_ccAppInsightsHttpInterceptor', appinsights._AppInsightsHttpInterceptor)
            .factory('_ccDefaultPageViewTelemetryInitializer', appinsights._defaultPageViewTelemetryInitializer)
            .run(appinsights._maybeAutoRun);
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
