<template>
	<view class="page">
		<z-paging ref="zpagingRef" class="messages"
			:class="{ 'actions-open': showActions, 'emoji-panel-open': showEmojiPanel }" :useChatRecordMode="true"
			:autoHideKeyboardWhenChat="true" :autoAdjustPositionWhenChat="true" :autoToBottomWhenChat="true"
			:safeAreaInsetBottom="true" :showChatLoadingWhenReload="false" :chatLoadingMoreDefaultAsLoading="true"
			@query="onPageQuery">
			<view v-for="msg in messages" :key="msg.id" :id="msg.id" class="msg-row"
				:class="msg.mine ? 'mine' : 'other'" @tap="onBubbleTap(msg)"
				style="transform: scaleY(-1); transform-origin: center;">
				<image v-if="!msg.mine" class="msg-avatar" :src="avatar || defaultAvatar" mode="aspectFill" />
				<view class="bubble"
					:class="[msg.mine ? 'mine' : 'other', msg.type === 'IMAGE' ? 'image' : '', msg.type === 'FILE' ? 'file' : '']">
					<image v-if="msg.type === 'IMAGE' && msg.text" class="msg-image" :src="msg.text"
						mode="aspectFill" />
					<view v-else-if="msg.type === 'FILE'" class="file-card">
						<view class="file-icon">FILE</view>
						<view class="file-info">
							<text class="file-name">{{ msg.fileName || "文件" }}</text>
							<text class="file-tip">文件</text>
						</view>
					</view>
					<view v-else class="text-content">
						<template v-for="(part, index) in getFaceDisplay(msg.text)" :key="index">
							<image v-if="part.type === 'emoji'" class="msg-emoji" :src="part.url" mode="aspectFit" />
							<text v-else class="text">{{ part.content }}</text>
						</template>
					</view>
					<text v-if="messageMeta(msg)" class="time"
						:class="{ failed: msg.status === 'failed', sending: msg.status === 'sending' }">
						{{ messageMeta(msg) }}
					</text>
				</view>
				<image v-if="msg.mine" class="msg-avatar" :src="myAvatar || defaultAvatar" mode="aspectFill" />
			</view>
			<view v-if="messages.length === 0" class="empty" style="transform: scaleY(-1); transform-origin: center;">
				还没有消息，发一句吧</view>
		</z-paging>
		<view class="input-bar" :class="{ 'emoji-open': showEmojiPanel, 'actions-open': showActions }">
			<view class="plus" :class="{ disabled: uploading }" @tap="toggleActions">
				<text class="iconfont icon-zengjia"></text>
			</view>
			<view class="emoji-btn" @tap="toggleEmojiPanel">
				<text class="emoji-icon">😊</text>
			</view>
			<view class="input-wrapper" :class="{ 'multi-line': isMultiLine }">
				<editor class="input" id="editor" ref="editorRef" :placeholder="'输入消息...'" @ready="onEditorReady"
					@focus="onEditorFocus" @blur="onEditorBlur" @input="onEditorInput" />
			</view>
			<button class="send" type="primary" :loading="sending" :disabled="!canSend" @tap="send">发送</button>
		</view>
		<view v-if="showActions" class="action-mask" @tap="closeActions"></view>
		<view v-if="showActions" class="action-panel">
			<view class="action-item" @tap="chooseImage">
				<view class="action-icon image">图</view>
				<text class="action-label">图片</text>
			</view>
			<view class="action-item" @tap="chooseFile">
				<view class="action-icon file">文</view>
				<text class="action-label">文件</text>
			</view>
		</view>
		<EmojiPanel :show="showEmojiPanel" @select="handleEmojiSelect" @close="closeEmojiPanel" />
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		computed,
		nextTick
	} from 'vue'
	import {
		onLoad,
		onUnload
	} from '@dcloudio/uni-app'
	import {
		sendTextMessage,
		sendImageMessage,
		sendFileMessage
	} from '../../api/chat.js'
	import {
		getUploadInfo,
		getRawFileName,
		uploadToPresigned
	} from '../../api/file.js'
	import {
		getMyProfile
	} from '../../api/profile.js'
	import {
		appendLocalMessages,
		getConversationMessages,
		getMaxMidForUser,
		subscribeMessages,
		updateLocalMessage,
		clearUnreadCount
	} from '../../utils/messageStore.js'
	import EmojiPanel from '../../components/EmojiPanel.vue'
	import {
		data,
		getFaceById,
		getFaceUrl
	} from '../../utils/QQFace/index'
	import {
		getFaceDisplay
	} from '../../utils/QQFace/utils'

	const faceData = data.items || []

	const zpagingRef = ref(null)
	const editorRef = ref(null)
	const editorCtx = ref(null)

	const userId = ref('')
	const conversationId = ref('')
	const name = ref('好友')
	const avatar = ref('')
	const myAvatar = ref('')
	const defaultAvatar = '/static/logo.png'
	const messages = ref([])
	const draft = ref('')
	const editorHtml = ref('')
	const sending = ref(false)
	const uploading = ref(false)
	const showActions = ref(false)
	const showEmojiPanel = ref(false)
	const isMultiLine = ref(false)
	const fileNameCache = reactive({})
	const fileNameLoading = reactive({})
	const myUserId = ref(null)
	const unsubscribe = ref(null)
	const localSeq = ref(0)
	const isInitialized = ref(false)
	const editorDelta = ref(null)

	const hasContent = (delta) => {
		if (!delta || !delta.ops || !Array.isArray(delta.ops)) return false
		return delta.ops.some(op => {
			if (op.insert) {
				if (typeof op.insert === 'string') {
					return op.insert.trim() !== ''
				}
				if (op.insert && op.insert.image) {
					return true
				}
			}
			return false
		})
	}

	const convertDeltaToText = (delta) => {
		if (!delta || !delta.ops || !Array.isArray(delta.ops)) return ''

		const textParts = []

		for (const op of delta.ops) {
			if (op.insert) {
				if (typeof op.insert === 'string') {
					textParts.push(op.insert)
				}
				if (op.insert && op.insert.image) {
					const imgUrl = op.insert.image
					const match = imgUrl.match(/\/(\d+)\/(png|apng)\/\d+\.png$/)
					const id = match ? match[1] : null
					const face = id ? faceData.find(f => String(f.id) === id) : null
					if (face) {
						textParts.push(`/${face.name}`)
					} else {
						textParts.push('[图片]')
					}
				}
			}
		}

		return textParts.join('')
	}

	const lastId = computed(() => {
		if (!messages.value.length) return ''
		return messages.value[messages.value.length - 1].id
	})

	const canSend = computed(() => {
		return !sending.value && hasContent(editorDelta.value)
	})

	onLoad((query) => {
		userId.value = query.userId
		conversationId.value = query.conversationId || userId.value
		name.value = query.name || '好友'
		avatar.value = query.avatar
		uni.setNavigationBarTitle({
			title: name.value
		})
		clearUnreadCount()
		bootstrap()
		initMyUserId()
	})

	onUnload(() => {
		if (unsubscribe.value) {
			unsubscribe.value()
			unsubscribe.value = null
		}
	})

	const onPageQuery = (pageNo, pageSize) => {
		if (pageNo === 1) {
			if (!myUserId.value) {
				if (zpagingRef.value) {
					zpagingRef.value.complete([])
				}
				return
			}
			const stored = getConversationMessages(conversationId.value)
			const normalized = normalizeStoredMessages(stored)
			const reversed = normalized.slice().reverse()
			messages.value = reversed
			ensureFileNames(reversed)
			if (zpagingRef.value) {
				zpagingRef.value.complete(reversed)
			}
		} else {
			if (zpagingRef.value) {
				zpagingRef.value.complete([], true)
			}
		}
	}

	const bootstrap = () => {
		messages.value = []
		bindMessageUpdates()
	}

	const initMyUserId = async () => {
		if (myUserId.value) return
		try {
			const profile = await getMyProfile()
			if (profile && profile.userId) {
				myUserId.value = profile.userId
				myAvatar.value = profile.avatarUrl
				if (!isInitialized.value) {
					isInitialized.value = true
					nextTick(() => {
						if (zpagingRef.value) {
							zpagingRef.value.reload()
						}
					})
				}
			}
		} catch (e) {}
	}

	const bindMessageUpdates = () => {
		if (unsubscribe.value) return
		unsubscribe.value = subscribeMessages((payload) => {
			if (!payload) return
			if (String(payload.conversationId) !== String(conversationId.value)) return

			if (payload.messages && payload.messages.length > 0) {
				const newMessages = normalizeStoredMessages(payload.messages)
				ensureFileNames(newMessages)
				const reversedNewMessages = newMessages.slice().reverse()
				if (zpagingRef.value) {
					zpagingRef.value.addChatRecordData(reversedNewMessages)
				}
				messages.value = reversedNewMessages.concat(messages.value)
			}

			if (payload.allMessages && payload.allMessages.length > 0) {
				const allMessages = normalizeStoredMessages(payload.allMessages)
				const reversed = allMessages.slice().reverse()
				ensureFileNames(reversed)
				messages.value = reversed
				if (zpagingRef.value) {
					zpagingRef.value.resetTotalData(reversed)
				}
			}
		})
	}

	const normalizeStoredMessages = (list) => {
		const uid = myUserId.value
		return list.map((item, index) => {
			const id = item.localId ?
				`local-${item.localId}` :
				item.midForUser ?
				`mid-${item.midForUser}` :
				item.mid ? `mid-${item.mid}` : `srv-${index}`
			const mine = uid && item.senderId ?
				String(item.senderId) === String(uid) :
				Boolean(item.localEcho)
			const rawType = item.messageType || item.type
			const messageType = rawType.toUpperCase()
			const content = item.content || item.text
			const rawFileName = messageType === 'FILE' ? item.rawFileName || item.fileName : ''
			const fileName = messageType === 'FILE' ?
				rawFileName || fileNameCache[content] :
				''
			if (messageType === 'FILE' && rawFileName && content) {
				const key = getOssKey(content)
				if (key && !fileNameCache[key]) {
					fileNameCache[key] = rawFileName
					fileNameCache[content] = rawFileName
				}
			}
			return {
				id,
				text: content,
				time: item.localTime,
				mine,
				type: messageType,
				fileName,
				rawFileName,
				status: item.localEcho ? item.localStatus || 'sent' : 'sent',
				localEcho: Boolean(item.localEcho),
				localId: item.localId
			}
		})
	}

	const formatTime = (date) => {
		const h = String(date.getHours())
		const m = String(date.getMinutes())
		return h + ':' + (m.length === 1 ? '0' + m : m)
	}

	const messageMeta = (msg) => {
		const time = msg.time
		const prefix = time ? `${time} · ` : ''
		if (msg.status === 'sending') return prefix ? `${prefix}发送中` : '发送中'
		if (msg.status === 'failed') return prefix ? `${prefix}发送失败，点我重试` : '发送失败，点我重试'
		if (msg.localEcho) return ''
		return time
	}

	const ensureFileNames = (list) => {
		const items = list
		items.forEach((msg) => {
			if (!msg || msg.type !== 'FILE') return
			if (!msg.text) return
			if (msg.fileName) return
			const key = getOssKey(msg.text)
			if (!key) return
			const cached = fileNameCache[key] || fileNameCache[msg.text]
			if (cached) {
				msg.fileName = cached
				return
			}
			if (fileNameLoading[key]) return
			fileNameLoading[key] = true
			getRawFileName(key)
				.then((name) => {
					if (!name) return
					fileNameCache[key] = name
					fileNameCache[msg.text] = name
					messages.value = messages.value.map((item) => {
						if (item.type === 'FILE' && item.text === msg.text) {
							return {
								...item,
								fileName: name
							}
						}
						return item
					})
				})
				.catch(() => {})
				.finally(() => {
					fileNameLoading[key] = false
				})
		})
	}

	const getOssKey = (url) => {
		if (!url || typeof url !== 'string') return ''
		const trimmed = url.split('?')[0].split('#')[0]
		const match = trimmed.match(/^https?:\/\/[^/]+\/(.+)$/)
		if (match && match[1]) return match[1]
		if (trimmed.startsWith('/')) return trimmed.slice(1)
		return trimmed
	}

	const buildLocalMessage = (content, messageType, rawFileName, extra = {}) => {
		const now = new Date()
		const localTime = formatTime(now)
		const localTs = now.getTime()
		const baseMid = getMaxMidForUser()
		localSeq.value += 1
		const seq = localSeq.value
		const localId = `${localTs}-${seq}`
		const localMid = baseMid + seq / 1000
		const normalizedType = messageType.toUpperCase()
		const payload = {
			localId,
			localEcho: true,
			localTime,
			localTs,
			localMid,
			localStatus: 'sent',
			conversationId: conversationId.value,
			senderId: myUserId.value,
			content,
			messageType: normalizedType
		}
		if (rawFileName) payload.rawFileName = rawFileName
		if (extra) {
			Object.assign(payload, extra)
		}
		return payload
	}

	const send = async () => {
		if (sending.value) {
			return
		}

		if (!editorCtx.value) {
			return
		}

		editorCtx.value.getContents({
			success: (res) => {
				const text = res.text || ''
				const delta = res.delta || null

				if (!hasContent(delta)) {
					return
				}

				sendMessage(text, delta)
				editorCtx.value.clear()
				editorHtml.value = ''
				editorDelta.value = null
				draft.value = ''
			}
		})
	}

	const sendMessage = (text, delta = null) => {
		if (!text && !hasContent(delta)) {
			return
		}

		let content = text
		if (delta && hasContent(delta)) {
			content = convertDeltaToText(delta)
		}

		closeActions()
		closeEmojiPanel()

		if (!conversationId.value) {
			return uni.showToast({
				title: '缺少会话信息',
				icon: 'none'
			})
		}

		const localMessage = buildLocalMessage(content, 'TEXT')
		const localId = localMessage.localId

		draft.value = ''
		sending.value = true

		appendLocalMessages(conversationId.value, [localMessage])

		let task
		try {
			task = sendTextMessage(conversationId.value, content, myUserId.value)
		} catch (e) {
			console.error('sendTextMessage error:', e)
			markLocalFailed(localId)
			sending.value = false
			return uni.showToast({
				title: '发送失败',
				icon: 'none'
			})
		}

		sending.value = false

		if (task && typeof task.catch === 'function') {
			task.catch(() => {
				markLocalFailed(localId)
				uni.showToast({
					title: '发送失败',
					icon: 'none'
				})
			})
		}
	}

	const toggleActions = () => {
		if (uploading.value) return
		closeEmojiPanel()
		showActions.value = !showActions.value
	}

	const closeActions = () => {
		showActions.value = false
	}

	const chooseImage = () => {
		if (uploading.value) return
		closeActions()
		uni.chooseImage({
			count: 1,
			success: (res) => {
				const tempFile = res && res.tempFiles && res.tempFiles[0] ? res.tempFiles[0] : null
				const file = tempFile && tempFile.file ? tempFile.file : null
				const path = tempFile.path || res.tempFilePaths[0]
				const name = tempFile && tempFile.name ? tempFile.name : ''
				const type = tempFile && tempFile.type ? tempFile.type : (file && file.type ? file.type :
					'')
				const target = file || path
				if (!target) return
				uploadAndSend(target, {
					name,
					path,
					type
				}, 'IMAGE')
			},
			fail: () => {}
		})
	}

	const chooseFile = () => {
		if (uploading.value) return
		closeActions()
		const pick = (res) => {
			const tempFile = res && res.tempFiles && res.tempFiles[0] ? res.tempFiles[0] : null
			const file = tempFile && tempFile.file ? tempFile.file : null
			const path = tempFile.path || res.tempFilePaths[0]
			const name = tempFile && tempFile.name ? tempFile.name : ''
			const type = tempFile && tempFile.type ? tempFile.type : (file && file.type ? file.type : '')
			const target = file || path
			if (!target) return
			uploadAndSend(target, {
				name,
				path,
				type
			}, 'FILE')
		}
		if (uni.chooseFile) {
			uni.chooseFile({
				count: 1,
				success: pick,
				fail: () => {}
			})
			return
		}
		if (uni.chooseMessageFile) {
			uni.chooseMessageFile({
				count: 1,
				type: 'file',
				success: pick,
				fail: () => {}
			})
			return
		}
		uni.showToast({
			title: '当前环境不支持文件选择',
			icon: 'none'
		})
	}

	const uploadAndSend = async (fileOrPath, meta, messageType) => {
		if (!conversationId.value) {
			return uni.showToast({
				title: '缺少会话信息',
				icon: 'none'
			})
		}
		if (uploading.value) return
		uploading.value = true
		uni.showLoading({
			title: '上传中...'
		})
		try {
			const file = await resolveUploadFile(fileOrPath)
			const prefix = messageType === 'IMAGE' ? 'image' : 'file'
			const rawFileName = resolveRawFileName(meta && meta.name, meta && meta.path, (file && file.type) || (
				meta && meta.type), prefix)
			const category = messageType === 'IMAGE' ? 'IMAGE' : 'FILE'
			const info = await getUploadInfo(category, rawFileName)
			const presignedUrl = info && (info.presignedUrl || info.PresignedUrl)
			const downloadUrl = info && (info.downloadUrl || info.DownloadUrl)
			if (!presignedUrl || !downloadUrl) {
				throw new Error('未获取到上传地址')
			}
			await uploadToPresigned(presignedUrl, file)

			const localMessage = buildLocalMessage(downloadUrl, messageType, messageType === 'FILE' ? rawFileName :
				'')
			const localId = localMessage.localId
			appendLocalMessages(conversationId.value, [localMessage])

			let task
			if (messageType === 'IMAGE') {
				task = sendImageMessage(conversationId.value, downloadUrl, myUserId.value)
			} else {
				task = sendFileMessage(conversationId.value, downloadUrl, rawFileName, myUserId.value)
			}
			if (task && typeof task.catch === 'function') {
				task.catch(() => {
					markLocalFailed(localId)
					uni.showToast({
						title: '发送失败',
						icon: 'none'
					})
				})
			}
		} catch (e) {
			uni.showToast({
				title: '上传失败',
				icon: 'none'
			})
		} finally {
			uploading.value = false
			uni.hideLoading()
		}
	}

	const resolveUploadFile = async (fileOrPath) => {
		const hasBlob = typeof Blob !== 'undefined'
		if (hasBlob && fileOrPath instanceof Blob) return fileOrPath
		if (hasBlob && fileOrPath && typeof fileOrPath === 'object' && fileOrPath.file instanceof Blob) {
			return fileOrPath.file
		}
		if (typeof fileOrPath === 'string') {
			const response = await fetch(fileOrPath)
			if (!response.ok) {
				throw new Error('读取文件失败')
			}
			return response.blob()
		}
		return fileOrPath
	}

	const resolveRawFileName = (name, path, mime, prefix) => {
		if (name) return name
		const fromPath = extractNameFromPath(path)
		if (fromPath) return fromPath
		const ext = extensionFromMime(mime, prefix)
		const safePrefix = prefix || 'file'
		return `${safePrefix}_${Date.now()}${ext}`
	}

	const extractNameFromPath = (path) => {
		if (!path || typeof path !== 'string') return ''
		if (path.startsWith('blob:')) return ''
		const trimmed = path.split('?')[0].split('#')[0]
		const parts = trimmed.split('/')
		const last = parts[parts.length - 1]
		return last || ''
	}

	const extensionFromMime = (mime, prefix) => {
		if (mime && mime.includes('/')) {
			const ext = mime.split('/')[1].split(';')[0]
			if (ext && ext !== 'octet-stream') return `.${ext}`
		}
		if (prefix === 'image') return '.jpg'
		return '.bin'
	}

	const resend = async (msg) => {
		if (sending.value) return
		if (!msg || msg.status !== 'failed') return
		if (!conversationId.value) {
			return uni.showToast({
				title: '缺少会话信息',
				icon: 'none'
			})
		}
		sending.value = true
		msg.status = 'sent'
		const localId = msg.localId || String(Date.now())
		updateLocalMessage(conversationId.value, localId, {
			localStatus: 'sent'
		})
		updateMessageInList(localId, 'sent')
		let task
		try {
			if (msg.type === 'IMAGE') {
				task = sendImageMessage(conversationId.value, msg.text, myUserId.value)
			} else if (msg.type === 'FILE') {
				const rawFileName = msg.rawFileName || msg.fileName
				task = sendFileMessage(conversationId.value, msg.text, rawFileName, myUserId.value)
			} else {
				task = sendTextMessage(conversationId.value, msg.text, myUserId.value)
			}
		} catch (e) {
			msg.status = 'failed'
			updateLocalMessage(conversationId.value, localId, {
				localStatus: 'failed'
			})
			updateMessageInList(localId, 'failed')
			sending.value = false
			return uni.showToast({
				title: '重试失败',
				icon: 'none'
			})
		}
		msg.status = 'sent'
		updateLocalMessage(conversationId.value, localId, {
			localStatus: 'sent'
		})
		updateMessageInList(localId, 'sent')
		sending.value = false
		if (task && typeof task.catch === 'function') {
			task.catch(() => {
				msg.status = 'failed'
				updateLocalMessage(conversationId.value, localId, {
					localStatus: 'failed'
				})
				updateMessageInList(localId, 'failed')
				uni.showToast({
					title: '重试失败',
					icon: 'none'
				})
			})
		}
	}

	const onBubbleTap = (msg) => {
		if (!msg) return
		if (msg.type === 'IMAGE') {
			previewImage(msg)
			return
		}
		if (msg.mine && msg.status === 'failed') {
			resend(msg)
			return
		}
		if (msg.type === 'FILE') {
			openFile(msg)
			return
		}
	}

	const toggleEmojiPanel = () => {
		if (showEmojiPanel.value) {
			closeEmojiPanel()
		} else {
			closeActions()
			showEmojiPanel.value = true
		}
	}

	const closeEmojiPanel = () => {
		showEmojiPanel.value = false
	}

	const onEditorReady = (e) => {
		uni.createSelectorQuery().select('#editor').context((res) => {
			editorCtx.value = res.context
		}).exec()
	}

	const onEditorFocus = (e) => {
		closeActions()
	}

	const onEditorBlur = (e) => {}

	const onEditorInput = (e) => {
		draft.value = e.detail.text || ''
		editorHtml.value = e.detail.html || ''
		editorDelta.value = e.detail.delta || null
		const hasLineBreak = draft.value.includes('\n')
		const isLongText = draft.value.length > 20
		isMultiLine.value = hasLineBreak || isLongText
	}

	const handleEmojiSelect = (id) => {
		const face = getFaceById(id)
		if (face && editorCtx.value) {
			const faceUrl = getFaceUrl(id)
			editorCtx.value.insertImage({
				src: faceUrl,
				width: '20px',
				height: '20px',
				extClass: 'emoji'
			})
			editorCtx.value.getContents({
				success: (res) => {
					draft.value = res.text || ''
					editorHtml.value = res.html || ''
					editorDelta.value = res.delta || null
				}
			})
		}
	}

	const previewImage = (msg) => {
		if (!msg || !msg.text) return
		const imageUrls = messages.value
			.filter(item => item && item.type === 'IMAGE' && item.text)
			.map(item => item.text)
		const current = msg.text
		uni.previewImage({
			urls: imageUrls,
			current: current
		})
	}

	const openFile = async (msg) => {
		if (!msg || !msg.text) return
		const url = msg.text
		let fileName = msg.fileName || fileNameCache[url]
		if (!fileName) {
			const key = getOssKey(url)
			if (key) {
				try {
					fileName = await getRawFileName(key)
					if (fileName) {
						fileNameCache[key] = fileName
						fileNameCache[url] = fileName
					}
				} catch (e) {}
			}
		}
		if (fileName) {
			const ok = await downloadWithName(url, fileName)
			if (ok) return
		}
		if (typeof window !== 'undefined' && typeof window.open === 'function') {
			window.open(url)
			return
		}
		uni.setClipboardData({
			data: url,
			success: () => {
				uni.showToast({
					title: '链接已复制',
					icon: 'none'
				})
			}
		})
	}

	const downloadWithName = async (url, fileName) => {
		if (!url || !fileName) return false
		if (typeof window === 'undefined' || typeof document === 'undefined') return false
		if (typeof fetch !== 'function') return false
		uni.showLoading({
			title: '下载中...'
		})
		try {
			const response = await fetch(url)
			if (!response.ok) throw new Error('download failed')
			const blob = await response.blob()
			const objectUrl = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = objectUrl
			link.download = fileName
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(objectUrl)
			return true
		} catch (e) {
			return false
		} finally {
			uni.hideLoading()
		}
	}

	const markLocalFailed = (localId) => {
		if (!localId) return
		const id = `local-${localId}`
		const target = messages.value.find((item) => item && item.id === id)
		if (target) target.status = 'failed'
		updateLocalMessage(conversationId.value, localId, {
			localStatus: 'failed'
		})
	}

	const updateMessageInList = (localId, status) => {
		if (!localId) return
		const id = `local-${localId}`
		const targetIndex = messages.value.findIndex((item) => item && item.id === id)
		if (targetIndex !== -1) {
			messages.value[targetIndex] = {
				...messages.value[targetIndex],
				status
			}
		}
	}
