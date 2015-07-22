'use strict';
var Promise = Promise || require('bluebird');

var CircuitBreaker = require('circuit-breaker-js');

module.exports = CircuitBreakerAspect;


CircuitBreakerAspect.withDefaults = function (defaultOptions) {
	return function (options, fallback, returnBreaker) {
		options = options || {};
		Object.keys(defaultOptions).forEach(function (key) {
			if (!options.hasOwnProperty(key)) {
				options[key] = defaultOptions[key];
			}
		});
		return new CircuitBreakerAspect(options, fallback, returnBreaker);
	}
};

function CircuitBreakerAspect(options, fallback, returnBreaker) {
	options = options || {};
	options.timeoutDuration = options.timeoutDuration || 3000;
	var breaker = new CircuitBreaker(options);
	if(returnBreaker){
		returnBreaker(breaker);
	}
	var isFallback = typeof(fallback) === 'function';
	this.pre = function (opts) {
		var newFunction = function () {
			var args = Array.prototype.slice.call(arguments);
			return new Promise(function (resolve, reject) {
				breaker.run(
					function (success, failure) {
						Promise.method(opts.originalFunction)
							.apply(undefined, args)
							.timeout(options.timeoutDuration)
							.then(function(res){
								success();
								resolve(res);
							})
							.catch(function(err){
								failure();
								reject(err);
							});
					},
					function(){
						if(isFallback){
							resolve(fallback.apply(undefined, args));
						}else{
							reject(new Error("Circuit breaker is open"));
						}
					}
				);

			});
		};

		return Promise.resolve({newFunction: newFunction});
	}

	this._getOptions = function () {
		return options;
	}
}




//function CircuitBreakerAspect(options, fallback) {
//	var breaker = new CircuitBreaker(function(){}, options);
//	var isFallback = typeof(fallback) === 'function';
//	this.pre = function (opts) {
//		breaker.setFunction(opts.originalFunction);
//		return Promise.resolve({newFunction: breaker.invoke.bind(breaker)});
//	}
//}
