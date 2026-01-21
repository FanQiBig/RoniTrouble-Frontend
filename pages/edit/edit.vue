<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import {
		userApi
	} from '@/api/user.js'

	const statusBarH = ref(0)
	const safeBottom = ref(0)
	const saving = ref(false)
	const userId = ref('')
	const userEmail = ref('')

	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
		safeBottom.value = 0
		userEmail.value = uni.getStorageSync('email') || ''
		loadUserInfo()
	})

	const form = ref({
		avatarUrl: '/static/avatar/default.png',
		nickname: '',
		intro: '',
		gender: '保密',
		birthday: '',
		location: ''
	})

	function decodeBase64Url(input = '') {
		if (!input) return ''
		let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
		const pad = base64.length % 4
		if (pad) base64 += '='.repeat(4 - pad)
		try {
			if (typeof atob === 'function') {
				return atob(base64)
			}
		} catch (error) {
			console.error('base64 解码失败:', error)
		}
		try {
			if (typeof uni !== 'undefined' && typeof uni.base64ToArrayBuffer === 'function') {
				const buffer = uni.base64ToArrayBuffer(base64)
				return String.fromCharCode(...new Uint8Array(buffer))
			}
		} catch (error) {
			console.error('base64 解码失败:', error)
		}
		return ''
	}

	function getUserIdFromToken() {
		const token = uni.getStorageSync('token')
		if (!token) return ''
		const parts = String(token).split('.')
		if (parts.length < 2) return ''
		const payloadText = decodeBase64Url(parts[1])
		if (!payloadText) return ''
		try {
			const payload = JSON.parse(payloadText)
			return payload.userId ?? payload.userID ?? payload.uid ?? payload.id ?? payload.sub ?? ''
		} catch (error) {
			console.error('解析 token 失败:', error)
			return ''
		}
	}

	function hydrateUserIdFallback() {
		if (userId.value) return
		const cachedId = uni.getStorageSync('user_id')
		if (cachedId) {
			userId.value = String(cachedId)
			return
		}
		const tokenId = getUserIdFromToken()
		if (tokenId !== undefined && tokenId !== null && tokenId !== '') {
			userId.value = String(tokenId)
			uni.setStorageSync('user_id', userId.value)
		}
	}

	function applyUserInfo(data = {}) {
		if (data.userId !== undefined && data.userId !== null) {
			userId.value = String(data.userId)
			uni.setStorageSync('user_id', userId.value)
		}
		form.value = {
			...form.value,
			avatarUrl: data.avatarUrl ?? data.avtarUrl ?? form.value.avatarUrl,
			nickname: data.nickname ?? form.value.nickname,
			intro: data.introduction ?? form.value.intro,
			birthday: data.birthday ?? form.value.birthday,
			location: data.location ?? form.value.location
		}
	}

	async function loadUserInfo() {
		hydrateUserIdFallback()
		try {
			const info = await userApi.getUserInfo()
			if (info) {
				applyUserInfo(info)
				uni.setStorageSync('user_profile', form.value)
				return
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
		}
		const cache = uni.getStorageSync('user_profile')
		if (cache) {
			form.value = {
				...form.value,
				...cache
			}
		}
		hydrateUserIdFallback()
	}

	function goBack() {
		uni.navigateBack()
	}

	/** 头像 */
	function changeAvatar() {
		uni.chooseImage({
			count: 1,
			success: (res) => {
				form.value.avatarUrl = res.tempFilePaths[0]
			}
		})
	}
	
	const editorOpen = ref(false)
	const editorKey = ref('')
	const editorTitle = ref('')
	const editorValue = ref('')
	const editorPlaceholder = ref('')
	const editorType = ref('text')

	function openEditor({
		key,
		title,
		value,
		type = 'text',
		placeholder = ''
	}) {
		editorKey.value = key
		editorTitle.value = title
		editorValue.value = value ?? ''
		editorType.value = type
		editorPlaceholder.value = placeholder
		editorOpen.value = true
	}

	function closeEditor() {
		editorOpen.value = false
	}

	function confirmEditor() {
		const v = (editorValue.value || '').trim()
		form.value[editorKey.value] = v
		closeEditor()
	}

	const genderOptions = ['女', '男', '保密']

	function onGenderChange(e) {
		const idx = Number(e.detail.value)
		form.value.gender = genderOptions[idx]
	}

	function onBirthdayChange(e) {
		form.value.birthday = e.detail.value
	}

	function onSave() {
		if (saving.value) return
		saving.value = true
		const numericId = Number(userId.value)
		const payload = {
			userId: Number.isFinite(numericId) ? numericId : undefined,
			nickname: form.value.nickname,
			avtarUrl: form.value.avatarUrl,
			introduction: form.value.intro,
			birthday: form.value.birthday,
			location: form.value.location
		}
		const data = Object.keys(payload).reduce((acc, key) => {
			const value = payload[key]
			if (value !== undefined && value !== null && value !== '') {
				acc[key] = value
			}
			return acc
		}, {})
		userApi.addOrUpdateUserInfo(data, data.userId)
			.then(() => {
				uni.setStorageSync('user_profile', form.value)
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				})
			})
			.catch((error) => {
				console.error('保存失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			})
			.finally(() => {
				saving.value = false
			})
	}
</script>

<template>
	<view class="page">
		<!-- 顶部导航 -->
		<view class="nav" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="nav-inner">
				<view class="nav-left" @tap="goBack">
					<text class="back">‹</text>
				</view>
				<view class="nav-mid">
					<text class="nav-title">编辑资料</text>
				</view>
				<view class="nav-right"></view>
			</view>
		</view>

		<!-- 头像 -->
		<view class="avatar-area">
			<view class="avatar-wrap" @tap="changeAvatar">
				<image class="avatar" :src="form.avatarUrl" mode="aspectFill" />
				<view class="cam">
					<image class="cam-icon" src="/static/component/avatar.png" mode="aspectFit" />
				</view>
			</view>
		</view>

		<!-- 账号信息 -->
		<view class="card">
			<view class="row"
				@tap="openEditor({ key: 'nickname', title: '昵称', value: form.nickname, type: 'text', placeholder: '请输入昵称' })">
				<text class="label">昵称</text>
				<text class="value">{{ form.nickname }}</text>
				<text class="arrow">›</text>
			</view>

			<view class="row">
				<text class="label">ID号</text>
				<text class="value">{{ userId || '-' }}</text>
				<text class="arrow"></text>
			</view>

			<view class="row">
				<text class="label">邮箱</text>
				<text class="value">{{ userEmail || '-' }}</text>
				<text class="arrow"></text>
			</view>
		</view>

		<!-- 简介 -->
		<view class="card">
			<view class="row intro-row"
				@tap="openEditor({ key: 'intro', title: '简介', value: form.intro, type: 'textarea', placeholder: '写点介绍吧…' })">
				<text class="label">简介</text>
				<view class="value intro-box">
					<text class="intro-text">{{ form.intro }}</text>
				</view>
				<text class="arrow">›</text>
			</view>
		</view>

		<!-- 用户信息 -->
		<view class="card">
			<picker mode="selector" :range="genderOptions" @change="onGenderChange">
				<view class="row">
					<text class="label">性别</text>
					<text class="value">{{ form.gender }}</text>
					<text class="arrow">›</text>
				</view>
			</picker>

			<picker mode="date" :value="form.birthday" @change="onBirthdayChange">
				<view class="row">
					<text class="label">生日</text>
					<text class="value">{{ form.birthday }}</text>
					<text class="arrow">›</text>
				</view>
			</picker>
		</view>
		<view :style="{ height: (140 + safeBottom) + 'px' }"></view>

		<!-- 保存按钮 -->
		<view class="savebar" :style="{ paddingBottom: safeBottom + 'px' }">
			<view class="save-btn" @tap="onSave">保存</view>
		</view>

		<view class="mask" v-if="editorOpen" @tap="closeEditor"></view>
		<view class="sheet" v-if="editorOpen">
			<view class="sheet-hd">
				<text class="sheet-title">{{ editorTitle }}</text>
				<text class="sheet-close" @tap="closeEditor">✕</text>
			</view>

			<view class="sheet-body">
				<input v-if="editorType !== 'textarea'" class="sheet-input" v-model="editorValue"
					:type="editorType === 'number' ? 'number' : 'text'" :placeholder="editorPlaceholder"
					placeholder-class="ph" />

				<textarea v-else class="sheet-textarea" v-model="editorValue" :placeholder="editorPlaceholder"
					placeholder-class="ph" />
			</view>

			<view class="sheet-ft">
				<view class="btn ghost" @tap="closeEditor">取消</view>
				<view class="btn primary" @tap="confirmEditor">确定</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f6f6f6;
	}

	/* 顶部导航 */
	.nav {
		background: #f6f6f6;
	}

	.nav-inner {
		height: 96rpx;
		padding: 0 26rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-left,
	.nav-right {
		width: 120rpx;
		display: flex;
		align-items: center;
	}

	.nav-right {
		justify-content: flex-end;
	}

	.back {
		font-size: 56rpx;
		color: #222;
		opacity: .85;
		transform: translateY(-2rpx);
	}

	.nav-mid {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.nav-title {
		font-size: 34rpx;
		color: #111;
		font-weight: 600;
		letter-spacing: 2rpx;
	}

	/* 头像 */
	.avatar-area {
		padding: 32rpx 0 26rpx;
		display: flex;
		justify-content: center;
	}

	.avatar-wrap {
		width: 190rpx;
		height: 190rpx;
		position: relative;
	}

	.avatar {
		width: 190rpx;
		height: 190rpx;
		border-radius: 999rpx;
		background: #fff;
	}

	.cam {
		position: absolute;
		right: 0;
		bottom: 8rpx;
		width: 62rpx;
		height: 62rpx;
		border-radius: 999rpx;
		background: rgba(0, 0, 0, .6);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cam-icon {
		width: 26px;
		height: 26px;
	}

	/* 卡片 */
	.card {
		margin: 18rpx 26rpx 0;
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.04);
	}

	.row {
		height: 112rpx;
		padding: 0 26rpx;
		display: flex;
		align-items: center;
		gap: 14rpx;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card .row:first-child {
		border-top: 0;
	}

	.label {
		width: 150rpx;
		color: #9b9b9b;
		font-size: 30rpx;
	}

	.value {
		flex: 1;
		min-width: 0;
		font-size: 34rpx;
		color: #111;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.arrow {
		width: 40rpx;
		text-align: right;
		color: #d0d0d0;
		font-size: 44rpx;
		transform: translateY(-2rpx);
	}

	/* 简介 */
	.intro-row {
		height: auto;
		padding: 26rpx 26rpx;
		align-items: center;
	}

	.intro-box {
		white-space: normal;
		text-align: center;
	}

	.intro-text {
		display: block;
		font-size: 32rpx;
		color: #111;
		line-height: 1.9;
		white-space: pre-line;
	}

	/* 保存栏 */
	.savebar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(246, 246, 246, 0.94);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		padding: 16rpx 26rpx 18rpx;
	}

	.save-btn {
		height: 92rpx;
		border-radius: 22rpx;
		background: #111;
		color: #fff;
		font-size: 32rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 编辑弹窗 */
	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.35);
		z-index: 98;
	}

	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: #fff;
		border-top-left-radius: 26rpx;
		border-top-right-radius: 26rpx;
		z-index: 99;
		padding: 22rpx 22rpx 28rpx;
	}

	.sheet-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8rpx 8rpx 18rpx;
	}

	.sheet-title {
		font-size: 34rpx;
		font-weight: 900;
		color: #111;
	}

	.sheet-close {
		font-size: 32rpx;
		color: #888;
		padding: 10rpx;
	}

	.sheet-body {
		padding: 10rpx 6rpx 0;
	}

	.sheet-input {
		height: 88rpx;
		border-radius: 18rpx;
		border: 1px solid rgba(0, 0, 0, 0.08);
		padding: 0 18rpx;
		font-size: 30rpx;
		color: #111;
		background: #fff;
	}

	.sheet-textarea {
		width: 100%;
		min-height: 220rpx;
		border-radius: 18rpx;
		border: 1px solid rgba(0, 0, 0, 0.08);
		padding: 16rpx 18rpx;
		font-size: 30rpx;
		color: #111;
		background: #fff;
		line-height: 1.7;
	}

	.ph {
		color: #bdbdbd;
	}

	.sheet-ft {
		margin-top: 18rpx;
		display: flex;
		gap: 14rpx;
	}

	.btn {
		flex: 1;
		height: 86rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 800;
	}

	.btn.ghost {
		background: #f3f3f3;
		color: #111;
	}

	.btn.primary {
		background: #111;
		color: #fff;
	}
</style>
