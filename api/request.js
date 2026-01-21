const BASE_URL = 'http://127.0.0.1:8080'

class Request {
	constructor() {
		this.baseURL = BASE_URL
		this.timeout = 30000
	}

	request(options) {
		return new Promise((resolve, reject) => {
			uni.request({
				url: this.baseURL + options.url,
				method: options.method || 'GET',
				data: options.data || {},
				header: this._buildHeaders(options.header),
				timeout: this.timeout,
				success: (res) => {
					this._handleResponse(res, resolve, reject)
				},
				fail: (err) => {
					this._handleError(err, reject)
				}
			})
		})
	}

	get(url, params = {}, config = {}) {
		return this.request({
			url: this._buildURL(url, params),
			method: 'GET',
			...config
		})
	}

	post(url, data = {}, config = {}) {
		return this.request({
			url: config.params ? this._buildURL(url, config.params) : url,
			method: 'POST',
			data,
			...config
		})
	}

	delete(url, data = {}, config = {}) {
		return this.request({
			url,
			method: 'DELETE',
			data,
			...config
		})
	}

	_buildURL(url, params) {
		if (!params || Object.keys(params).length === 0) {
			return url
		}
		const queryString = Object.keys(params)
			.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
			.join('&')
		return `${url}?${queryString}`
	}

	_buildHeaders(customHeaders = {}) {
		const headers = {
			'Content-Type': 'application/json',
			...customHeaders
		}

		const token = uni.getStorageSync('token')
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const ip = uni.getStorageSync('ip')
		if (ip) {
			headers['X-Forwarded-For'] = ip
			headers['X-Real-IP'] = ip
		}

		return headers
	}

	_handleResponse(res, resolve, reject) {
		const statusCode = res.statusCode
		const data = res.data

		if (statusCode >= 200 && statusCode < 300) {
			if (data && data.code !== undefined) {
				if (data.code === 200) {
					resolve(data.data)
				} else {
					uni.showToast({
						title: data.message || '请求失败',
						icon: 'none'
					})
					reject(new Error(data.message || '请求失败'))
				}
			} else {
				resolve(data)
			}
		} else if (statusCode === 401) {
			uni.showToast({
				title: '登录已过期，请重新登录',
				icon: 'none'
			})
			uni.removeStorageSync('token')
			setTimeout(() => {
				uni.reLaunch({
					url: '/pages/index/index'
				})
			}, 1500)
			reject(new Error('未授权'))
		} else if (statusCode >= 500) {
			uni.showToast({
				title: '服务器错误',
				icon: 'none'
			})
			reject(new Error('服务器错误'))
		} else {
			uni.showToast({
				title: '请求失败',
				icon: 'none'
			})
			reject(new Error('请求失败'))
		}
	}

	_handleError(err, reject) {
		console.error('请求错误:', err)
		uni.showToast({
			title: '网络错误，请检查网络连接',
			icon: 'none'
		})
		reject(err)
	}
}

export default new Request()