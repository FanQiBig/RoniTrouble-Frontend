<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'
	import {
		userApi
	} from '@/api/user.js'

	const statusBarH = ref(0)
	const safeBottom = ref(0)

	onMounted(async () => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
		await loadUserData()
	})
	
	const userInfo = ref({
		userId: '',
		nickname: '',
		avatarUrl: '',
		introduction: '',
		createAt: '',
		birthday: '',
		location: '',
		postCount: 0,
		viewCount: 0,
		likesFavoritesCount: 0
	})

	const age = computed(() => {
		const b = userInfo.value.birthday
		if (!b) return ''
		const year = Number(b.slice(0, 4))
		const nowY = new Date().getFullYear()
		const a = nowY - year
		return a > 0 ? a : ''
	})

	const gender = ref('♂') // 纯展示：你也可以改成 '♂'

	const tabs = ref([{
			key: 'note',
			label: '动态',
			lock: false
		},
		{
			key: 'comment',
			label: '评论',
			lock: true
		},
		{
			key: 'like',
			label: '赞过',
			lock: true
		}
	])
	const activeTab = ref('comment')

	const listComment = ref([])
	const listNote = ref([])
	const listLike = ref([])

	function formatTitle(text = '') {
		const raw = String(text || '').trim()
		if (!raw) return '（无内容）'
		return raw.length > 24 ? `${raw.slice(0, 24)}...` : raw
	}

	function normalizeUserInfo(data = {}) {
		return {
			userId: data.userId ?? '',
			nickname: data.nickname ?? '',
			avatarUrl: data.avatarUrl ?? data.avtarUrl ?? '',
			introduction: data.introduction ?? '',
			createAt: data.createAt ?? '',
			birthday: data.birthday ?? '',
			location: data.location ?? '',
			postCount: data.postCount ?? 0,
			viewCount: data.viewCount ?? 0,
			likesFavoritesCount: data.likesFavoritesCount ?? 0
		}
	}

	function mapPostItem(post = {}, index = 0) {
		return {
			id: post.postId ?? post.id ?? `${index}-${post.createdAt || ''}`,
			title: formatTitle(post.content),
			snippet: '',
			from: '来自帖子 · 日常分享',
			time: post.createdAt ?? '',
			place: post.location ?? '',
			publicText: '设为公开',
			liked: false
		}
	}

	function mapCommentItem(comment = {}, index = 0) {
		return {
			id: comment.commentId ?? comment.id ?? `${index}-${comment.createAt || ''}`,
			title: formatTitle(comment.content),
			snippet: comment.content ?? '',
			from: comment.postId ? `来自帖子 · ${comment.postId}` : '来自帖子',
			time: comment.createAt ?? '',
			place: comment.location ?? '',
			publicText: '设为公开',
			liked: false
		}
	}

	async function loadUserData() {
		const userId = uni.getStorageSync('user_id')
		const [infoRes, postsRes, commentsRes, likesRes] = await Promise.allSettled([
			userApi.getUserInfo(),
			userApi.getUserPosts(userId),
			userApi.getUserComments(userId),
			userApi.getUserLikedPosts(userId)
		])

		if (infoRes.status === 'fulfilled') {
			userInfo.value = normalizeUserInfo(infoRes.value || {})
		}
		if (postsRes.status === 'fulfilled') {
			const posts = Array.isArray(postsRes.value) ? postsRes.value : []
			listNote.value = posts.map((post, index) => mapPostItem(post, index))
		}
		if (commentsRes.status === 'fulfilled') {
			const comments = Array.isArray(commentsRes.value) ? commentsRes.value : []
			listComment.value = comments.map((comment, index) => mapCommentItem(comment, index))
		}
		if (likesRes.status === 'fulfilled') {
			const likes = Array.isArray(likesRes.value) ? likesRes.value : []
			listLike.value = likes.map((post, index) => ({
				...mapPostItem(post, index),
				liked: true
			}))
		}
	}

	function goBack() {
		uni.navigateBack()
	}

	function editProfile() {
		uni.navigateTo({
			url: '/pages/edit/edit'
		})
	}

	function openSetting() {
		uni.showToast({
			title: '设置（静态演示）',
			icon: 'none'
		})
	}

	function switchTab(key) {
		activeTab.value = key
	}

	function toggleLike(item) {
		item.liked = !item.liked
	}

	const currentList = computed(() => {
		if (activeTab.value === 'comment') return listComment.value
		if (activeTab.value === 'note') return listNote.value
		return listLike.value
	})
