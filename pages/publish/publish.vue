<script setup>
	import { ref, computed, onMounted, watch } from 'vue'
	import { postApi } from '@/api/post.js'

	const backAvatar = '/static/component/back.png'

	const content = ref('')
	const images = ref([])
	const maxImages = 9

	const statusBarH = ref(0)
	const safeBottom = ref(0)

	const tabs = ref(["日常分享", "美食", "失物招领", "闲置推荐"])

	// 存用户选中的分类（默认不选：-1）
	const selectedTabIndex = ref(-1)

	const selectedTabText = computed(() => {
		return selectedTabIndex.value >= 0 ? tabs.value[selectedTabIndex.value] : '请选择'
	})

	const postTypeMap = {
		"日常分享": "LIFE_STYLE",
		"美食推荐": "REVIEW",
		"失物招领": "LOST_AND_FOUND",
		"闲置交易": "TRADE"
	}

	const getPostType = computed(() => {
		if (selectedTabIndex.value >= 0) {
			const tabName = tabs.value[selectedTabIndex.value]
			return postTypeMap[tabName] || "LIFE_STYLE"
		}
		return "LIFE_STYLE"
	})

	const isReviewPost = computed(() => getPostType.value === "REVIEW")
	const isLostAndFoundPost = computed(() => getPostType.value === "LOST_AND_FOUND")

	function chooseCategory() {
		uni.showActionSheet({
			itemList: tabs.value,
			success: (res) => {
				selectedTabIndex.value = res.tapIndex
			}
		})
	}

	function resetPostSpecificData() {
		merchantId.value = null
		cuisineId.value = null
		score.value = 0
		selectedMerchantIndex.value = -1
		selectedCuisineIndex.value = -1
		cuisines.value = []
		lostAndFoundType.value = null
		selectedLostAndFoundIndex.value = -1
	}

	watch(selectedTabIndex, (newIndex, oldIndex) => {
		resetPostSpecificData()
	})

	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
		loadMerchants()
	})

	const canPublish = computed(() => {
		const hasContent = content.value.trim().length > 0 || images.value.length > 0
		if (!hasContent) return false

		if (isReviewPost.value) {
			return merchantId.value !== null && cuisineId.value !== null && score.value > 0
		}
		if (isLostAndFoundPost.value) {
			return lostAndFoundType.value !== null
		}
		return true
	})

	function goBack() {
		uni.switchTab({
			url: '/pages/post/post'
		})
	}

	function chooseImages() {
		const remain = maxImages - images.value.length
		if (remain <= 0) return

		uni.chooseImage({
			count: remain,
			sizeType: ['compressed'],
			success: (res) => {
				images.value = images.value.concat(res.tempFilePaths || [])
			}
		})
	}

	function preview(index) {
		if (!images.value.length) return
		uni.previewImage({
			current: images.value[index],
			urls: images.value
		})
	}

	function removeImage(index) {
		uni.showActionSheet({
			itemList: ['删除这张图片'],
			success: () => {
				images.value.splice(index, 1)
			}
		})
	}

	async function uploadImages() {
		if (images.value.length === 0) {
			return []
		}

		const downloadUrls = []
		const category = 'POST_IMAGE'

		for (let i = 0; i < images.value.length; i++) {
			try {
				const filePath = images.value[i]
				const fileName = `post_${Date.now()}_${i}.jpg`

				const urlInfo = await postApi.getFileUrlInfo(fileName, category)

				await postApi.uploadFile(urlInfo.PresignedUrl, filePath)

				downloadUrls.push(urlInfo.DownloadUrl)
			} catch (error) {
				console.error(`上传第${i + 1}张图片失败:`, error)
				uni.showToast({
					title: `第${i + 1}张图片上传失败`,
					icon: 'none'
				})
				throw error
			}
		}

		return downloadUrls
	}

	async function publish() {
		if (!canPublish.value) return

		if (selectedTabIndex.value < 0) {
			uni.showToast({
				title: '请选择分区',
				icon: 'none'
			})
			return
		}

		uni.showLoading({ title: '发布中...' })

		try {
			const imageUrls = await uploadImages()

			const postData = {
				postType: getPostType.value,
				content: content.value,
				imageUrls: imageUrls
			}

			if (isReviewPost.value) {
				postData.cuisineId = cuisineId.value
				postData.merchantId = merchantId.value
				postData.score = score.value
			}

			if (isLostAndFoundPost.value) {
				postData.lostAndFoundType = lostAndFoundType.value
			}

			await postApi.createPost(postData)

			uni.hideLoading()
			uni.showToast({ title: '发布成功', icon: 'success' })
			setTimeout(() => {
				uni.switchTab({
					url: '/pages/post/post'
				})
			}, 350)
		} catch (error) {
			uni.hideLoading()
			console.error('发布失败:', error)
		}
	}
