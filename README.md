# circuit-breaker-aopromise
[Circuit-breaker](http://martinfowler.com/bliki/CircuitBreaker.html) aspect for [aopromise](https://www.npmjs.com/package/aopromise)
 aspect oriented programming toolkit to manage. It [circuit-breaker-js](https://www.npmjs.com/package/circuit-breaker-js)
 as the underlying implementation, extending with timeout and (eventually) fallback feature.
 
## Quick start
You can use the aspect simply applying it to the wrapped method. You may pass configuration options to the aspect
according to the documentation of [circuit-breaker-js](https://www.npmjs.com/package/circuit-breaker-js#api).

```javascript
var aop = require('aopromise');
aop.register('circuitbreaker', require('circuit-breaker-aopromise').Aspect);

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

```

## Fallback
If the circuit is open, circuit-breaker will fast-fail, meaning it will return a rejected promise without calling the
wrapped method. You may pass a fallback method for open circuit if applicable.

```javascript

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
    
```