</script>

<template>
	<view class="page">
		<!-- 顶部灰色头部 -->
		<view class="header" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="header-top">
				<view class="back" @tap="goBack">
					<text class="back-ico">‹</text>
				</view>
			</view>

			<view class="profile-row">
				<!-- 头像 -->
				<view class="avatar-wrap">
					<image class="avatar" :src="userInfo.avatarUrl" mode="aspectFill" />
				</view>

				<!-- 名称 & 小信息 -->
				<view class="name-wrap">
					<view class="name-line">
						<text class="nickname">{{ userInfo.nickname }}</text>
					</view>

					<view class="meta">
						<text class="meta-text">用户ID：{{ userInfo.userId }}</text>
					</view>
				</view>
			</view>

			<!-- 简介/签名 -->
			<view class="bio">
				<text class="bio-text">个人介绍：{{ userInfo.introduction }}</text>
			</view>
			<!-- 标签 -->
			<view class="chips">
				<view class="chip">
					<text class="chip-ico">{{ gender }}</text>
					<text class="chip-txt">{{ age }}岁</text>
				</view>
				<view class="chip">
					<text class="chip-txt">{{ userInfo.location }}</text>
				</view>
			</view>

			<view class="stats-row">
				<view class="stat">
					<text class="num">{{ userInfo.postCount }}</text>
					<text class="lab">动态量</text>
				</view>
				<view class="stat">
					<text class="num">{{ userInfo.viewCount }}</text>
					<text class="lab">浏览量</text>
				</view>
				<view class="stat">
					<text class="num">{{ userInfo.likesFavoritesCount }}</text>
					<text class="lab">获赞</text>
				</view>
				<view class="actions">
					<view class="btn" @tap="editProfile">编辑资料</view>
				</view>
			</view>
		</view>

		<!-- 白色内容区 -->
		<view class="body">
			<!-- Tabs -->
			<view class="tabs">
				<view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: activeTab === t.key }"
					@tap="switchTab(t.key)">
					<text class="tab-label">{{ t.label }}</text>
					<view v-if="activeTab === t.key" class="tab-line"></view>
				</view>
			</view>

			<!-- 列表 -->
			<view class="list">
				<view v-if="currentList.length === 0" class="empty">
					<text class="empty-text">暂无数据</text>
				</view>

				<view v-else>
					<view v-for="item in currentList" :key="item.id" class="cell">
						<image class="cell-av" :src="userInfo.avatarUrl" mode="aspectFill" />

						<view class="cell-mid">
							<text class="cell-name">{{ userInfo.nickname }}</text>
							<text class="cell-title">{{ item.title }}</text>

							<text v-if="item.snippet" class="cell-snippet">
								{{ item.snippet }}
							</text>

							<view class="cell-meta">
								<text class="m">{{ item.from || '来自帖子 · 日常分享' }}</text>
							</view>
							<view class="cell-meta">
								<text class="m">{{ item.time }} {{ item.place }}</text>
								<text class="m"> · </text>
								<text class="m">{{ item.publicText || '设为公开' }}</text>
							</view>
						</view>

						<view class="cell-right" @tap="toggleLike(item)">
							<text class="heart" :class="{ on: item.liked }">♡</text>
						</view>
					</view>
				</view>
			</view>

			<view :style="{ height: (40 + safeBottom) + 'px' }"></view>
		</view>
	</view>