</script>

<template>
	<view class="page">
		<!-- 顶部导航 -->
		<view class="nav">
			<view class="nav-inner">
				<view class="nav-left" @tap="goBack">
					<img class="nav-icon" :src="backAvatar" />
				</view>
				<view class="nav-title">发新帖</view>

				<view class="nav-right">
					<view class="publish-btn" :class="{ disabled: !canPublish }" @tap="publish">
						发表
					</view>
				</view>
			</view>
		</view>

		<!-- 主体 -->
		<scroll-view class="main" scroll-y>
			<view class="editor">
				<textarea v-model="content" class="textarea" :maxlength="2000" placeholder="期待你的分享"
					placeholder-style="color:#c7c7c7;" :auto-height="true" />
			</view>

			<view class="media">
				<view class="grid">
					<!-- 已选图片 -->
					<view v-for="(url, idx) in images" :key="url" class="cell" @tap="preview(idx)"
						@longpress="removeImage(idx)">
						<image class="img" :src="url" mode="aspectFill" />
					</view>

					<!-- 添加 -->
					<view v-if="images.length < maxImages" class="cell add" @tap="chooseImages">
						<text class="plus">+</text>
					</view>
				</view>
				<!-- 分类选择 -->
				<view class="category" @tap="chooseCategory">
					<text class="category-label">选择分区</text>
					<view class="category-right">
						<text class="category-value" :class="{ placeholder: selectedTabIndex < 0 }">
							{{ selectedTabText }}
						</text>
						<text class="category-arrow">›</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<style scoped>
	.page {
		height: 100vh;
		background: #ffffff;
		display: flex;
		flex-direction: column;
	}

	/* 顶部导航 */
	.nav-inner {
		height: 88rpx;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-left,
	.nav-right {
		width: 160rpx;
		display: flex;
		align-items: center;
	}

	.nav-left {
		justify-content: flex-start;
	}

	.nav-right {
		justify-content: flex-end;
	}

	.nav-icon {
		width: 44rpx;
		height: 44rpx;
	}

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
		color: #111;
		font-weight: 500;
	}

	/* 发表按钮（截图里是浅蓝胶囊+灰字） */
	.publish-btn {
		padding: 12rpx 26rpx;
		border-radius: 999rpx;
		font-size: 28rpx;
		background: #38b6ff;
		color: #fff;
	}

	.publish-btn.disabled {
		background: #c5e9ff;
		color: #f3f6ff;
	}

	/* 主体 */
	.main {
		flex: 1;
	}

	/* 输入区：给个较大的最小高度，产生截图那种“大片空白” */
	.editor {
		padding: 26rpx 28rpx 0 28rpx;
	}

	.textarea {
		width: 100%;
		min-height: 560rpx;
		font-size: 32rpx;
		line-height: 1.55;
		color: #111;
	}

	/* 图片区：左下角一个 + 方块 */
	.media {
		padding: 0 28rpx 20rpx 28rpx;
	}

	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
	}

	.cell {
		width: 230rpx;
		height: 230rpx;
		border-radius: 14rpx;
		overflow: hidden;
	}

	.cell.add {
		background: #f3f3f3;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.plus {
		font-size: 84rpx;
		color: #8c8c8c;
		transform: translateY(-4rpx);
	}

	.img {
		width: 100%;
		height: 100%;
	}

	/* 分类区 */
	.category {
		margin: 30rpx 10rpx 30rpx 10rpx;
		padding: 22rpx 22rpx;
		border-radius: 16rpx;
		background: #fff;
		border: 1px solid #f1f1f1;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.category-label {
		font-size: 30rpx;
		color: #111;
	}

	.category-right {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.category-value {
		font-size: 28rpx;
		color: #111;
	}

	.category-value.placeholder {
		color: #bdbdbd;
	}

	.category-arrow {
		font-size: 34rpx;
		color: #bdbdbd;
		transform: translateY(-1rpx);
	}
</style>
