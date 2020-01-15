const axios = require('axios');

class MapQuestApi {
	url = 'http://www.mapquestapi.com/geocoding/v1/reverse';
	baseQueryParams = `key=${process.env.MAPQUEST_KEY}&thumbMaps=false&outFormat=json&includeRoadMetadata=false&includeNearestIntersection=false`;
	getUrlByCoords = (cords) => {
		const { latitude, longitude } = cords;
		return `${this.url}?${this.baseQueryParams}&location=${latitude},${longitude}`;
	};

	getData = async (params) => {
		const url = this.getUrlByCoords(params);
		// console.log('getData_url', url);
		try {
			const { data } = await axios.get(url);
			// console.log(JSON.stringify(data), null, '\t');
			if (data.info.statuscode > 299) {
				throw new Error('Unable to call Api.\n' + (data.info.messages? data.info.messages.join('\n') : ''));
			}

			if (data.results && data.results.length > 0) {
				const { locations } = data.results[0];
				if (locations && locations.length > 0) {
					const loc = locations[0];
					const payload = {
						coords: {...params},
						// copyright: data.info.copyright,
						city: loc.adminArea5,
						country: "",
						countryCode: loc.adminArea1,
						postalCode: loc.postalCode,
						region: loc.adminArea3
					}
					return payload;
				}
			}
			return null;
		}
		catch (err) {
			throw err;
		}
	};
}

class OpenWeatherApi {
	url = 'http://api.openweathermap.org/data/2.5/';
	iconUrl = 'http://openweathermap.org/img/wn/';
	baseQueryParams = `APPID=${process.env.OPENWEATHER_KEY}&mode=json`;
	/** imperial | metrics (default) **/
	unitsParams = (units) => `units=${units ? units : 'metrics'}`;
	/** "en" (default) | "pl" | etc. */
	langParam = (lang) => `lang=${lang || 'en'}`;
	locParams = (loc) => {
		if (loc) {
			if (loc.latitude && loc.longitude) {
				return `lat=${loc.latitude}&lon=${loc.longitude}`;
			}
			if (loc.city) {
				return `q=${loc.city}` + (loc.countryCode ? `,${loc.countryCode}`: '');
			}
		}
		throw new Error("Location data are missing or incomplete.");
	};

	getUrl = (params) => {
		const { endPint, units, lang, loc } = params;

		if (typeof endPint != "string") {
			throw new Error(`Parameter "endPoint" expected type is "string" but given "${typeof endPint}`);
		}

		return `${this.url}${endPint}?${this.baseQueryParams}&${this.unitsParams(units)}&${this.langParam(lang)}&${this.locParams(loc)}`;
	};

	getData = async (params) => {

		let url;
		try {
			url = this.getUrl(params);
			console.log('url', url);
		}
		catch (err) {
			return {
				error: err.message
			};
		};

		try {
			const { data } = await axios.get(url);
			console.log(JSON.stringify(data, null, '\t'));

			const payload = {
				imgName: `${data.weather[0].icon}`,
				location: {
					city: data.name,
					countryCode: data.sys.countryCode,
					latitude: data.coord.lat,
					longitude: data.coord.lon
				},
				temperature: {
					main: data.main.temp,
					feelsLike: data.main.feels_like,
					min: data.main.temp_min,
					max: data.main.temp_max
				},
				pressure: data.main.pressure,
				humidity: data.main.humidity,
				wind: data.wind,
				time: data.dt,
				sunrise: data.sys.sunrise,
				sunset: data.sys.sunset,
				visibility: data.visibility,
				description: data.weather[0].description,
				shortDescription: data.weather[0].main
			}
			return {
				payload,
				code: 200
			}; 

		}
		catch (err) {
			if (err.response.data && err.response.data.cod === 429) {
				return {
					error: err.response.data.message || "API calls limit exceeded (60 calls per minute)",
					code: 429
				}
			}
			else if (err.response.data && err.response.data.cod == 404 && err.response.data.message == "city not found") {
				return {
					payload: null,
					code: 200
				};
			}
			throw err;
		}
	}
}

class GeoDbFreeApi {
	url = 'http://geodb-free-service.wirefreethought.com/v1/geo/cities';
	baseQueryParams = '&sort=name&offset=0&limit=10'; // free api - no key
	getUrlByCityPrefix = (cityPrefix) => this.url + '?namePrefix=' + cityPrefix + this.baseQueryParams;

	getData = async (params) => {
		const url = this.getUrlByCityPrefix(params);
		console.log(url);
		const { data } = await axios.get(url);

		console.log(JSON.stringify(data, null, '\t'));
		if (data && data.data) {
			const payload = data.data.map(city => {
				return {
					id: city.id,
					coords: {
						latitude: city.latitude,
						longitude: city.longitude
					},
					city: city.name,
					country: city.country,
					countryCode: city.countryCode,
					postalCode: "",
					region: city.region
				} 
			});
			return payload;
		}
		return [];
	}
}

module.exports = {
	'geodb': new GeoDbFreeApi(),
	'openweathermap': new OpenWeatherApi(),
	'mapquestapi': new MapQuestApi()	
}