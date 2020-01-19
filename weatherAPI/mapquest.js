const axios = require('axios');

class MapQuestApi {
	url = 'http://www.mapquestapi.com/geocoding/v1/reverse';
	baseQueryParams = `key=${process.env.MAPQUEST_KEY}&thumbMaps=false&outFormat=json&includeRoadMetadata=false&includeNearestIntersection=false`;
	getUrlByCoords = (cords) => {
		const { latitude, longitude } = cords;

		if (!cords || !latitude || !longitude) {
			throw new Error('Parameter "latitude" and "longitude" expected to be number type.');
		}

		return `${this.url}?${this.baseQueryParams}&location=${latitude},${longitude}`;
	};

	getData = async (params) => {
		const url = this.getUrlByCoords(params);
		
		try {
			const { data } = await axios.get(url);

			if (data.info.statuscode > 299) {
				throw new Error('Unable to fetch results.\n' + (data.info.messages ? data.info.messages.join('\n') : ''));
			}

			if (data.results && data.results.length > 0) {
				const { locations } = data.results[0];
				if (locations && locations.length > 0) {
					const loc = locations[0];
					const payload = {
						coords: { 
							latitude: loc.latLng.lat, 
							longitude: loc.latLng.lng 
						},
						// copyright: data.info.copyright,
						city: loc.adminArea5,
						country: "",
						countryCode: loc.adminArea1,
						postalCode: loc.postalCode,
						region: loc.adminArea3
					}
					return {
						payload,
						code: 200
					};
				}
			}
			return {
				payload: null,
				code: 200
			};
		}
		catch (err) {
			throw err;
		}
	};
}

module.exports = MapQuestApi;