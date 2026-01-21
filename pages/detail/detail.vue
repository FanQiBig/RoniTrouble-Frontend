<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'


	const backAvatar = '/static/component/back.png'
	const likeAvatar = '/static/component/like.png'
	const likeActiveAvatar = '/static/component/like-active.png'
	const commentAvatar = '/static/component/comment.png'
	const shareAvatar = '/static/component/share.png'
	
	
	const statusBarH = ref(0)
	const safeBottom = ref(0)

	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
	})

	/** 模拟数据 */
	const post = ref({
		author: {
			name: '蜡笔不曾画小新',
			avatar: 'https://picsum.photos/seed/u1/120/120'
		},
		textLines: ['东大门雪人', '作者糊经缩写打错了', '目前已改回'],
		images: [
			'https://picsum.photos/seed/p1/800/800',
			'https://picsum.photos/seed/p2/800/800'
		],
		time: '11:40',
		views: 2162,
		location: '湖北'
	})

	const likedUsers = ref([':0, Xiangx', '🐱', '🦈', '🦍', '🦏', '哎呀呀呀呀！', '频道用户_3425', '冰秋RX', 'mm'])
	const likeCount = ref(15)
	const commentCount = ref(2)
	const shareCount = ref(1)

	const comments = ref([{
			id: 1,
			user: {
				name: '蜡笔不曾画小新',
				avatar: 'https://picsum.photos/seed/c1/120/120'
			},
			isAuthor: true,
			content: '可以的 🌹',
			time: '2小时前',
			location: '湖北',
			replyText: '回复'
		},
		{
			id: 2,
			user: {
				name: '萍安',
				avatar: 'https://picsum.photos/seed/c2/120/120'
			},
			isAuthor: false,
			content: '你好你好可以拿图吗嘿嘿 🤭',
			time: '2小时前',
			location: '湖北',
			replyText: '回复'
		}
	])

	const inputText = ref('')

	const likedText = computed(() => {
		// 你图里是一串人名+“等人赞了”
		const show = likedUsers.value.slice(0, 6).join(' ')
		return `${show} 等人赞了`
	})

	/** 事件 */
	function goBack() {
		uni.navigateBack({
			fail: () => {
				// 没有上一页时兜底：回到post页（按你的实际路径改）
				uni.reLaunch({
					url: '/pages/post/post'
				})
			}
		})
	}

	function moreAction() {
		uni.showActionSheet({
			itemList: ['举报', '复制链接', '取消'],
			success: () => {}
		})
	}

	function previewImg(i) {
		uni.previewImage({
			current: post.value.images[i],
			urls: post.value.images
		})
	}

	function toggleLike() {
		// 演示：简单加减
		likeCount.value = likeCount.value + 1
		uni.vibrateShort?.()
	}

	function focusComment() {
		// 这里只演示提示。你也可以做一个弹层输入/或直接聚焦 input（H5/小程序有差异）
		uni.showToast({
			title: '点击输入评论',
			icon: 'none'
		})
	}

	function sendComment() {
		const txt = inputText.value.trim()
		if (!txt) return
		comments.value.unshift({
			id: Date.now(),
			user: {
				name: '我',
				avatar: 'https://picsum.photos/seed/me/120/120'
			},
			isAuthor: false,
			content: txt,
			time: '刚刚',
			location: '',
			replyText: '回复'
		})
		commentCount.value += 1
		inputText.value = ''
	}

	function onShare() {
		uni.showToast({
			title: '分享',
			icon: 'none'
		})
	}
</script>

