var request				= require('request');
var async         = require('async');


var SteamAppInfoBuilder = function (appId) {
	var STORE_URL = "http://store.steampowered.com/api/appdetails";
	var PC_GAMING_WIKI_URL = "http://pcgamingwiki.com/w/api.php";
	
	var appInfo = {
		name: null,
		type: null,
		appUrl : null,
		metacritic: null, //{score, url}
		platforms: null, //{windows, mac, linux} boolean
		cards: null,
		pcgwUrl: null,
		prices: {
		}
	};
	
	var parseResponse = function (response) {
		var responseAsJson = JSON.parse(response);
		if (!responseAsJson[appId].success)
			return null;
		
		return responseAsJson[appId].data;
	};
	
	var buildRequests = function () {
		var regions = ['eur', 'us', 'ru', 'ca', 'uk', 'br', 'au'];
		var requests = [];
		
		regions.forEach(function(regionCode) {
			requests.push({
				requestOptions:{
					url: STORE_URL,
					qs: {
						appids: appId,
						cc: regionCode
					}
				},
				callback: function (body, requestConfig) {
					var parsed = parseResponse(body);
					if (parsed){
						appInfo.name = parsed.name;
						appInfo.type = parsed.type;
						appInfo.prices[requestConfig.requestOptions.qs.cc] = parsed.price_overview;
						appInfo.metacritic = parsed.metacritic;
						appInfo.platforms = parsed.platforms;
						appInfo.appUrl = 'http://store.steampowered.com/app/' + parsed.steam_appid;
						
						appInfo.cards = false;
						for (var i = 0; i < parsed.categories.length; i++) {
							if (parsed.categories[i].id == 29)
								appInfo.cards = true;
						}
					}
				}
			});
		}, this);
		
		requests.push({
			requestOptions: {
				url: PC_GAMING_WIKI_URL,
				qs: {
					"conditions": 'Steam AppID::' + appId,
					"action": 'askargs',
					"format": 'json'
				}
			},
			callback: function (body, requestConfig) {
				var data = JSON.parse(body);
				if (data.query.results.length !== 0){
					var name = data.query.results[Object.keys(data.query.results)[0]].fulltext;
					appInfo.pcgwUrl = data.query.results[name].fullurl;
				}
			}
		});
		
		return requests;
	};
	
	var requestData = function (requestConfig, callback) {
		request(requestConfig.requestOptions, function (err, response, body) {
			requestConfig.callback(body, requestConfig);
			callback();
		});
	};
	
	var buildCallback = function (appInfo, callback) {
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