</template>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f3f5f7;
	}

	/* 顶部灰色区域 */
	.header {
		background: #7b7b7b;
		padding-bottom: 18rpx;
	}

	.header-top {
		height: 96rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back {
		width: 90rpx;
		margin-left: 2px;
		height: 90rpx;
		display: flex;
		align-items: center;
	}

	.back-ico {
		font-size: 70rpx;
		color: rgba(255, 255, 255, 0.95);
	}

	.top-right {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	/* 头像 + 名字 */
	.profile-row {
		padding: 6rpx 30rpx 20rpx;
		display: flex;
		gap: 24rpx;
		align-items: center;
	}

	.avatar-wrap {
		padding: 3rpx;
		border-radius: 999rpx;
		background: #e1e1e1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar {
		width: 130rpx;
		height: 130rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.25);
	}

	.add-plus {
		font-size: 40rpx;
		font-weight: 900;
		color: #111;
		transform: translateY(-2rpx);
	}

	.name-wrap {
		flex: 1;
		min-width: 0;
	}

	.name-line {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.nickname {
		font-size: 40rpx;
		font-weight: 900;
		color: rgba(255, 255, 255, 0.95);
		max-width: 420rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.down {
		color: rgba(255, 255, 255, 0.85);
		font-size: 28rpx;
	}

	.meta {
		margin-top: 8rpx;
	}

	.meta-text {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.70);
	}

	.meta-dot {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.55);
		margin: 0 6rpx;
	}

	/* 简介 */
	.bio {
		padding: 0 22rpx;
		margin: 6px;
	}

	.bio-text {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.92);
		line-height: 1.6;
	}

	/* 标签 */
	.chips {
		padding: 14rpx 22rpx 0;
		display: flex;
		gap: 14rpx;
		flex-wrap: wrap;
	}

	.chip {
		height: 48rpx;
		padding: 3px 14px;
		border-radius: 999rpx;
		background: rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.chip-ico {
		color: #ff6ea6;
		font-size: 26rpx;
		font-weight: 900;
	}

	.chip-txt {
		color: rgba(255, 255, 255, 0.88);
		font-size: 26rpx;
		font-weight: 700;
	}

	/* 统计 + 按钮 */
	.stats-row {
		margin: 20rpx 20rpx 10rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex-wrap: wrap;
	}

	.stat {
		width: 120rpx;
	}

	.num {
		display: block;
		font-size: 32rpx;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1.1;
	}

	.lab {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.70);
	}

	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.btn {
		height: 64rpx;
		padding: 0 22rpx;
		border-radius: 999rpx;
		border: 2px solid rgba(255, 255, 255, 0.55);
		color: rgba(255, 255, 255, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		font-weight: 400;
	}

	/* 白色内容区 */
	.body {
		background: #fff;
		border-top-left-radius: 30rpx;
		border-top-right-radius: 30rpx;
		overflow: hidden;
		padding-bottom: 10rpx;
	}

	/* tabs */
	.tabs {
		height: 96rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: flex-end;
		gap: 38rpx;
		border-bottom: 1px solid #f2f2f2;
	}

	.tab {
		position: relative;
		height: 90rpx;
		display: flex;
		align-items: flex-end;
		padding-bottom: 18rpx;
		gap: 10rpx;
	}

	.tab-label {
		font-size: 33rpx;
		font-weight: 800;
		margin: 0 10px;
		color: #666;
	}

	.tab.on .tab-label {
		color: #111;
	}

	.tab-line {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 8rpx;
		height: 6rpx;
		border-radius: 999rpx;
		background: #55aaff;
	}


	.ico3 {
		font-size: 30rpx;
		opacity: .55;
	}

	/* sub stats */
	.sub-stats {
		padding: 16rpx 22rpx 0;
		display: flex;
		gap: 28rpx;
		color: #777;
		font-size: 26rpx;
	}

	.sub-item {
		color: #777;
	}

	/* list */
	.list {
		padding: 10rpx 0 0;
	}

	.cell {
		padding: 18rpx 22rpx;
		display: flex;
		gap: 14rpx;
		border-bottom: 1px solid #f6f6f6;
	}

	.cell-av {
		width: 84rpx;
		height: 84rpx;
		border-radius: 20rpx;
		background: #f2f2f2;
		flex-shrink: 0;
	}

	.cell-mid {
		flex: 1;
		min-width: 0;
	}

	.cell-name {
		display: block;
		font-size: 26rpx;
		color: #999;
		margin-bottom: 6rpx;
	}

	.cell-title {
		display: block;
		font-size: 30rpx;
		font-weight: 900;
		color: #111;
		line-height: 1.25;
	}

	.cell-snippet {
		display: block;
		margin-top: 8rpx;
		font-size: 26rpx;
		color: #777;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cell-meta {
		margin-top: 8rpx;
	}

	.m {
		font-size: 24rpx;
		color: #999;
	}

	.cell-right {
		width: 70rpx;
		display: flex;
		justify-content: flex-end;
		padding-top: 16rpx;
	}

	.heart {
		font-size: 44rpx;
		color: #cfcfcf;
	}

	.heart.on {
		color: #ff2e55;
	}

	.empty {
		padding: 80rpx 22rpx;
		display: flex;
		justify-content: center;
	}

	.empty-text {
		color: #aaa;
		font-size: 26rpx;
	}
</style>
