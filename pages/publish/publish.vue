<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { postApi } from '@/api/post.js'

const backAvatar = '/static/component/back.png'

const content = ref('')
const images = ref<string[]>([])
const maxImages = 9

const statusBarH = ref(0)
const safeBottom = ref(0)

const tabs = ref(["全部", "美食", "失物招领", "闲置推荐"])

// 存用户选中的分类（默认不选：-1）
const selectedTabIndex = ref(-1)

const selectedTabText = computed(() => {
	return selectedTabIndex.value >= 0 ? tabs.value[selectedTabIndex.value] : '请选择'
})

const postTypeMap = {
	"全部": "LIFE_STYLE",
	"美食": "REVIEW",
	"失物招领": "LOST_AND_FOUND",
	"闲置推荐": "TRADE"
}

const getPostType = computed(() => {
	if (selectedTabIndex.value >= 0) {
		const tabName = tabs.value[selectedTabIndex.value]
		return postTypeMap[tabName] || "LIFE_STYLE"
	}
	return "LIFE_STYLE"
})

function chooseCategory() {
	uni.showActionSheet({
		itemList: tabs.value,
		success: (res) => {
			selectedTabIndex.value = res.tapIndex
		}
	})
}

onMounted(() => {
	const sys = uni.getSystemInfoSync()
	statusBarH.value = sys.statusBarHeight || 0
	// 不同端字段不完全一致，做个兜底
	// @ts-ignore
	safeBottom.value = sys.safeAreaInsets?.bottom || 0
})

const canPublish = computed(() => {
	return content.value.trim().length > 0 || images.value.length > 0
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

function preview(index: number) {
	if (!images.value.length) return
	uni.previewImage({
		current: images.value[index],
		urls: images.value
	})
}

function removeImage(index: number) {
	uni.showActionSheet({
		itemList: ['删除这张图片'],
		success: () => {
			images.value.splice(index, 1)
		}
	})
}

function chooseLocation() {
	// H5 可能不支持 chooseLocation，这里简单兜底
	// #ifdef H5
	uni.showToast({ title: 'H5端可能不支持选位置', icon: 'none' })
	// #endif

	// #ifndef H5
	uni.chooseLocation({
		success: (res) => {
			uni.showToast({ title: res.name || '已选择位置', icon: 'none' })
		},
		fail: () => {
			uni.showToast({ title: '未选择位置', icon: 'none' })
		}
	})
	// #endif
}

function openEmoji() {
	uni.showToast({ title: '这里接入表情面板', icon: 'none' })
}
function openDoc() {
	uni.showToast({ title: '这里接入模板/文档', icon: 'none' })
}
function openPen() {
	uni.showToast({ title: '这里接入涂鸦/编辑', icon: 'none' })
}
function openBroadcast() {
	uni.showToast({ title: '这里接入话题/广播', icon: 'none' })
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

		await postApi.createPost({
			postType: getPostType.value,
			content: content.value,
			imageUrls: imageUrls
		})

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