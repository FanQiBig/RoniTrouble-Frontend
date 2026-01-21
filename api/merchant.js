import request from './request.js'

export const merchantApi = {
	getMerchantInfo() {
		return request.get('/merchant/merchantInfo')
	},

	getCuisinesByMerchant() {
		return request.get('/cuisine/cuisines')
	},

	getMerchantReviews() {
		return request.get('/merchant/reviews')
	}
}

export default merchantApi
