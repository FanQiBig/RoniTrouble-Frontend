import request from './request.js'

export const postApi = {
	getHomePage(from = 0, pageSize = 10) {
		return request.get('/homePage', {
			from,
			pageSize
		})
	},

	getPostById(postId) {
		return request.get('/post', {
			postId
		})
	},

	createPost(data) {
		const body = {}
		if (data.postType !== undefined) body.postType = data.postType
		if (data.postId !== undefined) body.postId = data.postId
		if (data.content !== undefined) body.content = data.content
		if (data.cuisineId !== undefined) body.cuisineId = data.cuisineId
		if (data.merchantId !== undefined) body.merchantId = data.merchantId
		if (data.lostAndFoundType !== undefined) body.lostAndFoundType = data.lostAndFoundType
		if (data.imageUrls !== undefined) body.imageUrls = data.imageUrls

		const config = {}
		if (data.userId !== undefined) config.params = { userId: data.userId }

		return request.post('/', body, config)
	},

	deletePost(postId) {
		return request.delete('/', {
			postId
		})
	},

	getPostsByPage(from, pageSize, lostAndFoundType) {
		const params = {
			from,
			pageSize
		}
		if (lostAndFoundType !== undefined) {
			params.lostAndFoundType = lostAndFoundType
		}
		return request.get('/page', params)
	},

	getPostsByUserId() {
		return request.get('/user')
	},

	changeLikeStatus(id, likeType) {
		return request.post('/like', {}, {
			params: {
				id,
				likeType
			}
		})
	},

	getLikeCount(id, likeType) {
		return request.get('/like', {
			id,
			likeType
		})
	},

	getComments(postId) {
		return request.get('/comment', {
			postId
		})
	},

	saveComment(data) {
		return request.post('/comment', {
			postId: data.postId,
			content: data.content
		})
	},

	deleteComment(commentId) {
		return request.delete('/comment', {
			commentId
		})
	},

	getFileUrlInfo(rawFileName, category) {
		return request.get('/file', {
			rawFileName,
			Category: category
		})
	},

	uploadFile(presignedUrl, filePath) {
		return fetch(filePath)
			.then(res => res.blob())
			.then(blob => {
				return fetch(presignedUrl, {
					method: 'PUT',
					body: blob,
					headers: {
						'Content-Type': 'image/jpeg'
					}
				})
			})
			.then(res => {
				if (res.ok) {
					return res
				} else {
					throw new Error(`上传失败: ${res.status}`)
				}
			})
	}
}

export default postApi
