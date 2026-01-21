import request from './request.js'

export const userApi = {
	getIP() {
		return request.get('/ip')
	},

	uploadIP(ip) {
		return request.post('/ip', {}, {
			params: {
				ip: ip
			}
		})
	},

	getUserInfo() {
		return request.get('/userInfo')
	},

	updateUserInfo(data) {
		return request.post('/userInfo', data)
	}
}

export default userApi
