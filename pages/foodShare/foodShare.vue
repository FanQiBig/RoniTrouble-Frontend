<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'

	const backAvatar = '/static/component/back.png'
	const searchAvatar = '/static/component/search.png'

	const statusBarH = ref(0)
	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
	})

	const shops = ref([{
			id: 1,
			cover: 'https://picsum.photos/seed/food1/240/240',
			title: '花溪里·洞庭鱼鲜(藏龙…',
			rating: 4.7,
			reviews: 617,
			price: 79,
			tags: ['湘菜', '藏龙岛'],
			distance: '2.0km',
			openText: '11:00营业',
			badges: ['订'],
			promos: ['近30天550人打卡', '¥43 50元代金券', '¥34.9 6.1折【单人餐】…']
		},
		{
			id: 2,
			cover: 'https://picsum.photos/seed/food2/240/240',
			title: '比格比萨自助(武汉伟星…',
			rating: 3.6,
			reviews: 50,
			price: 64,
			tags: ['披萨自助', '藏龙岛'],
			distance: '2.6km',
			openText: '',
			badges: ['外卖'],
			promos: ['¥29.9 3.8折【单人餐】…']
		},
		{
			id: 3,
			cover: 'https://picsum.photos/seed/food3/240/240',
			title: '蛙一刀·麻椒鱼火锅(武…',
			rating: 4.2,
			reviews: 460,
			price: 51,
			tags: ['鱼火锅', '藏龙岛'],
			distance: '890m',
			openText: '',
			badges: ['外卖', '订'],
			promos: ['¥99 4.2折【超值双人餐】…', '¥39.9 50元代金券']
		}
	])

	const canSearch = computed(() => keyword.value.trim().length > 0)

	function goBack() {
		uni.switchTab({
		    url: '/pages/post/post'
		})
	}

	function onSearch() {
		if (!canSearch.value) return
		uni.showToast({
			title: `搜索：${keyword.value}`,
			icon: 'none'
		})
	}

	function tapFilter(item) {
		uni.showActionSheet({
			itemList: [`${item.label}：选项1`, `${item.label}：选项2`, `${item.label}：选项3`],
			success: (res) => {
				uni.showToast({
					title: `${item.label} -> ${res.tapIndex + 1}`,
					icon: 'none'
				})
			}
		})
	}

	function starCountFill(rating) {
		return Math.floor(rating)
	}
</script>

