var request				= require('request');
var async         = require('async');


var SteamAppInfoBuilder = function (appId) {
	var STORE_URL = "http://store.steampowered.com/api/appdetails";
	var appInfo = {
		name: null,
		type: null,
		prices: {
		}
	};
	
	var parseResponse = function (response) {
		var responseAsJson = JSON.parse(response);
		if (!responseAsJson[appId].success)
			return false;
		
		var appInfo = {
			name: responseAsJson[appId].data['name'],
			type: responseAsJson[appId].data['type'],
			price: responseAsJson[appId].data['price_overview']
		};
		return appInfo;
	};
	
	var buildRequests = function () {
		var regions = ['eur', 'us', 'ru'];
		var requests = [];
		regions.forEach(function(regionCode) {
			requests.push(
				{
					url: STORE_URL,
					qs: {
						appids: appId,
						cc: regionCode
					}	
				}
			);
		}, this);
		return requests;
	};
	
	var requestData = function (requestOptions, callback) {
		console.log(requestOptions);
		request(requestOptions, function (err, response, body) {
			var parsed = parseResponse(body);
			if (parsed){
				appInfo.name = parsed.name;
				appInfo.type = parsed.type;
				appInfo.prices[requestOptions.qs.cc] = parsed.price;
			}
			callback();
		});
	};
	
	var buildCallback = function (appInfo, callback) {
		console.log(appInfo);
		if (callback)
			callback(appInfo);
	};
	
	return{
		getInfo: function (callback) {
			
			var requests = buildRequests();
			var q = async.queue(requestData, 5);
	    q.drain = function() {
	      buildCallback(appInfo, callback);
	    };
	    q.push(requests);
		}
	};
};
module.exports = SteamAppInfoBuilder;