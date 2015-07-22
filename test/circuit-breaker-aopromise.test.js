'use strict';

var CircuitBreakerAspect = require('../lib/circuit-breaker-aopromise').Aspect;
var Promise = Promise || require('bluebird');
var sinon = require('sinon');
var should = require('should');
var aop = require('aopromise');

describe('circuit-breaker-aopromise', function () {

	before(function () {
		aop.register('circuitbreaker', CircuitBreakerAspect);
	});
	after(function () {
		aop.unregister('circuitbreaker');
	});

	it('should behave transparently', function (end) {
		aop()
			.circuitbreaker()
			.fn(function (arg1) {
				return Promise.resolve('pass');
			})()
			.then(function (res) {
				res.should.equal('pass');
				end();
			})
			.catch(function (errs) {
				end(errs);
			});
	});

	it('should invoke open event', function (end) {
		var open = false;
		var func = aop()
			.circuitbreaker({
				onCircuitOpen: function (m) {
//					console.log(m);
					open = true;
				},
				errorThreshold: 50,
				volumeThreshold: 3
			})
			.fn(function (pass) {
				return pass ? Promise.resolve() : Promise.reject();
			});
		func(false)
			.finally(function () {
				return func(true);
			})
			.finally(function () {
				return func(false);
			})
			.finally(function () {
				return func(false);
			})
			.finally(function () {
				try {
					open.should.be.true();
					end();
				} catch (e) {
					end(e);
				}
			}).catch(function () {
			})

	});

	it('should timeout', function (end) {
//		var clock = sinon.useFakeTimers();
		aop()
			.circuitbreaker({
				'timeoutDuration': 10
			})
			.fn(function (arg1) {
				return Promise.delay(2000);
			})()
			.then(function (res) {
				end(new Error('should have timeouted'));
			})
			.catch(function (errs) {
				end();
			})
//			.finally(clock.restore);
//		clock.tick(10);
//		clock.tick(10);
//		clock.tick(10);
//		clock.tick(20000);
	});

	it('should call fallback if cb is open', function (end) {
		var fn = aop()
			.circuitbreaker({
				timeoutDuration: 3000,
				errorThreshold: 50,
				volumeThreshold: 5
			}, function () {
				return 'fallback result';
			})
			.fn(function (params) {
				return Promise.reject();
			});

		Promise.all([
			fn(),
			fn(),
			fn(),
			fn(),
			fn(),
			fn()
		])
			.catch(function () {
			})
			.delay(5)
			.then(fn)
			.then(function (res) {
				res.should.equal('fallback result');
				end();
			})
			.catch(end);
	});

	it('should have different defaults if used with withDefaults', function () {
		var opts = (new (CircuitBreakerAspect.withDefaults({
			timeoutDuration: 3123,
			errorThreshold: 123,
			volumeThreshold: 456
		})))._getOptions();
		opts.timeoutDuration.should.equal(3123);
		opts.errorThreshold.should.equal(123);
		opts.volumeThreshold.should.equal(456);
	});


});
