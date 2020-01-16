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
				throw new Error('Unable to call Api.\n' + (data.info.messages ? data.info.messages.join('\n') : ''));
			}

			if (data.results && data.results.length > 0) {
				const { locations } = data.results[0];
				if (locations && locations.length > 0) {
					const loc = locations[0];
					const payload = {
						coords: { ...params },
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

module.exports = MapQuestApi;