<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'

	const searchAvatar = '/static/component/merchant/search.png'
	const favoriteAvatar = '/static/component/merchant/favorite.png'
	const favoriteActiveAvatar = '/static/component/merchant/favorite-active.png'
	const shareAvatar = '/static/component/merchant/share.png'
	const timeAvatar = '/static/component/merchant/time.png'
	const phoneAvatar = '/static/component/merchant/phone.png'


	const statusBarH = ref(0)
	const safeBottom = ref(0)

	const isFav = ref(false)

	function onFav() {
		isFav.value = !isFav.value
		uni.showToast({
			title: isFav.value ? '已收藏' : '取消收藏',
			icon: 'none'
		})
	}


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

	/** 顶部轮播图 */
	const banners = ref([
		'https://picsum.photos/seed/d1/1200/600',
		'https://picsum.photos/seed/d2/1200/600',
		'https://picsum.photos/seed/d3/1200/600'
	])

	/** 商家基础信息（示例数据） */
	const shop = ref({
		name: '花溪里·洞庭鱼鲜(藏龙岛店)',
		rating: 4.7,
		reviews: 617,
		price: 79,
		tags: ['湘菜', '藏龙岛'],
		hotTags: ['必吃榜', '江夏区湘菜热门榜第1名', '近30天550人打卡'],
		time: '11:00-14:00，17:00-21:00',
		phone: '12355',
		address: '江夏区藏龙岛某某路 3 号',
		distance: '距离 780m'
	})

	/** 吸顶 tab */
	const topTabs = ref([{
			key: 'menu',
			label: '点菜'
		},
		{
			key: 'earn',
			label: '拍照赚'
		},
		{
			key: 'review',
			label: `评价(${shop.value.reviews})`
		}
	])
	const activeTopTab = ref('menu')

	/** scroll-into-view */
	const intoView = ref('sec-menu')

	function switchTopTab(key) {
		activeTopTab.value = key
		intoView.value = `sec-${key}`
	}

	/** 返回：优先返回上一页，不存在则回到 post（你可以改成你自己的页面） */
	function goBack() {
		// 某些场景没有上一页栈时，navigateBack 会失败，所以兜底一下
		uni.navigateBack({
			fail: () => {
				// 如果你的 post 是 tabBar，用 switchTab
				// uni.switchTab({ url: '/pages/post/post' })

				// 如果 post 不是 tabBar，用 reLaunch / navigateTo
				uni.reLaunch({
					url: '/pages/post/post'
				})
			}
		})
	}

	function onSearch() {
		uni.showToast({
			title: '搜索',
			icon: 'none'
		})
	}

	function onShare() {
		uni.showToast({
			title: '分享',
			icon: 'none'
		})
	}

	function onMore() {
		uni.showActionSheet({
			itemList: ['投诉/报错', '商家信息纠错', '取消'],
			success: () => {}
		})
	}

	/** 推荐菜 */
	const dishes = ref([{
			id: 1,
			name: '洞庭鱼鲜',
			img: 'https://picsum.photos/seed/c1/400/400',
			cnt: '49人推荐'
		},
		{
			id: 2,
			name: '麻椒蛙',
			img: 'https://picsum.photos/seed/c2/400/400',
			cnt: '29人推荐'
		},
		{
			id: 3,
			name: '小炒黄牛肉',
			img: 'https://picsum.photos/seed/c3/400/400',
			cnt: '18人推荐'
		},
		{
			id: 4,
			name: '招牌炒饭',
			img: 'https://picsum.photos/seed/c4/400/400',
			cnt: '12人推荐'
		}
	])

	/** 商家相册 */
	const albums = ref([
		'https://picsum.photos/seed/a1/400/400',
		'https://picsum.photos/seed/a2/400/400',
		'https://picsum.photos/seed/a3/400/400'
	])

	/** 商家新鲜事 */
	const newsList = ref([{
		id: 1,
		title: '大寒热辣新品上线，鱼鲜更香～',
		time: '01月19日',
		imgs: ['https://picsum.photos/seed/n1/400/300', 'https://picsum.photos/seed/n2/400/300']
	}])

	/** 评价 */
	const reviewFilters = ref(['全部', '味道好', '环境好', '服务好', '性价比高'])
	const activeReviewFilter = ref(0)

	const reviews = ref([{
			id: 1,
			user: '小可爱',
			time: '2025-10-02',
			score: 5,
			text: '环境不错，菜品很新鲜，服务也很快，下次还来～',
			imgs: ['https://picsum.photos/seed/r1/300/220', 'https://picsum.photos/seed/r2/300/220']
		},
		{
			id: 2,
			user: 'rita',
			time: '01-17',
			score: 4,
			text: '位置好找，味道在线，就是高峰期略等位。',
			imgs: ['https://picsum.photos/seed/r3/300/220']
		}
	])

	function starFill(n, score) {
		return n <= score
	}
