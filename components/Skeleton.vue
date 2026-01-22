<template>
	<view class="skeleton">
		<view class="skeleton-header">
			<view class="skeleton-avatar"></view>
			<view class="skeleton-info">
				<view class="skeleton-line skeleton-name"></view>
				<view class="skeleton-line skeleton-email"></view>
				<view class="skeleton-line skeleton-brief"></view>
			</view>
		</view>
		<view class="skeleton-stats">
			<view v-for="i in 3" :key="i" class="skeleton-stat">
				<view class="skeleton-circle"></view>
				<view class="skeleton-line skeleton-stat-value"></view>
				<view class="skeleton-line skeleton-stat-label"></view>
			</view>
		</view>
		<view class="skeleton-card">
			<view class="skeleton-line skeleton-title"></view>
			<view v-for="i in 4" :key="i" class="skeleton-row">
				<view class="skeleton-circle skeleton-small"></view>
				<view class="skeleton-line skeleton-row-label"></view>
				<view class="skeleton-line skeleton-row-value"></view>
			</view>
		</view>
	</view>
</template>

<script setup>
defineOptions({
	name: 'Skeleton'
})
</script>

<style scoped>
.skeleton {
	padding: 16rpx;
}

.skeleton-header {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx;
	background: linear-gradient(135deg, #0099FF 0%, #33B5FF 100%);
	border-radius: 24rpx;
	margin-bottom: 18rpx;
}

.skeleton-avatar {
	width: 112rpx;
	height: 112rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.3);
	flex-shrink: 0;
	animation: shimmer 1.5s infinite;
}

.skeleton-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.skeleton-line {
	background: rgba(255, 255, 255, 0.3);
	border-radius: 8rpx;
	animation: shimmer 1.5s infinite;
}

.skeleton-name {
	width: 60%;
	height: 32rpx;
}

.skeleton-email {
	width: 80%;
	height: 26rpx;
}

.skeleton-brief {
	width: 70%;
	height: 26rpx;
}

.skeleton-stats {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 16rpx;
	margin-top: 20rpx;
}

.skeleton-stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.skeleton-circle {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.3);
	animation: shimmer 1.5s infinite;
}

.skeleton-small {
	width: 28rpx;
	height: 28rpx;
}

.skeleton-stat-value {
	width: 40rpx;
	height: 36rpx;
}

.skeleton-stat-label {
	width: 40rpx;
	height: 24rpx;
}

.skeleton-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 24rpx;
	margin-top: 18rpx;
}

.skeleton-title {
	width: 40%;
	height: 30rpx;
	margin-bottom: 20rpx;
	background: #eef1f6;
}

.skeleton-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 12rpx 0;
}

.skeleton-row-label {
	width: 100rpx;
	height: 26rpx;
	background: #eef1f6;
}

.skeleton-row-value {
	flex: 1;
	height: 26rpx;
	background: #eef1f6;
}

@keyframes shimmer {
	0% {
		opacity: 0.3;
	}
	50% {
		opacity: 0.6;
	}
	100% {
		opacity: 0.3;
	}
}
</style>
