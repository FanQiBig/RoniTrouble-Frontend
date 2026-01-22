import request from './request.js'

export function getMessageFromUserBox(from, userId) {
	const params = {
		from
	}
	if (userId !== undefined && userId !== null && userId !== '') {
		params.userId = userId
	}
	return request.get('/message/userBox', params)
}

export function getMessageChannelUrl(token, userId) {
	const host = 'http://127.0.0.1:8080'
	const base = host.endsWith('/') ? host.slice(0, -1) : host
	if (!token) return ''
	const normalizedToken = token.startsWith('Bearer ') ? token.slice(7) : token
	const params = [`token=${encodeURIComponent(normalizedToken)}`]
	if (userId) {
		params.push(`userId=${encodeURIComponent(userId)}`)
	}
	return `${base}/notification?${params.join('&')}`
}