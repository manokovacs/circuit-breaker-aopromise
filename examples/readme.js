'use strict';
var Promise = Promise || require('bluebird')

var aop = require('aopromise');
aop.register('circuitbreaker', require('../lib/circuit-breaker-aopromise').Aspect);

// some remote service call
var remoteService = {};
remoteService.getData = aop()
	.circuitbreaker({
		timeoutDuration: 3000,
		errorThreshold: 25, // it opens the circuit if 25% of the requests fail in the last bucket
		volumeThreshold: 5 // error threshold will only apply if the requests count reaches this in a bucket
	}) // you may specify options
	.fn(function (params) {
		// some remote call to other webservice or DB
		console.log('x');
		return Promise.resolve([]);
	});

remoteService.getData({id: 123})
	.then(function (result) {
		console.log('x2');
		// process
	})
	.catch(function (err) {
		console.log(err);
		// called if circuit is open
	});