<template>
	<view class="page">
		<!-- 顶部自定义导航 -->
		<view class="nav" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="nav-inner">
				<view class="nav-left" @tap="goBack">
					<img class="nav-icon" :src="backAvatar" />
				</view>

				<view class="nav-mid">
					<image class="nav-avatar" :src="post.author.avatar" mode="aspectFill" />
					<text class="nav-name">{{ post.author.name }}</text>
				</view>

				<view class="nav-right" />
			</view>
		</view>

		<!-- 主体滚动 -->
		<scroll-view class="main" scroll-y :show-scrollbar="false">
			<!-- 正文 -->
			<view class="content">
				<view class="text-lines">
					<text v-for="(t, idx) in post.textLines" :key="idx" class="line">{{ t }}</text>
				</view>

				<!-- 图片两列 -->
				<view class="img-grid">
					<view v-for="(img, idx) in post.images" :key="img" class="img-cell" @tap="previewImg(idx)">
						<image class="img" :src="img" mode="aspectFill" />
					</view>
				</view>

				<!-- 时间/浏览/地区 -->
				<view class="meta">
					<text class="meta-txt">{{ post.time }}</text>
					<text class="meta-dot">·</text>
					<text class="meta-txt">浏览 {{ post.views }}</text>
					<text class="meta-dot">·</text>
					<text class="meta-txt">{{ post.location }}</text>
				</view>
			</view>

			<view class="divider" />

			<!-- 评论区 -->
			<view class="comment-sec">
				<text class="comment-title">评论 {{ commentCount }}</text>

				<view class="comment" v-for="c in comments" :key="c.id">
					<image class="c-avatar" :src="c.user.avatar" mode="aspectFill" />

					<view class="c-body">
						<view class="c-head">
							<text class="c-name">{{ c.user.name }}</text>
							<view v-if="c.isAuthor" class="author-tag">作者</view>
						</view>

						<text class="c-text">{{ c.content }}</text>

						<view class="c-foot">
							<text class="c-foot-txt">{{ c.time }}</text>
							<text v-if="c.location" class="c-foot-txt">{{ c.location }}</text>
							<text class="c-reply">{{ c.replyText }}</text>
						</view>
					</view>

					<view class="c-like">
						<text class="c-like-ico">♡</text>
					</view>
				</view>
			</view>

			<!-- 给底部输入栏留空间 -->
			<!-- 评论结束标记 -->
			<view class="end-mark">
			  <view class="end-line"></view>
			  <view class="end-dot"></view>
			  <view class="end-line"></view>
			</view>

			<view :style="{ height: (140 + safeBottom) + 'px' }"></view>
		</scroll-view>

		<!-- 底部输入栏 + 操作 -->
		<view class="bottom" :style="{ paddingBottom: safeBottom + 'px' }">
			<view class="input-wrap" @tap="focusComment">
				<input v-model="inputText" class="input" placeholder="发言要友善，畅聊不引战" placeholder-class="ph"
					confirm-type="send" @confirm="sendComment" />
			</view>

			<view class="actions">
				<view class="act" @tap="toggleLike">
					<image class="act-icon" :class="{ liked: post.liked }"
						:src="post.liked ? likeActiveAvatar : likeAvatar" mode="aspectFit" />
					<text class="act-num">{{ likeCount }}</text>
				</view>

				<view class="act" @tap="focusComment">
					<img class="act-icon" :src="commentAvatar" />
					<text class="act-num">{{ commentCount }}</text>
				</view>

				<view class="act" @tap="onShare">
					<img class="act-icon" :src="shareAvatar" />
					<text class="act-num">{{ shareCount }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
	.page {
		height: 100vh;
		background: #fff;
		display: flex;
		flex-direction: column;
	}

	/* 顶部导航 */
	.nav {
		background: #f9f9f9;
	}

	.nav-inner {
		height: 96rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-left,
	.nav-right {
		width: 88rpx;
		height: 96rpx;
		display: flex;
		align-items: center;
	}

	.nav-left {
		justify-content: flex-start;
	}

	.nav-icon {
		width: 44rpx;
		height: 44rpx;
	}

	.more-ico {
		font-size: 40rpx;
		color: #111;
		letter-spacing: 4rpx;
	}

	.nav-mid {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14rpx;
	}

	.nav-avatar {
		width: 52rpx;
		height: 52rpx;
		border-radius: 999rpx;
	}

	.nav-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #111;
	}

	/* 主体 */
	.main {
		flex: 1;
	}

	.content {
		padding: 18rpx 22rpx 0;
	}

	.text-lines .line {
		display: block;
		font-size: 34rpx;
		color: #111;
		line-height: 1.65;
		margin-top: 10rpx;
	}

	/* 图片两列 */
	.img-grid {
		margin-top: 18rpx;
		display: flex;
		gap: 12rpx;
	}

	.img-cell {
		flex: 1;
		height: 240rpx;
		border-radius: 18rpx;
		overflow: hidden;
		background: #f2f2f2;
	}

	.img {
		width: 100%;
		height: 100%;
	}

	.meta {
		margin-top: 18rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
		color: #8e8e8e;
		font-size: 24rpx;
	}

	.meta-dot {
		opacity: 0.8;
	}

	.divider {
		height: 1px;
		background: #f2f2f2;
		margin-top: 18rpx;
	}

	/* 评论 */
	.comment-sec {
		padding: 18rpx 22rpx;
	}

	.comment-title {
		font-size: 30rpx;
		font-weight: 800;
		color: #111;
	}

	.comment {
		margin-top: 18rpx;
		display: flex;
		gap: 14rpx;
		align-items: flex-start;
	}

	.c-avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 999rpx;
		background: #eee;
		flex-shrink: 0;
	}

	.c-body {
		flex: 1;
		min-width: 0;
	}

	.c-head {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.c-name {
		font-size: 28rpx;
		font-weight: 800;
		color: #111;
	}

	.author-tag {
		font-size: 20rpx;
		color: #8e8e8e;
		background: #f3f3f3;
		padding: 4rpx 10rpx;
		border-radius: 8rpx;
	}

	.c-text {
		display: block;
		margin-top: 10rpx;
		font-size: 28rpx;
		color: #111;
		line-height: 1.6;
	}

	.c-foot {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.c-foot-txt {
		font-size: 22rpx;
		color: #9a9a9a;
	}

	.c-reply {
		font-size: 22rpx;
		color: #9a9a9a;
	}

	.c-like {
		width: 48rpx;
		display: flex;
		justify-content: flex-end;
	}

	.c-like-ico {
		font-size: 32rpx;
		color: #bbb;
	}
	
	/*end*/
	.end-mark{
	  margin: 36rpx 0 20rpx;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  gap: 18rpx;
	  opacity: 0.7;
	}
	
	.end-line{
	  width: 140rpx;
	  height: 2rpx;
	  background: #eaeaea;
	  border-radius: 999rpx;
	}
	
	.end-dot{
	  width: 10rpx;
	  height: 10rpx;
	  background: #e0e0e0;
	  border-radius: 999rpx;
	}


	/* 底部栏 */
	.bottom {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		margin-bottom: 10px;
		background: #fff;
		border-top: 1px solid #f2f2f2;
		padding: 16rpx 22rpx;
		display: flex;
		align-items: center;
		gap: 18rpx;
		z-index: 999;
	}

	.input-wrap {
		flex: 1;
		height: 72rpx;
		border-radius: 999rpx;
		background: #f5f5f5;
		padding: 0 18rpx;
		display: flex;
		align-items: center;
	}

	.input {
		width: 100%;
		height: 72rpx;
		font-size: 26rpx;
		color: #111;
	}

	.ph {
		color: #bdbdbd;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 22rpx;
	}

	.act {
		width: 70rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rpx;
	}

	.act-icon {
		width: 32rpx;
		height: 32rpx;
	}

	.act-num {
		font-size: 22rpx;
		color: #111;
	}
</style>