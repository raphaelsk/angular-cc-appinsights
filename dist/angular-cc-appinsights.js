var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        angular.module('cc-appinsights', []);
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        var AppInsightsProvider = (function () {
            function AppInsightsProvider($provide, $httpProvider) {
                this.$provide = $provide;
                this.$httpProvider = $httpProvider;
                this.configOptions = {};
                this.defaultOptions = {
                    autoRun: true,
                    autoTrackExceptions: true,
                    autoTrackPageViews: true,
                    addPageViewCorrelationHeader: false,
                    ajaxTelemetryInitializers: [],
                    pageViewTelemetryInitializers: ['ccDefaultPageViewTelemetryInitializer'],
                    telemetryInitializers: []
                };
                this.$get.$inject = ['$injector'];
                this.decorateExceptionHandler.$inject = ['$delegate', '$window'];
            }
            AppInsightsProvider.prototype.$get = function ($injector) {
                return $injector.instantiate(appinsights.AppInsights, { configOptions: this.configOptions });
            };
            AppInsightsProvider.prototype.configure = function (options) {
                // todo: replace extend with a Object.assign (will require a polyfill for older browsers)
                this.configOptions = this.extend(this.configOptions, this.defaultOptions, options);
                if (this.configOptions.autoTrackExceptions) {
                    this.$provide.decorator("$exceptionHandler", this.decorateExceptionHandler);
                }
                if (this.configOptions.addPageViewCorrelationHeader) {
                    this.$httpProvider.interceptors.push('ccAppInsightsHttpInterceptor');
                }
            };
            AppInsightsProvider.prototype.decorateExceptionHandler = function ($delegate, $window) {
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
            AppInsightsProvider.prototype.extend = function (target) {
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
        angular.module('cc-appinsights')
            .provider('ccAppInsights', AppInsightsProvider);
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        var AppInsights = (function () {
            function AppInsights($rootScope, $location, $window, configOptions, $injector) {
                this.$rootScope = $rootScope;
                this.$location = $location;
                this.$window = $window;
                this.configOptions = configOptions;
                this.$injector = $injector;
                this.hasRun = false;
                this.appInsights = $window.appInsights;
                this.service = $window.appInsights;
            }
            AppInsights.prototype.run = function () {
                var _this = this;
                if (this.hasRun || !this.appInsights)
                    return;
                this.hasRun = true;
                // todo: consider changing pattern of making configOptions have optional members, then remove '[]'
                this.addTelemetryInitializers(this.configOptions.pageViewTelemetryInitializers || [], function (envelope) { return _this.isPageViewTelemetryItem(envelope); });
                this.addTelemetryInitializers(this.configOptions.ajaxTelemetryInitializers || [], function (envelope) { return _this.isAjaxTelemetryItem(envelope); });
                this.addTelemetryInitializers(this.configOptions.telemetryInitializers || []);
                if (this.configOptions.autoTrackPageViews) {
                    this.autoTrackPageViews();
                }
            };
            AppInsights.prototype.addTelemetryInitializers = function (initializers, condition) {
                var _this = this;
                if (!initializers)
                    return;
                initializers.forEach(function (initializer) {
                    if (typeof initializer === 'string') {
                        initializer = _this.$injector.get(initializer);
                    }
                    var ti = condition != null
                        ? _this.createConditionalTelemetryInitializer(initializer, condition)
                        : initializer;
                    _this.appInsights.context.addTelemetryInitializer(ti);
                });
            };
            AppInsights.prototype.autoTrackPageViews = function () {
                var _this = this;
                this.$rootScope.$on('$routeChangeStart', function (evt, next) {
                    _this.trackNewPage(evt, next);
                });
                this.$rootScope.$on('$routeChangeSuccess', function (evt, current) {
                    _this.recordPageView(evt, current);
                });
                this.$rootScope.$on('$routeChangeError', function (evt, route) {
                    _this.recordPageView(evt, route);
                    _this.appInsights.context.operation = _this.previousOperation;
                });
            };
            AppInsights.prototype.createConditionalTelemetryInitializer = function (initializer, condition) {
                return function (envelope) {
                    if (!condition(envelope))
                        return;
                    return initializer.apply(null, arguments);
                };
            };
            AppInsights.prototype.isPageViewTelemetryItem = function (envelope) {
                return envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType;
            };
            AppInsights.prototype.isAjaxTelemetryItem = function (envelope) {
                return envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType &&
                    envelope.data.baseData.dependencyKind === AI.DependencyKind.Http;
            };
            AppInsights.prototype.recordPageView = function (evt, route) {
                if (this.pageInProgress == null)
                    return;
                this.appInsights.stopTrackPage(this.pageInProgress.name, this.pageInProgress.url);
            };
            AppInsights.prototype.trackNewPage = function (evt, route) {
                // tried to navigate to a route that does not exist, requires url normalization, 
                // or is null as a result of an error; either way a route change shouldn't be recorded
                if (!route || route.redirectTo != null) {
                    this.pageInProgress = null;
                    return;
                }
                this.pageInProgress = { name: this.$location.path() || '/', url: this.$location.url() || '/' };
                var newOperation = new this.$window.Microsoft.ApplicationInsights.Context.Operation();
                newOperation.name = this.pageInProgress.name;
                this.previousOperation = this.appInsights.context.operation;
                this.appInsights.context.operation = newOperation;
                // start timer for page load timings
                this.appInsights.startTrackPage(this.pageInProgress.name);
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
        var AppInsightsHttpInterceptor = (function () {
            function AppInsightsHttpInterceptor(appInsights) {
                var _this = this;
                this.impl = appInsights.service;
                if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                    this.pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
                }
                else {
                    this.pageViewIdHeaderKey = 'ai-pv-opid';
                }
                this.request = this.impl ? function (config) { return _this.addHeaders(config); } : angular.identity;
            }
            AppInsightsHttpInterceptor.prototype.addHeaders = function (config) {
                if (config.headers && this.impl) {
                    config.headers[this.pageViewIdHeaderKey] = this.impl.context.operation.id;
                }
                return config;
            };
            AppInsightsHttpInterceptor.$inject = ['ccAppInsights'];
            return AppInsightsHttpInterceptor;
        }());
        angular.module('cc-appinsights')
            .service('ccAppInsightsHttpInterceptor', AppInsightsHttpInterceptor);
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        angular.module('cc-appinsights')
            .factory('ccDefaultPageViewTelemetryInitializer', defaultPageViewTelemetryInitializer);
        defaultPageViewTelemetryInitializer.$inject = ['$route'];
        function defaultPageViewTelemetryInitializer($route) {
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
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
var cc;
(function (cc) {
    var appinsights;
    (function (appinsights) {
        'use strict';
        angular.module('cc-appinsights')
            .run(maybeAutoRun);
        maybeAutoRun.$inject = ['ccAppInsights'];
        function maybeAutoRun(appInsights) {
            if (!appInsights.configOptions.autoRun)
                return;
            appInsights.run();
        }
    })(appinsights = cc.appinsights || (cc.appinsights = {}));
})(cc || (cc = {}));