</script>

<style>
	.page {
		min-height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
		display: flex;
		flex-direction: column;
		background: #f5f5f7 !important;
		--chat-input-height: 96rpx;
		--chat-panel-height: 220rpx;
	}

	.messages {
		flex: 1;
		padding: 32rpx 40rpx calc(56rpx + var(--chat-input-height) + var(--window-bottom, 0px));
		box-sizing: border-box;
	}

	.messages.actions-open {
		padding-bottom: calc(56rpx + var(--chat-input-height) + var(--chat-panel-height) + var(--window-bottom, 0px));
	}

	.messages.emoji-panel-open {
		padding-bottom: calc(56rpx + var(--chat-input-height) + 600rpx + var(--window-bottom, 0px));
	}

	.msg-row {
		display: flex;
		align-items: flex-end;
		gap: 20rpx;
		margin-bottom: 48rpx;
	}

	.msg-row.mine {
		justify-content: flex-end;
		padding-right: 30rpx;
	}

	.msg-row.other {
		justify-content: flex-start;
		padding-left: 0;
	}

	.msg-avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 16rpx;
		background: #f0f2f7;
		flex-shrink: 0;
	}

	.bubble {
		max-width: 75%;
		padding: 16rpx 20rpx;
		border-radius: 24rpx;
		position: relative;
		box-sizing: border-box;
		transition: all 0.2s ease;
	}

	.bubble .text {
		display: block;
		font-size: 32rpx;
		color: #333333;
		margin-bottom: 6rpx;
		line-height: 1.5;
	}

	.bubble .text-content {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6rpx;
	}

	.bubble .text-content .text {
		display: inline;
		margin-bottom: 6rpx;
		word-wrap: break-word;
		word-break: break-word;
		white-space: pre-wrap;
	}

	.msg-emoji {
		width: 60rpx;
		height: 60rpx;
		display: inline-block;
		vertical-align: middle;
	}

	.bubble .time {
		font-size: 22rpx;
		color: #8a8f99;
	}

	.bubble .time.sending {
		color: #6b6f76;
	}

	.bubble .time.failed {
		color: #ff4d4f;
	}

	.bubble.mine {
		background: #0099FF;
	}

	.bubble.mine .text {
		color: #FFFFFF;
	}

	.bubble.other {
		background: #FFFFFF;
	}

	.bubble.image {
		padding: 8rpx;
	}

	.bubble.file {
		padding: 12rpx 14rpx;
	}

	.msg-image {
		width: 280rpx;
		height: 280rpx;
		border-radius: 12rpx;
		background: #f0f2f7;
		display: block;
		margin-bottom: 6rpx;
	}

	.file-card {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.file-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 12rpx;
		background: linear-gradient(135deg, #e9eef8 0%, #dce4f2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		color: #3b4150;
		font-weight: 700;
	}

	.file-info {
		display: flex;
		flex-direction: column;
	}

	.file-name {
		font-size: 28rpx;
		color: #1f2024;
		max-width: 260rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-tip {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #8a8f99;
	}

	.empty {
		text-align: center;
		color: #8a8f99;
		font-size: 26rpx;
		padding: 40rpx 0;
	}

	.input-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		padding: 20rpx 24rpx calc(16rpx + var(--window-bottom, 0px));
		background: #ffffff;
		border-top: 1px solid #eceff4;
		box-sizing: border-box;
		z-index: 30;
	}

	.plus {
		width: 80rpx;
		height: 80rpx;
		border-radius: 20rpx;
		background: #f0f2f7;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #0099FF;
		font-size: 48rpx;
		font-weight: 600;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	.plus.disabled {
		opacity: 0.5;
	}

	.plus:active {
		transform: scale(0.94);
	}

	.plus-icon {
		line-height: 1;
	}

	.emoji-btn {
		width: 80rpx;
		height: 80rpx;
		border-radius: 20rpx;
		background: linear-gradient(135deg, #e9f2ff 0%, #d4e7ff 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.2s ease;
		margin-left: 12rpx;
	}

	.emoji-btn:active {
		transform: scale(0.94);
	}

	.emoji-icon {
		font-size: 42rpx;
		line-height: 1;
	}

	.input-wrapper {
		flex: 1;
		margin: 0 20rpx 0 16rpx;
		height: 88rpx;
		border-radius: 16rpx;
		border: 1px solid #E0E0E0;
		display: flex;
		overflow: hidden;
		background-color: #ffffff;
		transition: all 0.2s ease;
	}

	.input {
		flex: 1;
		height: 88rpx;
		font-size: 32rpx;
		color: #333333;
		overflow: hidden;
	}

	.input :deep(.ql-editor) {
		padding: 0 24rpx;
		font-size: 32rpx;
		line-height: 88rpx;
		height: 88rpx;
		overflow-y: hidden;
	}

	.input :deep(.ql-container) {
		border: none;
		height: 88rpx;
		overflow: hidden;
	}

	.input :deep(.ql-blank) {
		font-size: 32rpx;
		line-height: 88rpx;
		height: 88rpx;
		min-height: 88rpx !important;
		color: #8a8f99;
	}

	.input-wrapper.multi-line {
		height: auto;
		min-height: 88rpx;
		max-height: 200rpx;
	}

	.input-wrapper.multi-line .input {
		height: auto;
		min-height: 88rpx;
		max-height: 200rpx;
		overflow-y: auto;
	}

	.input-wrapper.multi-line .input :deep(.ql-editor) {
		line-height: 40rpx;
		min-height: 88rpx;
		max-height: 200rpx;
		overflow-y: auto;
		height: auto;
	}

	.input-wrapper.multi-line .input :deep(.ql-container) {
		min-height: 88rpx;
		max-height: 200rpx;
		height: auto;
	}

	.input-wrapper.multi-line .input :deep(.ql-blank) {
		line-height: 40rpx;
		min-height: 88rpx;
		max-height: 200rpx;
		height: auto;
	}

	.input :deep(img) {
		max-height: 32rpx;
		vertical-align: middle;
		display: inline-block;
	}

	.input :deep(.ql-clipboard) {
		left: -1000px;
		top: -1000px;
	}

	.input :deep(.ql-tooltip) {
		display: none !important;
	}

	.input-wrapper:focus-within {
		border-color: #0099FF;
		box-shadow: 0 0 0 3rpx rgba(0, 153, 255, 0.1);
	}

	.send {
		width: 160rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 16rpx;
		font-size: 32rpx;
		background: #0099FF;
		color: #FFFFFF;
		transition: all 0.2s ease;
	}

	.send:active {
		transform: scale(0.95);
	}

	.send:after {
		border: none;
	}

	.input-bar.emoji-open {
		bottom: 600rpx;
	}

	.input-bar.actions-open {
		bottom: 220rpx;
	}

	.action-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.2);
		z-index: 16;
	}

	.action-panel {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--chat-panel-height);
		background: #ffffff;
		border-top: 1px solid #eceff4;
		display: flex;
		gap: 40rpx;
		padding: 28rpx 40rpx;
		box-sizing: border-box;
		z-index: 18;
	}

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14rpx;
		width: 140rpx;
	}

	.action-icon {
		width: 88rpx;
		height: 88rpx;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 700;
		color: #1f2024;
		background: #f0f2f7;
	}

	.action-icon.image {
		background: linear-gradient(135deg, #e3f2ff 0%, #cfe7ff 100%);
		color: #1f75fe;
	}

	.action-icon.file {
		background: linear-gradient(135deg, #f2f4f7 0%, #e2e6ee 100%);
		color: #3b4150;
	}

	.action-label {
		font-size: 24rpx;
		color: #4a4d55;
	}
</style>