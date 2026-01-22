<template>
<<<<<<< HEAD
	<view class="page">
		<view class="custom-navbar">
			<view class="navbar-content">
				<text class="navbar-title">对话</text>
			</view>
		</view>

		<view class="content-wrapper">
			<view v-if="privateChats.length === 0" class="empty">暂无私聊</view>
			<view v-else class="list">
				<view class="item-card" v-for="item in privateChats" :key="item.conversationId || item.userId"
					@tap="openPrivateChat(item)">
					<view class="card-content">
						<view class="avatar-wrapper">
							<image class="avatar" :src="item.avtarUrl || defaultAvatar" mode="aspectFill" />
							<view v-if="getUnreadCountFunc(item.conversationId) > 0" class="unread-badge">
								<text v-if="getUnreadCountFunc(item.conversationId) > 99" class="badge-text">99+</text>
								<text v-else class="badge-text">{{ getUnreadCountFunc(item.conversationId) }}</text>
							</view>
						</view>
						<view class="info">
							<text class="name">{{ item.nickname || '未命名' }}</text>
							<text class="desc">{{ getLastMessageText(item) || item.introduction || '这个人很神秘~' }}</text>
						</view>
						<view class="right">
							<text class="arrow">›</text>
						</view>
					</view>
				</view>
			</view>
		</view>
=======
	<view>
		
>>>>>>> 75c61f11970c2c6b423da1f6167291da243695d2
	</view>
</template>

<script setup>
<<<<<<< HEAD
	import {
		ref,
		reactive
	} from 'vue'
	import {
		onShow,
		onUnload
	} from '@dcloudio/uni-app'
	import request from '../../api/request.js'
	import {
		getConversationMessages,
		getUnreadCount,
		subscribeMessages
	} from '../../utils/messageStore.js'

	const privateChats = ref([])
	const defaultAvatar = '/static/logo.png'
	const myUserId = ref(null)
	const unsubscribe = ref(null)
	const unreadCounts = reactive({})

	const fetchChats = async () => {
		try {
			const data = await request.get('/privateChat')
			privateChats.value = data
		} catch (e) {
			privateChats.value = []
			uni.showToast({
				title: '加载私聊失败',
				icon: 'none'
			})
		}
	}

	const openPrivateChat = (item) => {
		const conversationPart = `&conversationId=${item.conversationId || item.userId}`
		const params =
			`?userId=${item.userId}&name=${encodeURIComponent(item.nickname || '未命名')}&avatar=${encodeURIComponent(item.avtarUrl || '')}${conversationPart}`
		uni.navigateTo({
			url: `/pages/chat/chat${params}`
		})
	}

	const initMyUserId = async () => {
		try {
			const {
				getMyProfile
			} = require('../../api/profile.js')
			const profile = await getMyProfile()
			if (profile && profile.userId !== undefined && profile.userId !== null) {
				myUserId.value = profile.userId
			}
		} catch (e) {}
	}

	const initUnreadCounts = () => {
		privateChats.value.forEach(item => {
			if (item.conversationId) {
				unreadCounts[item.conversationId] = getUnreadCount(item.conversationId)
			}
		})
	}

	const bindMessageUpdates = () => {
		if (unsubscribe.value) return
		unsubscribe.value = subscribeMessages((payload) => {
			if (!payload) return
			if (payload.conversationId) {
				unreadCounts[payload.conversationId] = getUnreadCount(payload.conversationId)
			}
		})
	}

	const getUnreadCountFunc = (conversationId) => {
		if (!conversationId) return 0
		return unreadCounts[conversationId] || 0
	}

	const getLastMessageText = (item) => {
		if (!item || !item.conversationId) return ''
		const messages = getConversationMessages(item.conversationId)
		if (!messages || !messages.length) return ''
		const lastMsg = messages[messages.length - 1]
		if (!lastMsg) return ''
		const type = lastMsg.type || lastMsg.messageType
		if (type === 'IMAGE') return '[图片]'
		if (type === 'FILE') return '[文件]'
		if (type === 'VOICE') return '[语音]'
		const content = lastMsg.content || lastMsg.text || ''
		return content.length > 20 ? content.substring(0, 20) + '...' : content
	}

	onShow(() => {
		fetchChats()
		initMyUserId()
		initUnreadCounts()
		bindMessageUpdates()
	})

	onUnload(() => {
		if (unsubscribe.value) {
			unsubscribe.value()
			unsubscribe.value = null
		}
	})
</script>

<style>
	.page {
		height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: #f6f7fb;
	}

	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: #ffffff;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	}

	.navbar-content {
		display: flex;
		align-items: center;
		padding: 24rpx;
		height: 88rpx;
		box-sizing: border-box;
	}

	.navbar-title {
		flex: 1;
		font-size: 32rpx;
		font-weight: 700;
		color: #1f2024;
		text-align: center;
	}

	.content-wrapper {
		flex: 1;
		overflow-y: auto;
		padding: 112rpx 24rpx 24rpx;
	}

	.empty {
		padding: 26rpx 0 30rpx;
		text-align: center;
		font-size: 26rpx;
		color: #8a8f99;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.item-card {
		background: #ffffff;
		border-radius: 32rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
		padding: 20rpx;
		transition: all 0.3s ease;
		width: 100%;
		box-sizing: border-box;
	}

	.item-card:active {
		transform: translateY(-4rpx);
		box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.1);
	}

	.card-content {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.avatar-wrapper {
		position: relative;
		width: 88rpx;
		height: 88rpx;
		flex-shrink: 0;
	}

	.avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 24rpx;
		background: #f0f2f7;
	}

	.unread-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		padding: 0 8rpx;
		background: #ff4d4f;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid #ffffff;
		box-sizing: border-box;
	}

	.badge-text {
		font-size: 18rpx;
		font-weight: 600;
		color: #ffffff;
		line-height: 1;
	}

	.info {
		flex: 1;
		overflow: hidden;
	}

	.name {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2024;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.desc {
		display: block;
		margin-top: 6rpx;
		font-size: 26rpx;
		color: #6b6f76;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.right {
		display: flex;
		align-items: center;
		gap: 10rpx;
		flex-shrink: 0;
	}

	.arrow {
		color: #c2c7d0;
		font-size: 34rpx;
		line-height: 1;
	}
</style>
=======
	
</script>

<style>
	       
</style>
>>>>>>> 75c61f11970c2c6b423da1f6167291da243695d2