</script>

<template>
	<view class="page">
		<!-- 顶部大图轮播区域 -->
		<!-- 主体滚动 -->
		<scroll-view class="content" scroll-y :scroll-into-view="intoView" :show-scrollbar="false">
			<!-- ✅ 轮播图放进滚动容器里，这样会上滑被带走 -->
			<view class="hero">
				<swiper class="hero-swiper" circular autoplay :interval="3500" :duration="400" indicator-dots
					indicator-color="rgba(255,255,255,0.35)" indicator-active-color="#ffffff">
					<swiper-item v-for="(img, idx) in banners" :key="idx">
						<image class="hero-img" :src="img" mode="aspectFill" />
					</swiper-item>
				</swiper>

				<!-- 顶部按钮浮层 -->
				<view class="hero-top" :style="{ paddingTop: statusBarH + 'px' }">
					<view class="hero-top-inner">
						<view class="circle-btn" @tap="goBack"><text class="ico">‹</text></view>

						<view class="hero-right">
							<view class="circle-btn" @tap="onSearch">
								<image class="icon" :src="searchAvatar" mode="aspectFit" />
							</view>

							<view class="circle-btn" @tap="onFav">
								<image class="icon" :src="isFav ? favoriteActiveAvatar : favoriteAvatar"
									mode="aspectFit" />
							</view>

							<view class="circle-btn" @tap="onShare">
								<image class="icon" :src="shareAvatar" mode="aspectFit" />
							</view>
						</view>

					</view>
				</view>
			</view>

			<!-- ✅ 卡片上浮覆盖在图片底部，但不会被图片盖住 -->
			<view class="card">
				<view class="card-head">
					<text class="shop-name">{{ shop.name }}</text>
				</view>

				<view class="rating-row">
					<view class="stars">
						<text v-for="i in 5" :key="i" class="star"
							:class="{ on: i <= Math.floor(shop.rating) }">★</text>
					</view>
					<text class="rating">{{ shop.rating.toFixed(1) }}</text>
				</view>

				<view class="line">
					<view class="time">
						<image class="line-icon" :src="timeAvatar" mode="aspectFit" />
						<text class="line-text">营业时间：{{ shop.time }}</text>
					</view>
					<view class="phone">
						<image class="line-icon" :src="phoneAvatar" mode="aspectFit" />
						<text class="line-text">联系方式：{{ shop.phone }}</text>
					</view>
				</view>
			</view>
			<!-- 商家相册 -->
			<view class="section">
				<view class="sec-title">
					<text class="sec-title-txt">商家菜品</text>
					<text class="sec-more">全部 ›</text>
				</view>
				<view class="album-row">
					<image v-for="(a, idx) in albums" :key="idx" class="album-img" :src="a" mode="aspectFill" />
				</view>
			</view>

			<!-- 评价区 -->
			<view class="section" id="sec-review">
				<view class="sec-title">
					<text class="sec-title-txt">评价({{ shop.reviews }})</text>
					<text class="sec-more">全部 ›</text>
				</view>

				<scroll-view class="review-filter" scroll-x :show-scrollbar="false">
					<view class="rf-wrap">
						<view v-for="(f, idx) in reviewFilters" :key="f" class="rf"
							:class="{ on: idx === activeReviewFilter }" @tap="activeReviewFilter = idx">
							{{ f }}
						</view>
					</view>
				</scroll-view>

				<view class="review" v-for="r in reviews" :key="r.id">
					<view class="review-head">
						<view class="avatar">{{ r.user.slice(0,1) }}</view>
						<view class="rh-mid">
							<view class="rh-top">
								<text class="r-user">{{ r.user }}</text>
								<text class="r-time">{{ r.time }}</text>
							</view>
							<view class="r-stars">
								<text v-for="i in 5" :key="i" class="r-star"
									:class="{ on: starFill(i, r.score) }">★</text>
							</view>
						</view>
					</view>

					<text class="r-text">{{ r.text }}</text>

					<view class="r-imgs" v-if="r.imgs && r.imgs.length">
						<image v-for="(img, idx) in r.imgs" :key="idx" class="r-img" :src="img" mode="aspectFill" />
					</view>
				</view>
			</view>

			<view :style="{ height: (40 + safeBottom) + 'px' }"></view>
		</scroll-view>
	</view>
</template>

