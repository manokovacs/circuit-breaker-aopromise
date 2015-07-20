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
		return Promise.resolve([]);
	});

remoteService.getData({id: 123})
	.then(function (result) {
		// process
	})
	.catch(function (err) {
		console.log(err);
		// called if circuit is open
	});





// some remote service call
var prices;

remoteService.getPrices = aop()
	.circuitbreaker(
	{},
	function(){ return prices; } // cachedPrices will return local cache. It is still better than nothing
)
	.fn(function (params) {
		// remote call to download prices
	});

remoteService.getPrices()
	.then(function(result){
		prices = result; // caching prices
		// some other task
	});