var rest = require('restler');
var util = require('util');
var Logger = require('bunyan');
var log = new Logger({name: 'Backend requests from proxy' /*, ... */});
var MockExpressRequest = require('mock-express-request');
var MockExpressResponse = require('mock-express-response');
/**
* Convert object with keys & values to url query
* TODO: error handling & callbacks
*/
var objectToURLQuery = function(obj){
	var str = "";
	Object.keys(obj||{}).forEach(function(key) {
	    if (str != "") {
	        str += "&";
	    }
	    str += key + "=" + encodeURIComponent(obj[key]);
	});
	if(str.length > 0){
		str = "?" + str;
	}
	return str;
}

var _infoLogger = function(response,data, url){
				if(responseHasErrors(response) ){
				log.info("DEBUG (remove this logging in prod) :error: %s,  message: %s, url: %s", data.status, data.message, url);
			}
			else if(data.Error){
				log.info("DEBUG (remove this logging in prod) :error: %s,", data.Error);
			}

}

var responseHasErrors = function(response){
	return (response.statusCode == 0 || response.statusCode >299);
}

var _completeFunction = function(data, responseFromTrustedZone, responseToClient, url, next) {


	//Take care of forwarding the headers from trusted backend to the expressjs response:
	if(responseFromTrustedZone){	
		Object.keys(responseFromTrustedZone.headers).forEach(function(name) {
  		responseToClient.setHeader(name, responseFromTrustedZone.headers[name]);
		});

		_infoLogger(responseFromTrustedZone, data, url);

		responseToClient.statusCode = responseFromTrustedZone.statusCode;
	}
	if(data !== void 0 && data !== undefined){
		log.info(data);
		responseToClient.send(data);
	}else{
		log.info("NO data...");

		responseToClient.send();
	}
}


/*
* Helper for enriching the headers
*
*/
var getEnrichedHeaders = function(req){
		//Extract the requesting user from the token and attach to the headers of the new request:
	var headers = {}, enrichmentHeaders = {};
	Object.assign(headers, req.headers, enrichmentHeaders);
	return headers;
};


/*
* Proxy method for passing a "get" request from a client to the trusted zone (and the backend).
* The backend response is returned to the client.
*/
var getFromTrustedZone = function(url,req,res){
	//The full url should be fixed to url + req query
	var fullUrl = url + objectToURLQuery(req.query);
	var headers = getEnrichedHeaders(req);


	rest.get(fullUrl, {headers: headers, disable_decoding: true}).on('complete', function(data, response){_completeFunction(data,response,res,url);});
}

// START POINT: //
var req = new MockExpressRequest();
var res = new MockExpressResponse();


getFromTrustedZone("http://localhost:6969/json",req, res);



