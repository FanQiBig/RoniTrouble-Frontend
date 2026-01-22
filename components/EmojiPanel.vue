<template>
	<view v-if="show" class="emoji-panel-container">
		<view class="emoji-panel" :class="{ 'panel-show': show }">
			<view class="panel-header">
				<scroll-view class="recent-scroll" scroll-x scroll-with-animation>
					<view class="recent-list">
						<view v-if="recentFaces.length > 0" class="recent-clear" @tap="handleClearRecent">
							<text class="clear-icon">🗑️</text>
						</view>
						<view v-for="id in recentFaces" :key="id" class="recent-item" @tap="handleSelect(id)">
							<image class="emoji-img" :src="getFaceUrl(id, false)" mode="aspectFit" @error="handleImageError" />
						</view>
						<view v-if="recentFaces.length === 0" class="recent-empty">
							<text class="empty-text">最近使用</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<scroll-view class="emoji-scroll" scroll-y scroll-with-animation>
				<view class="emoji-grid">
					<view v-for="face in allFaces" :key="face.id" class="emoji-item" @tap="handleSelect(face.id)">
						<image class="emoji-img" :src="getFaceUrl(face.id, false)" mode="aspectFit" @error="handleImageError" />
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { data, getFaceUrl } from '../utils/QQFace/index'
import { addRecentFace, getRecentFaces, clearRecentFaces } from '../utils/QQFace/utils'

defineOptions({
	name: 'EmojiPanel'
})

const props = defineProps({
	show: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['select'])
const allFaces = data.items || []
const recentFaces = ref([])

const loadRecentFaces = () => {
	recentFaces.value = getRecentFaces()
}

const handleSelect = (id) => {
	emit('select', id)
	addRecentFace(id)
	loadRecentFaces()
}

const handleClearRecent = () => {
	uni.showModal({
		title: '确认清除',
		content: '确定要清除最近使用的表情吗？',
		success: (res) => {
			if (res.confirm) {
				clearRecentFaces()
				loadRecentFaces()
				uni.showToast({
					title: '已清除',
					icon: 'success'
				})
			}
		}
	})
}

const handleImageError = (e) => {
}

watch(() => props.show, (newVal) => {
	if (newVal) {
		loadRecentFaces()
	}
})
</script>

<style scoped>
.emoji-panel-container {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 25;
}

.emoji-panel {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 600rpx;
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	transform: translateY(100%);
	transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.panel-show {
	transform: translateY(0);
}

.panel-header {
	flex-shrink: 0;
	background: #f8f9fa;
	border-bottom: 1px solid #eceff4;
	padding: 16rpx 24rpx;
}

.recent-scroll {
	width: 100%;
	white-space: nowrap;
}

.recent-list {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.recent-clear {
	width: 96rpx;
	height: 96rpx;
	border-radius: 12rpx;
	background: #f0f2f7;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.2s ease;
}

.recent-clear:active {
	transform: scale(0.9);
	background: #e8ebf0;
}

.clear-icon {
	font-size: 48rpx;
}

.recent-item {
	width: 96rpx;
	height: 96rpx;
	border-radius: 12rpx;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.2s ease;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.recent-item:active {
	transform: scale(0.85);
}

.recent-empty {
	flex: 1;
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-text {
	font-size: 24rpx;
	color: #8a8f99;
}

.emoji-scroll {
	flex: 1;
	overflow-y: auto;
	padding: 16rpx 24rpx 32rpx;
}

.emoji-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.emoji-item {
	width: 96rpx;
	height: 96rpx;
	border-radius: 12rpx;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.emoji-item:active {
	transform: scale(0.85);
}

.emoji-img {
	width: 72rpx;
	height: 72rpx;
	display: block;
}
</style>
