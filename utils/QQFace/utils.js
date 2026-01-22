import { getFaceUrl, getFaceByName } from './index'

const STORAGE_KEY = 'recent_emojis'
const MAX_RECENT = 8
const EXPIRE_DAYS = 7

function cleanExpiredFaces(faces) {
	if (!Array.isArray(faces)) return []
	const now = Date.now()
	const expireTime = EXPIRE_DAYS * 24 * 60 * 60 * 1000
	return faces.filter(item => {
		if (!item || typeof item !== 'object') return false
		return (now - item.timestamp) < expireTime
	})
}

export function addRecentFace(id) {
	try {
		const stored = uni.getStorageSync(STORAGE_KEY)
		let faces = Array.isArray(stored) ? stored : []
		if (faces.length > 0 && typeof faces[0] !== 'object') {
			faces = faces.map(id => ({ id, timestamp: Date.now() }))
		}
		faces = cleanExpiredFaces(faces)
		faces = faces.filter(item => item && item.id !== id)
		faces.unshift({ id, timestamp: Date.now() })
		if (faces.length > MAX_RECENT) {
			faces = faces.slice(0, MAX_RECENT)
		}
		uni.setStorageSync(STORAGE_KEY, faces)
		return faces.map(item => item.id)
	} catch (e) {
		return []
	}
}

export function getRecentFaces() {
	try {
		const stored = uni.getStorageSync(STORAGE_KEY)
		if (!Array.isArray(stored)) return []
		if (stored.length === 0) return []
		if (typeof stored[0] === 'object' && stored[0].id) {
			const faces = cleanExpiredFaces(stored)
			if (faces.length !== stored.length) {
				uni.setStorageSync(STORAGE_KEY, faces)
			}
			return faces.map(item => item.id)
		} else {
			const faces = stored.map(id => ({ id, timestamp: Date.now() }))
			uni.setStorageSync(STORAGE_KEY, faces)
			return stored
		}
	} catch (e) {
		return []
	}
}

export function clearRecentFaces() {
	try {
		uni.removeStorageSync(STORAGE_KEY)
		return true
	} catch (e) {
		return false
	}
}

export function parseEmojis(text) {
	if (!text || typeof text !== 'string') return text
	const emojiRegex = /\/[^/\s]+/g
	return text.replace(emojiRegex, (match) => {
		const id = findFaceByText(match)
		if (id) {
			const url = getFaceUrl(id)
			return `[emoji:${id}]`
		}
		return match
	})
}

export function formatTextWithEmojis(text) {
	if (!text || typeof text !== 'string') return text
	const emojiRegex = /\[emoji:(\d+)\]/g
	return text.replace(emojiRegex, (match, id) => {
		const url = getFaceUrl(id)
		return url
	})
}

export function findFaceByText(text) {
	if (!text || typeof text !== 'string') return null
	const input = text.startsWith('/') ? text.substring(1) : text
	const face = getFaceByName(input)
	return face ? String(face.id) : null
}

export function getFaceDisplay(text) {
	if (!text || typeof text !== 'string') return text
	
	const trimmedText = text.trim()
	
	if (trimmedText.includes('<img')) {
		return parseHtmlWithImages(trimmedText)
	}
	
	const emojiRegex = /\/[^/\s]+/g
	const parts = []
	let lastIndex = 0
	let match

	while ((match = emojiRegex.exec(trimmedText)) !== null) {
		if (match.index > lastIndex) {
			parts.push({
				type: 'text',
				content: trimmedText.substring(lastIndex, match.index)
			})
		}
		const id = findFaceByText(match[0])
		if (id) {
			const url = getFaceUrl(id, true)
			parts.push({
				type: 'emoji',
				id: id,
				url: url
			})
		} else {
			parts.push({
				type: 'text',
				content: match[0]
			})
		}
		lastIndex = match.index + match[0].length
	}

	if (lastIndex < trimmedText.length) {
		parts.push({
			type: 'text',
			content: trimmedText.substring(lastIndex)
		})
	}

	return parts.length > 0 ? parts : [{ type: 'text', content: trimmedText }]
}

function parseHtmlWithImages(html) {
	const parts = []
	const imgRegex = /<img[^>]*src=['"]([^'"]*)['"][^>]*>/gi
	let lastIndex = 0
	let match

	while ((match = imgRegex.exec(html)) !== null) {
		if (match.index > lastIndex) {
			const textBefore = html.substring(lastIndex, match.index).replace(/<[^>]+>/g, '')
			if (textBefore) {
				parts.push({
					type: 'text',
					content: textBefore
				})
			}
		}
		const imgUrl = match[1]
		const emojiId = findFaceIdByUrl(imgUrl)
		if (emojiId) {
			parts.push({
				type: 'emoji',
				id: emojiId,
				url: getFaceUrl(emojiId, true)
			})
		}
		lastIndex = match.index + match[0].length
	}

	if (lastIndex < html.length) {
		const textAfter = html.substring(lastIndex).replace(/<[^>]+>/g, '')
		if (textAfter) {
			parts.push({
				type: 'text',
				content: textAfter
			})
		}
	}

	return parts.length > 0 ? parts : [{ type: 'text', content: html.replace(/<[^>]+>/g, '') }]
}

function findFaceIdByUrl(url) {
	const match = url.match(/\/(\d+)\/apng\/\d+\.png$/)
	return match ? match[1] : null
}