<style scoped>
	.page {
		height: 100vh;
		background: #f7f7f7;
		display: flex;
		flex-direction: column;
	}

	/* 顶部大图 */
	/* 顶部大图 */
	.hero {
		position: relative;
		width: 100%;
		height: 520rpx;
		overflow: hidden;
		background: #000;
	}

	.hero-swiper,
	.hero-img {
		width: 100%;
		height: 520rpx;
	}

	/* 顶部浮层按钮 */
	.hero-top {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		z-index: 10;
	}

	.hero-top-inner {
		height: 88rpx;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.circle-btn {
		width: 66rpx;
		height: 66rpx;
		border-radius: 999rpx;
		background: rgba(0, 0, 0, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ico {
		color: #fff;
		font-size: 30rpx;
	}

	.icon {
		width: 32rpx;
		height: 32rpx;
	}

	.hero-right {
		display: flex;
		align-items: center;
		gap: 14rpx;
		position: relative;
	}

	/* ✅ 卡片：上浮但不被盖住 */
	.card {
		background: #fff;
		margin-top: -40rpx;
		/* 上浮覆盖在图片底部 */
		border-top-left-radius: 26rpx;
		border-top-right-radius: 26rpx;
		padding: 20rpx 22rpx 0;
		position: relative;
		z-index: 20;
		/* ✅ 必须比 hero 高 */
	}

	/* 主体滚动 */
	.content {
		flex: 1;
	}

	/* 头部 */
	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12rpx;
	}

	.shop-name {
		font-size: 34rpx;
		font-weight: 800;
		color: #111;
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* 评分 */
	.rating-row {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
		flex-wrap: wrap;
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
		font-weight: 800;
	}

	/* 行 */
	/* 行：上下两行 */
	.line {
		margin-top: 14rpx;
		padding: 12rpx 0;
		border-top: 1px solid #f2f2f2;

		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14rpx;
	}

	/* 每一行（时间/电话） */
	.time,
	.phone {
		width: 100%;
		/* ✅ 一整行 */
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	/* 图标大小给 image */
	.line-icon {
		width: 30rpx;
		height: 30rpx;
		flex-shrink: 0;
	}

	/* 文本 */
	.line-text {
		font-size: 24rpx;
		color: #333;
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}


	/* section */
	.section {
		margin-top: 12rpx;
		background: #fff;
		padding: 18rpx 22rpx;
	}

	.sec-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sec-title-txt {
		font-size: 30rpx;
		font-weight: 800;
		color: #111;
	}

	.sec-more {
		font-size: 24rpx;
		color: #999;
	}

	/* 相册 */
	.album-row {
		margin-top: 14rpx;
		display: flex;
		gap: 12rpx;
	}

	.album-img {
		width: 210rpx;
		height: 150rpx;
		border-radius: 16rpx;
		background: #f2f2f2;
	}

	/* 评价筛选 */
	.review-filter {
		margin-top: 14rpx;
	}

	.rf-wrap {
		display: flex;
		gap: 12rpx;
	}

	.rf {
		padding: 12rpx 16rpx;
		border-radius: 999rpx;
		background: #f5f5f5;
		font-size: 24rpx;
		color: #666;
		white-space: nowrap;
	}

	.rf.on {
		background: #fff0e6;
		color: #ff7a2f;
		font-weight: 800;
	}

	/* 评价列表 */
	.review {
		margin-top: 18rpx;
		padding-top: 18rpx;
		border-top: 1px solid #f2f2f2;
	}

	.review-head {
		display: flex;
		gap: 12rpx;
		align-items: flex-start;
	}

	.avatar {
		width: 56rpx;
		height: 56rpx;
		border-radius: 999rpx;
		background: #eee;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-weight: 800;
	}

	.rh-mid {
		flex: 1;
	}

	.rh-top {
		display: flex;
		justify-content: space-between;
		gap: 12rpx;
	}

	.r-user {
		font-size: 26rpx;
		color: #111;
		font-weight: 800;
	}

	.r-time {
		font-size: 22rpx;
		color: #999;
	}

	.r-stars {
		margin-top: 6rpx;
		display: flex;
	}

	.r-star {
		font-size: 22rpx;
		color: #ddd;
		margin-right: 4rpx;
	}

	.r-star.on {
		color: #ff7a2f;
	}

	.r-text {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #333;
		line-height: 1.6;
	}

	.r-imgs {
		margin-top: 12rpx;
		display: flex;
		gap: 10rpx;
		flex-wrap: wrap;
	}

	.r-img {
		width: 220rpx;
		height: 160rpx;
		border-radius: 14rpx;
		background: #f2f2f2;
	}
</style>