import request from './request.js'

export function getMessageFromUserBox(from, userId) {
  const params = { from }
  if (userId !== undefined && userId !== null && userId !== '') {
    params.userId = userId
  }
  return request.get('/message/userBox', params)
}

export function getMessageChannelUrl(token, userId) {
  const host = request.defaults && request.defaults.host ? request.defaults.host : ''
  const base = host.endsWith('/') ? host.slice(0, -1) : host
  if (!token) return ''
  const normalizedToken = token.startsWith('Bearer ') ? token.slice(7) : token
  const params = [`token=${encodeURIComponent(normalizedToken)}`]
  if (userId) {
    params.push(`userId=${encodeURIComponent(userId)}`)
  }
  return `${base}/message?${params.join('&')}`
}
