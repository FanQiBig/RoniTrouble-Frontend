<script setup>
	import {
		ref,
		onMounted
	} from 'vue'

	const statusBarH = ref(0)
	const safeBottom = ref(0)

	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		// #ifdef APP-PLUS
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
		// #endif
		// #ifndef APP-PLUS
		safeBottom.value = 0
		// #endif
	})

	function goBack() {
		uni.navigateBack()
	}

	// 工具：随机打乱
	function shuffle(arr) {
		const a = [...arr]
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]]
		}
		return a
	}

	/**
	 * type: 'comment' | 'like'
	 * text: 评论内容（like 可为空）
	 * quoteText: 引用内容（可选）
	 */
	const raw = [
		// 评论
		{
			id: 1,
			type: 'comment',
			nickname: 'Fred',
			avatarUrl: 'https://picsum.photos/seed/u1/120/120',
			timeText: '昨天 14:24',
			text: '能给个教程吗',
			quoteText: '心中之城：下载下来之后再打印',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		},
		{
			id: 2,
			type: 'comment',
			nickname: 'Fred',
			avatarUrl: 'https://picsum.photos/seed/u2/120/120',
			timeText: '昨天 14:23',
			text: '在哪里下载，谢谢了',
			quoteText: '心中之城：下载下来之后再打印',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		},
		{
			id: 3,
			type: 'comment',
			nickname: '心中之城',
			avatarUrl: 'https://picsum.photos/seed/u3/120/120',
			timeText: '昨天 13:33',
			text: '下载下来之后再打印',
			quoteText: 'Fred：怎么打印',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		},

		// 点赞
		{
			id: 11,
			type: 'like',
			nickname: '70号的Yb',
			avatarUrl: 'https://picsum.photos/seed/u4/120/120',
			timeText: '昨天 14:29',
			text: '',
			quoteText: '',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		},
		{
			id: 12,
			type: 'like',
			nickname: '追光者',
			avatarUrl: 'https://picsum.photos/seed/u5/120/120',
			timeText: '2天前',
			text: '',
			quoteText: '后续：软考办让本人我持身份证去补…',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		},
		{
			id: 13,
			type: 'like',
			nickname: '66',
			avatarUrl: 'https://picsum.photos/seed/u6/120/120',
			timeText: '3天前',
			text: '',
			quoteText: '',
			thumbUrl: 'https://picsum.photos/seed/p1/140/140'
		}
	]

	// ✅ 混在一起（每次进来顺序随机）
	const notices = ref(shuffle(raw))

	function onTapItem(item) {
		uni.showToast({
			title: item.type === 'like' ? '打开原笔记（自己接入）' : '打开评论详情（自己接入）',
			icon: 'none'
		})
	}
</script>

<template>
	<view class="page">
		<!-- 顶部导航 -->
		<view class="nav" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="nav-inner">
				<view class="back" @tap="goBack">
					<text class="back-ico">‹</text>
				</view>
				<text class="nav-title">收到的通知</text>
				<view class="nav-right"></view>
			</view>
		</view>

		<scroll-view class="content" scroll-y :show-scrollbar="false">
			<view v-for="item in notices" :key="item.id" class="cell" @tap="onTapItem(item)">
				<image class="avatar" :src="item.avatarUrl" mode="aspectFill" />

				<view class="mid">
					<view class="topline">
						<text class="name">{{ item.nickname }}</text>
						<text class="time">{{ item.timeText }}</text>
					</view>

					<!-- ✅ 一句话区分 -->
					<text class="action" v-if="item.type === 'like'">
						{{ item.nickname }} 点赞了你
					</text>
					<text class="action" v-else>
						{{ item.nickname }} 评论了你：{{ item.text }}
					</text>

					<!-- ✅ 引用（可选） -->
					<view class="quote" v-if="item.quoteText">
						<view class="quote-bar"></view>
						<text class="quote-text">{{ item.quoteText }}</text>
					</view>
				</view>

				<image class="thumb" :src="item.thumbUrl" mode="aspectFill" />
			</view>

			<view :style="{ height: (30 + safeBottom) + 'px' }"></view>
		</scroll-view>
	</view>
</template>

<style scoped>
	.page {
		height: 100vh;
		background: #fff;
		display: flex;
		flex-direction: column;
	}

	/* 顶部 */
	.nav {
		background: #fff;
		border-bottom: 1px solid #f1f1f1;
	}

	.nav-inner {
		height: 96rpx;
		display: flex;
		align-items: center;
		padding: 0 22rpx;
	}

	.back {
		width: 92rpx;
		height: 92rpx;
		display: flex;
		align-items: center;
	}

	.back-ico {
		font-size: 68rpx;
		color: #111;
		opacity: 0.85;
		transform: translateY(-4rpx);
	}

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: 800;
		color: #111;
	}

	.nav-right {
		width: 90rpx;
	}

	.content {
		flex: 1;
	}

	/* 单条 */
	.cell {
		display: flex;
		gap: 20rpx;
		padding: 28rpx 26rpx;
		border-bottom: 1px solid #dadada;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 999rpx;
		background: #c2c2c2;
		flex-shrink: 0;
	}

	.thumb {
		width: 92rpx;
		height: 92rpx;
		border-radius: 12rpx;
		background: #f2f2f2;
		flex-shrink: 0;
	}

	.mid {
		flex: 1;
		min-width: 0;
	}

	.topline {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12rpx;
	}

	.name {
		font-size: 34rpx;
		font-weight: 900;
		color: #111;
		line-height: 1.1;
		max-width: 320rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: 24rpx;
		color: #9a9a9a;
		flex-shrink: 0;
	}

	.action {
		display: block;
		margin-top: 12rpx;
		font-size: 30rpx;
		color: #111;
		line-height: 1.6;

		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* 引用块 */
	.quote {
		margin-top: 12rpx;
		display: flex;
		gap: 12rpx;
		align-items: flex-start;
	}

	.quote-bar {
		width: 8rpx;
		height: 38rpx;
		border-radius: 999rpx;
		background: #e6e6e6;
		margin-top: 6rpx;
		flex-shrink: 0;
	}

	.quote-text {
		flex: 1;
		min-width: 0;
		font-size: 28rpx;
		color: #9a9a9a;
		line-height: 1.6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>