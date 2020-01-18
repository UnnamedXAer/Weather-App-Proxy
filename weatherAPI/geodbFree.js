const axios = require('axios');

class GeodbFreeApi {
	url = 'http://geodb-free-service.wirefreethought.com/v1/geo/cities';
	baseQueryParams = ['includeDeleted=SINCE_YESTERDAY',
		'&sort=-population,name',
		// '&offset=0',
		'&limit=10',
		'&languageCode=en',
		'&hateoasMode=true',
		'&minPopulation=1000'
	].join(""); // free api - no key

	getUrlByCityPrefix = (params) => {

		const {prefix, offset } = params;

		if (typeof prefix != 'string') {
			throw new Error(`Parameter "prefix" expected type is "string" but given "${typeof prefix}".`)
		}
		else if (prefix.length < 1) {
			throw new Error(`Parameter expected to be at least one character.`);
		}

		const prefixArray = prefix.split(',');
		let url = this.url + '?' + this.baseQueryParams + '&namePrefix=' + prefixArray[0];
		if (prefixArray.length > 1) {
			url += '&countryIds=' + prefixArray[1];
		}

		url += '&offset=' + (offset || 0);

		// return this.url + '?offset=10&limit=10&includeDeleted=SINCE_YESTERDAY&sort=-population,name&languageCode=en&hateoasMode=true&minPopulation=1000&namePrefix=wa';
	};

	getData = async (params) => {
		const url = this.getUrlByCityPrefix(params);
		console.log(url);

		try {
			const { data } = await axios.get(url);

			console.log(JSON.stringify(data, null, '\t'));
			if (data && data.data) {
				const payload = {
					locations: data.data.map(city => {
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
					}),
					metadata: {
						currentOffset: data.metadata.currentOffset,
						totalCount: data.metadata.totalCount
					}
				};

				return  {
					payload,
					code: 200 
				};
			}
			return {
				payload: {
					locations: [],
					metadata: {
						currentOffset:0,
						totalCount: 0
					}
				},
				code: 200 
			};
		}
		catch (err) {
			// const errorCodes = [ 'ACCESS_DENIED', 'ENTITY_NOT_FOUND', 'INCOMPATIBLE', 'PARAM_INVALID', 'PARAMS_MUTUALLY_EXCLUSIVE', 'REQUEST_UNPROCESSABLE' ];
			if (err.response && err.response.data) {
				console(err.response);
			}
			else {
				console.log(err);
			}
			throw err;
		}
	}
}

module.exports = GeodbFreeApi;