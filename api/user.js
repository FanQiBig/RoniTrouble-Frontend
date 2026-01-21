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
	},

	isUserInfoByIdExisted(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/isExisted')
		}
		return request.get('/userInfo/isExisted', { userId })
	}
}

export default userApi
