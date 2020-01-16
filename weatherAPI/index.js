

const GeodbFreeApi = require('./geodbFree');
const OpenWeatherApi = require('./openWeather');
const MapQuestApi = require('./mapquest');

module.exports = {
	'geodb': new GeodbFreeApi(),
	'openweathermap': new OpenWeatherApi(),
	'mapquestapi': new MapQuestApi()	
}