const axios = require('axios');

class OpenWeatherApi {
	url = 'http://api.openweathermap.org/data/2.5/';
	iconUrl = 'http://openweathermap.org/img/wn/';
	baseQueryParams = `APPID=${process.env.OPENWEATHER_KEY}&mode=json`;
	/** imperial | metrics (default) **/
	unitsParams = (units) => `units=${units ? units : 'metric'}`;
	/** "en" (default) | "pl" | etc. */
	langParam = (lang) => `lang=${lang || 'en'}`;
	locParams = (loc) => {
		if (loc) {
			if (loc.latitude && loc.longitude) {
				return `lat=${loc.latitude}&lon=${loc.longitude}`;
			}
			if (loc.city) {
				return `q=${loc.city}` + (loc.countryCode ? `,${loc.countryCode}` : '');
			}
		}
		throw new Error('Location data are missing or incomplete.');
	};

	getUrl = (params) => {
		const { endPoint, units, lang, loc } = params;

		if (typeof endPoint != 'string') {
			throw new Error(`Parameter "endPoint" expected type is "string" but given "${typeof endPoint}".`);
		}

		return `${this.url}${endPoint}?${this.baseQueryParams}&${this.unitsParams(units)}&${this.langParam(lang)}&${this.locParams(loc)}`;
	};

	getData = async (params) => {

		let url;
		try {
			url = this.getUrl(params);
		}
		catch (err) {
			return {
				error: err.message
			};
		};

		try {
			const { data } = await axios.get(url, {
				responseType: "json", headers: {
					"Content-Type": "application/json"
				}
			});

			const payload = this.parseData(data, params.endPoint);
			return {
				payload,
				code: 200
			};
		}
		catch (err) {
			// axios error structure
			if (err.response && err.response.data) {
				// openweathermap errors codes
				if (err.response.data.cod === 429) {
					return {
						error: err.response.data.message || 'API calls limit exceeded (60 calls per minute)',
						code: 429
					}
				}
				else if (err.response.data.cod == 404 && err.response.data.message == 'city not found') {
					return {
						payload: null,
						code: 200
					};
				}
			}

			throw err;
		}
	};

	parseData = (data, type) => {
		if (type === 'weather') {
			return {
				weatherData: {
					dt: data.dt*1000,
					imgName: data.weather[0].icon,
					temperature: {
						main: data.main.temp,
						feelsLike: data.main.feels_like,
						min: data.main.temp_min,
						max: data.main.temp_max
					},
					pressure: data.main.grnd_level || data.main.pressure,
					humidity: data.main.humidity,
					wind: data.wind,
					time: data.dt * 1000,
					sunrise: data.sys.sunrise*1000,
					sunset: data.sys.sunset*1000,
					visibility: data.visibility,
					description: data.weather[0].description,
					shortDescription: data.weather[0].main,
					clouds: data.clouds.all
				},
				location: {
					id: data.id,
					city: data.name,
					countryCode: data.sys.countryCode,
					latitude: data.coord.lat,
					longitude: data.coord.lon
				},
			};
		}
		else if (type === 'forecast') {
			return {
				weatherData: data.list.map(x => {
					return {
						imgName: x.weather[0].icon,
						temperature: {
							main: x.main.temp,
							feelsLike: x.main.feels_like,
							min: x.main.temp_min,
							max: x.main.temp_max
						},
						pressure: x.main.grnd_level || x.main.pressure,
						humidity: x.main.humidity,
						wind: x.wind,
						time: x.dt * 1000,
						clouds: x.clouds.all,
						description: x.weather[0].description,
						shortDescription: x.weather[0].main
					}
				}),
				location: {
					city: data.city.name,
					countryCode: data.city.country,
					latitude: data.city.coord.lat,
					longitude: data.city.coord.lon
				},
				linesCnt: data.cnt,
				sun: {
					sunrise: data.city.sunrise*1000,
					sunset: data.city.sunset*1000
				}
			};
		}
		else {
			throw new Error('Parameter "endPoint" expected to be "weather" or "forecast".');
		}
	};
}

module.exports = OpenWeatherApi;