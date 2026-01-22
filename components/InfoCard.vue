<template>
	<view v-if="hasDetails" class="info-card">
		<view class="card-header">
			<text class="card-title">个人资料</text>
			<view class="edit-btn" @tap="handleEdit">
				<text class="edit-icon">✎</text>
				<text class="edit-text">编辑</text>
			</view>
		</view>
		<view class="card-body">
			<view v-if="profile.gender" class="info-row">
				<text class="info-label">性别</text>
				<text class="info-value">{{ genderText(profile.gender) }}</text>
			</view>
			<view v-if="profile.birthday" class="info-row">
				<text class="info-label">生日</text>
				<text class="info-value">{{ formatBirthday(profile.birthday) }}</text>
			</view>
			<view v-if="profile.mbti" class="info-row">
				<text class="info-label">MBTI</text>
				<text class="info-value">{{ profile.mbti }}</text>
			</view>
			<view v-if="profile.occupation" class="info-row">
				<text class="info-label">职业</text>
				<text class="info-value">{{ profile.occupation }}</text>
			</view>
			<view v-if="profile.characters && profile.characters.length" class="info-row">
				<text class="info-label">性格</text>
				<view class="tags">
					<text v-for="(tag, index) in profile.characters" :key="index" class="tag">{{ tag }}</text>
				</view>
			</view>
			<view v-if="profile.interests && profile.interests.length" class="info-row">
				<text class="info-label">兴趣</text>
				<view class="tags">
					<text v-for="(tag, index) in profile.interests" :key="index" class="tag">{{ tag }}</text>
				</view>
			</view>
			<view v-if="profile.socialIntents && profile.socialIntents.length" class="info-row">
				<text class="info-label">社交意向</text>
				<view class="tags">
					<text v-for="(tag, index) in profile.socialIntents" :key="index" class="tag">{{ tag }}</text>
				</view>
			</view>
		</view>
		</view>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({
	name: 'InfoCard'
})

const props = defineProps({
	profile: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['edit'])

const hasDetails = computed(() => {
	const p = props.profile || {}
	return !!(
		p.gender ||
		p.birthday ||
		p.mbti ||
		p.occupation ||
		(p.characters && p.characters.length) ||
		(p.interests && p.interests.length) ||
		(p.socialIntents && p.socialIntents.length)
	)
})

const genderText = (gender) => {
	if (gender === 'MALE') return '男'
	if (gender === 'FEMALE') return '女'
	return gender
}

const formatBirthday = (birthday) => {
	if (!birthday) return ''
	if (birthday.length >= 3) {
		const y = String(birthday[0])
		const mRaw = String(birthday[1])
		const dRaw = String(birthday[2])
		const m = mRaw.length === 1 ? '0' + mRaw : mRaw
		const d = dRaw.length === 1 ? '0' + dRaw : dRaw
		if (y && m && d) return y + '-' + m + '-' + d
	}
	return birthday
}

const handleEdit = () => {
	emit('edit')
}
</script>

<style scoped>
.info-card {
	background: #ffffff;
	border-radius: 24rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
	padding: 24rpx;
	margin-top: 18rpx;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 16rpx;
	border-bottom: 1px solid #eef1f6;
}

.card-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1f2024;
}

.edit-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 8rpx 16rpx;
	border-radius: 999px;
	background: linear-gradient(135deg, #f2f4f7 0%, #e8ebf0 100%);
	transition: all 0.2s ease;
}

.edit-btn:active {
	transform: scale(0.95);
}

.edit-icon {
	font-size: 24rpx;
	color: #1f2024;
}

.edit-text {
	font-size: 24rpx;
	color: #1f2024;
}

.card-body {
	padding-top: 16rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.info-row {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
	padding: 12rpx 0;
}

.info-icon {
	font-size: 28rpx;
	line-height: 1;
	flex-shrink: 0;
	margin-top: 2rpx;
}

.info-label {
	font-size: 26rpx;
	color: #556277;
	flex-shrink: 0;
	min-width: 100rpx;
}

.info-value {
	flex: 1;
	font-size: 26rpx;
	color: #1f2024;
	text-align: right;
	word-break: break-all;
}

.tags {
	flex: 1;
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
	justify-content: flex-end;
}

.tag {
	padding: 6rpx 16rpx;
	font-size: 24rpx;
	color: #0099FF;
	background: linear-gradient(135deg, rgba(0, 153, 255, 0.1) 0%, rgba(51, 181, 255, 0.1) 100%);
	border-radius: 999px;
}
</style>
