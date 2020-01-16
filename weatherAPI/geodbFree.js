const axios = require('axios');

class GeodbFreeApi {
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

module.exports = GeodbFreeApi;