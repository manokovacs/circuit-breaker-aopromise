'use strict';
var Promise = Promise || require('bluebird')

var rp = require('request-promise');

var aop = require('aopromise');
aop.register('circuitbreaker', require('../lib/circuit-breaker-aopromise').Aspect);

// some remote service call
var remoteService = {};
remoteService.getData = aop()
	.circuitbreaker({
		timeoutDuration: 3000,
		errorThreshold: 50,
		volumeThreshold: 5,
		onCircuitOpen: function(){
			console.log('circuit open')
		}
	}, function(){
		console.log('fallback function');
		return 'fallback result';
	})
	.fn(function (params) {
		// some remote call to other webservice or DB
		return rp('http://notevenregisteredcomain.xx');
	});

Promise.all([
	remoteService.getData(),
	remoteService.getData(),
	remoteService.getData(),
	remoteService.getData(),
	remoteService.getData(),
	remoteService.getData()
])
	.catch(function(){
		console.log('catch branch');
		return true;
	}).delay(10)
	.then(remoteService.getData)
	.then(function(res){
		console.log(res);
	});