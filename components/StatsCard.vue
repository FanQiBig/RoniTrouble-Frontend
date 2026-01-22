<template>
	<view class="stats-card">
		<view class="stat-item" @tap="handleTap('soso')">
			<text class="stat-value">{{ stats.sosoCount || 0 }}</text>
			<text class="stat-label">动态</text>
		</view>
		<view class="stat-item" @tap="handleTap('friend')">
			<text class="stat-value">{{ stats.friendCount || 0 }}</text>
			<text class="stat-label">好友</text>
		</view>
		</view>
</template>

<script setup>
defineOptions({
	name: 'StatsCard'
})

const props = defineProps({
	stats: {
		type: Object,
		default: () => ({
			sosoCount: 0,
			friendCount: 0
		})
	}
})

const emit = defineEmits(['tap'])

const handleTap = (type) => {
	emit('tap', type)
}
</script>

<style scoped>
.stats-card {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 16rpx;
	margin-top: 20rpx;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 24rpx;
	border-radius: 12rpx;
	transition: all 0.2s ease;
}

.stat-item:active {
	transform: scale(0.95);
	background: rgba(255, 255, 255, 0.2);
}

.stat-icon {
	font-size: 32rpx;
	line-height: 1;
}

.stat-value {
	font-size: 36rpx;
	font-weight: 700;
	color: #ffffff;
	line-height: 1;
}

.stat-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1;
}
</style>