<template>
	<view class="page">
		<view class="nav" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="nav-inner">
				<view class="nav-left" @tap="goBack">
					<image class="back-icon" :src="backAvatar" mode="aspectFit" />
				</view>

				<view class="nav-center">
					<text class="nav-title">周边美食排行榜</text>
				</view>
				<view class="nav-right"></view>
			</view>
		</view>

		<!-- 搜索栏（不再重复 paddingTop） -->
		<view class="topbar">
			<view class="topbar-inner">
				<view class="searchbox">
					<image class="search-icon" :src="searchAvatar" mode="aspectFit" />
					<input class="search-input" v-model="keyword" placeholder="搜你想吃的" placeholder-class="ph"
						confirm-type="search" @confirm="onSearch" />
					<view class="search-btn" @tap="onSearch">搜索</view>
				</view>
			</view>
		</view>

		<!-- 分类tabs -->
		<scroll-view scroll-x class="cat-tabs" :show-scrollbar="false">
			<view class="cat-wrap">
				<view v-for="(t, idx) in categoryTabs" :key="t" class="cat-item"
					:class="{ active: idx === activeCategory }" @tap="activeCategory = idx">
					<text>{{ t }}</text>
					<view v-if="idx === activeCategory" class="cat-underline"></view>
				</view>
			</view>
		</scroll-view>

		<!-- 列表 -->
		<scroll-view scroll-y class="list" :show-scrollbar="false">
			<view v-for="item in shops" :key="item.id" class="card">
				<view class="cover">
					<image class="cover-img" :src="item.cover" mode="aspectFill" />
				</view>

				<view class="info">
					<view class="title-row">
						<text class="title">{{ item.title }}</text>
						<view class="badges">
							<view v-for="b in item.badges" :key="b" class="badge">{{ b }}</view>
						</view>
					</view>

					<view class="rate-row">
						<view class="stars">
							<text v-for="i in 5" :key="i" class="star"
								:class="{ on: i <= starCountFill(item.rating) }">★</text>
						</view>
						<text class="rating">{{ item.rating.toFixed(1) }}</text>
						<text class="meta">{{ item.reviews }}条</text>
						<text class="meta">¥{{ item.price }}/人</text>
						<text v-if="item.openText" class="open">{{ item.openText }}</text>
					</view>

					<view class="tag-row">
						<text v-for="t in item.tags" :key="t" class="tag">{{ t }}</text>
						<text class="distance">{{ item.distance }}</text>
					</view>

					<view class="promo" v-for="p in item.promos" :key="p">
						<text class="promo-dot">•</text>
						<text class="promo-text">{{ p }}</text>
					</view>
				</view>
			</view>

			<view style="height: 40rpx"></view>
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

	.nav {
		background: #fff;
	}

	.nav-inner {
		height: 88rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
	}

	.nav-left,
	.nav-right {
		width: 88rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
	}

	.nav-left {
		justify-content: flex-start;
	}

	.nav-right {
		justify-content: flex-end;
	}

	.back-icon {
		width: 44rpx;
		height: 44rpx;
	}

	.nav-center {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.nav-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #111;
	}

	/* 搜索栏 */
	.topbar {
		background: #fff;
	}

	.topbar-inner {
		height: 96rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
	}

	.searchbox {
		flex: 1;
		height: 64rpx;
		border: 4rpx solid #38b6ff;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		overflow: hidden;
		padding-left: 18rpx;
	}

	.search-icon {
		width: 36rpx;
		height: 36rpx;
		opacity: 0.7;
	}

	.search-input {
		flex: 1;
		height: 68rpx;
		font-size: 28rpx;
		padding: 0 16rpx;
		color: #111;
	}

	.ph {
		color: #bdbdbd;
	}

	.search-btn {
		height: 68rpx;
		padding: 0 26rpx;
		background: #38b6ff;
		color: #fff;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-top-right-radius: 999rpx;
		border-bottom-right-radius: 999rpx;
	}

	/* 分类 tabs */
	.cat-tabs {
		background: #fff;
		padding: 10rpx 0 0;
	}

	.cat-wrap {
		display: flex;
		align-items: flex-end;
		padding: 0 18rpx 10rpx;
		gap: 46rpx;
	}

	.cat-item {
		position: relative;
		padding: 10rpx 2rpx;
		font-size: 31rpx;
		font-weight: 600;
		color: #111;
		white-space: nowrap;
	}

	.cat-underline {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -4rpx;
		height: 6rpx;
		border-radius: 5rpx;
		background: #4ed9ff;
	}

	/* 列表 */
	.list {
		flex: 1;
	}

	.card {
		display: flex;
		gap: 18rpx;
		padding: 18rpx 22rpx;
	}

	.cover {
		width: 210rpx;
		height: 210rpx;
		border-radius: 14rpx;
		overflow: hidden;
		background: #f2f2f2;
		flex-shrink: 0;
	}

	.cover-img {
		width: 100%;
		height: 100%;
	}

	.info {
		flex: 1;
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14rpx;
	}

	.title {
		font-size: 32rpx;
		color: #111;
		font-weight: 700;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badges {
		display: flex;
		gap: 10rpx;
	}

	.badge {
		padding: 6rpx 10rpx;
		border-radius: 10rpx;
		background: #fff2ea;
		color: #ff7a2f;
		font-size: 22rpx;
		font-weight: 700;
	}

	.rate-row {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10rpx;
	}

	.stars {
		display: flex;
	}

	.star {
		font-size: 24rpx;
		color: #ddd;
		margin-right: 4rpx;
	}

	.star.on {
		color: #ff7a2f;
	}

	.rating {
		font-size: 26rpx;
		color: #ff7a2f;
		font-weight: 700;
	}

	.meta {
		font-size: 24rpx;
		color: #666;
	}

	.open {
		margin-left: auto;
		font-size: 24rpx;
		color: #c08a50;
	}

	.tag-row {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.tag {
		font-size: 24rpx;
		color: #666;
	}

	.distance {
		margin-left: auto;
		font-size: 24rpx;
		color: #111;
	}

	.promo {
		margin-top: 8rpx;
		display: flex;
		align-items: flex-start;
		gap: 8rpx;
	}

	.promo-dot {
		color: #ff7a2f;
		transform: translateY(-2rpx);
	}

	.promo-text {
		font-size: 24rpx;
		color: #666;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>