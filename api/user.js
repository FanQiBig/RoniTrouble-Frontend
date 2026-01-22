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

	getUserInfo(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/me')
		}
		return request.get('/userInfo/me', { userId })
	},

	updateUserInfo(data, userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.post('/userInfo', data)
		}
		return request.post('/userInfo', data, { params: { userId } })
	},

	addOrUpdateUserInfo(data, userId) {
		return this.updateUserInfo(data, userId)
	},

	isUserInfoByIdExisted(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/isExisted')
		}
		return request.get('/userInfo/isExisted', { userId })
	},

	getUserPosts(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/posts')
		}
		return request.get('/userInfo/posts', { userId })
	},

	getUserComments(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/comments')
		}
		return request.get('/userInfo/comments', { userId })
	},

	getUserLikedPosts(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/likedPosts')
		}
		return request.get('/userInfo/likedPosts', { userId })
	},

	getUserPostCount(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/postCount')
		}
		return request.get('/userInfo/postCount', { userId })
	},

	getUserViewCount(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/viewCount')
		}
		return request.get('/userInfo/viewCount', { userId })
	},

	getUserLikeCount(userId) {
		if (userId === undefined || userId === null || userId === '') {
			return request.get('/userInfo/likeCount')
		}
		return request.get('/userInfo/likeCount', { userId })
	}
}

export default userApi
