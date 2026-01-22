import {
	getMessageChannelUrl,
	getMessageFromUserBox
} from '../api/message.js'
import {
	getMyProfile
} from '../api/profile.js'
import {
	appendMessages,
	getMaxMidForUser
} from './messageStore.js'

let eventSource = null
let connecting = false
let syncing = false

async function ensureMyUserId() {
	const profile = await getMyProfile()
	if (profile && profile.userId) {
		return profile.userId
	}
	return null
}

function parseNotification(raw) {
	if (!raw || typeof raw !== 'string') return null
	try {
		return JSON.parse(raw)
	} catch (e) {
		return raw
	}
}

async function syncUserBoxMessages() {
	if (syncing) return
	syncing = true
	try {
		const userId = await ensureMyUserId()
		const from = getMaxMidForUser()
		const list = await getMessageFromUserBox(from, userId)
		const messages = list
		if (!messages.length) return
		appendMessages(messages, userId)
	} catch (e) {} finally {
		syncing = false
	}
}

function handleEvent(raw) {
	const payload = parseNotification(raw)
	if (!payload) return
	if (payload === 'MessageNotification') {
		syncUserBoxMessages()
		return
	}
	if (payload.notificationType === 'MessageNotification') {
		syncUserBoxMessages()
	}
}

export async function startMessageSse() {
	if (eventSource || connecting) return
	const token = uni.getStorageSync('token')
	if (!token) return
	if (typeof EventSource === 'undefined') return
	connecting = true
	try {
		const userId = await ensureMyUserId()
		const url = getMessageChannelUrl(token, userId)
		if (!url) return
		eventSource = new EventSource(url)
		eventSource.addEventListener('MessageNotification', (event) => {
			handleEvent(event && event.data)
		})
		eventSource.onmessage = (event) => {
			handleEvent(event && event.data)
		}
		eventSource.onerror = (e) => {
			console.log(e)
		}
	} finally {
		connecting = false
	}
}

export function stopMessageSse() {
	if (!eventSource) return
	eventSource.close()
	eventSource = null
}
