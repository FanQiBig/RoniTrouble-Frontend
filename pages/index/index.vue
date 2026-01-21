<script setup>
import {
	ref,
	computed,
	onMounted
} from 'vue'
import { authApi } from '@/api/auth.js'
import { userApi } from '@/api/user.js'

const statusBarH = ref(0)
onMounted(() => {
	const sys = uni.getSystemInfoSync()
	statusBarH.value = sys.statusBarHeight || 0

	const token = uni.getStorageSync('token')
	if (token) {
		routeAfterLogin()
	}
})

const mode = ref('login')
const account = ref('')
const password = ref('')
const confirmPwd = ref('')
const showPwd = ref(false)
const showPwd2 = ref(false)
const loading = ref(false)
const role = ref('student')

const roleOptions = [
	{ value: 'student', label: '我是学生', icon: '/static/register/student.png' },
	{ value: 'merchant', label: '我是商家', icon: '/static/register/merchant.png' }
]

const titleText = computed(() => (mode.value === 'login' ? '您好，欢迎登录！' : '您好，欢迎注册！'))
const btnText = computed(() => (mode.value === 'login' ? '登录' : '注册'))

const canSubmit = computed(() => {
	if (loading.value) return false

	if (mode.value === 'login') {
		return account.value.trim().length > 0 && password.value.trim().length >= 6
	} else {
		return (
			account.value.trim().length >= 3 &&
			password.value.trim().length >= 6 &&
			confirmPwd.value.trim().length >= 6 &&
			password.value === confirmPwd.value
		)
	}
})

function goPost() {
	uni.switchTab({ url: '/pages/post/post' })
}

function goEdit() {
	uni.redirectTo({ url: '/pages/edit/edit' })
}

async function routeAfterLogin() {
	try {
		const existed = await userApi.isUserInfoByIdExisted()
		if (existed) {
			goPost()
		} else {
			goEdit()
		}
	} catch (error) {
		console.error('判断用户信息失败:', error)
		goPost()
	}
}

function switchMode() {
	mode.value = mode.value === 'login' ? 'register' : 'login'
	password.value = ''
	confirmPwd.value = ''
}

function selectRole(value) {
	role.value = value
}

async function onSubmit() {
	if (!canSubmit.value) {
		if (mode.value === 'login') {
			uni.showToast({
				title: '请输入邮箱和密码',
				icon: 'none'
			})
		} else {
			if (account.value.trim().length < 3) {
				uni.showToast({
					title: '请输入邮箱',
					icon: 'none'
				})
			} else if (password.value.trim().length < 6) {
				uni.showToast({
					title: '密码至少 6 位',
					icon: 'none'
				})
			} else if (password.value !== confirmPwd.value) {
				uni.showToast({
					title: '两次密码不一致',
					icon: 'none'
				})
			} else {
				uni.showToast({
					title: '请完善信息',
					icon: 'none'
				})
			}
		}
		return
	}

	loading.value = true
	try {
		if (mode.value === 'login') {
			const res = await authApi.login(
				account.value,
				password.value,
				true
			)
			uni.setStorageSync('token', res.token)
			uni.setStorageSync('email', res.email)
			uni.setStorageSync('role', res.role)
			const loginUserId = res.userId ?? res.userID ?? res.id
			if (loginUserId !== undefined && loginUserId !== null && loginUserId !== '') {
				uni.setStorageSync('user_id', String(loginUserId))
			}
			uni.showToast({
				title: '登录成功',
				icon: 'success'
			})
			setTimeout(() => routeAfterLogin(), 250)
		} else {
			if (role.value === 'student') {
				await authApi.registerStudent(account.value, password.value)
			} else if (role.value === 'merchant') {
				await authApi.registerMerchant(account.value, password.value, '', '', '')
			} else {
				await authApi.register(account.value, password.value)
			}
			uni.showToast({
				title: '注册成功，请登录',
				icon: 'success'
			})
			mode.value = 'login'
			password.value = ''
			confirmPwd.value = ''
		}
	} catch (error) {
		console.error('操作失败:', error)
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<view class="page">
		<view :style="{ height: statusBarH + 'px' }"></view>

		<view class="bg">
			<view class="big-circle blue"></view>
			<view class="big-circle yellow"></view>
		</view>

		<view class="center">
			<view class="card">
				<view class="dots">
					<view class="dot d1"></view>
					<view class="dot d2"></view>
				</view>

				<text class="title">{{ titleText }}</text>

				<view v-if="mode === 'register'" class="role-section">
					<text class="role-title">请选择身份</text>
					<view class="role-list">
						<view v-for="r in roleOptions" :key="r.value" class="role-item"
							:class="{ active: role === r.value }" @tap="selectRole(r.value)">
							<image class="role-img" :src="r.icon" mode="aspectFit" />
							<text class="role-text">{{ r.label }}</text>
						</view>
					</view>
				</view>

				<view class="input-wrap">
					<input class="input" v-model="account" :placeholder="mode === 'login' ? '请输入邮箱' : '请填写您的邮箱'"
						placeholder-class="ph" />
				</view>

				<view class="input-wrap">
					<input class="input" v-model="password" :password="!showPwd"
						:placeholder="mode === 'login' ? '请输入密码' : '请填写您的密码（至少6位）'" placeholder-class="ph" />
				</view>

				<view v-if="mode === 'register'" class="input-wrap">
					<input class="input" v-model="confirmPwd" :password="!showPwd2" placeholder="确认密码"
						placeholder-class="ph" />
				</view>

				<view class="btn" :class="{ disabled: !canSubmit }" @tap="onSubmit">
					<text v-if="!loading">{{ btnText }}</text>
					<text v-else>处理中...</text>
				</view>

				<view class="links">
					<view class="sep"></view>
					<view class="row">
						<text class="link gray">{{ mode === 'login' ? '没有账号？' : '已有账号？' }}</text>
						<text class="link blue" @tap="switchMode">{{ mode === 'login' ? '去注册' : '去登录' }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
.page {
	height: 100vh;
	background: #dfeeff;
	position: relative;
	overflow: hidden;
}

.bg {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.big-circle {
	position: absolute;
	border-radius: 9999rpx;
	opacity: 0.7;
}

.big-circle.blue {
	width: 820rpx;
	height: 820rpx;
	left: -360rpx;
	top: -240rpx;
	background: rgba(255, 255, 255, 0.55);
}

.big-circle.yellow {
	width: 900rpx;
	height: 900rpx;
	right: -460rpx;
	top: -260rpx;
	background: rgba(255, 244, 214, 0.6);
}

.center {
	height: calc(100vh - 60rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 46rpx;
	position: relative;
	z-index: 2;
}

.card {
	width: 100%;
	max-width: 680rpx;
	background: #fff;
	border-radius: 26rpx;
	padding: 44rpx 36rpx 36rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.08);
}

.dots {
	display: flex;
	gap: 16rpx;
	margin-bottom: 18rpx;
}

.dot {
	width: 50rpx;
	height: 50rpx;
	border-radius: 999rpx;
}

.d1 {
	background: #bfefff;
}

.d2 {
	background: #ffe27a;
}

.title {
	display: block;
	font-size: 40rpx;
	font-weight: 900;
	color: #111;
	margin-bottom: 26rpx;
}

.role-section {
	margin-top: -6rpx;
}

.role-title {
	display: block;
	font-size: 26rpx;
	color: #8b95a8;
	font-weight: 700;
	margin-bottom: 14rpx;
}

.role-list {
	display: flex;
	gap: 16rpx;
}

.role-item {
	flex: 1;
	height: 150rpx;
	border-radius: 20rpx;
	border: 2px solid #efefef;
	background: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
}

.role-item.active {
	border-color: #2fb2ff;
	box-shadow: 0 10rpx 24rpx rgba(47, 178, 255, 0.18);
}

.role-img {
	width: 100rpx;
	height: 100rpx;
}

.role-text {
	font-size: 24rpx;
	color: #333;
	font-weight: 800;
}

.input-wrap {
	height: 98rpx;
	border-radius: 999rpx;
	border: 1px solid #efefef;
	background: #fff;
	display: flex;
	align-items: center;
	padding: 0 28rpx;
	margin-top: 22rpx;
}

.input {
	flex: 1;
	height: 98rpx;
	font-size: 30rpx;
	color: #111;
}

.ph {
	color: #c8c8c8;
}

.btn {
	margin-top: 34rpx;
	height: 98rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #9bce44 0%, #39a9fe 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 34rpx;
	letter-spacing: 4px;
	font-weight: 600;
	color: #f0f7ff;
}

.btn.disabled {
	opacity: 0.55;
}

.links {
	margin-top: 22rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18rpx;
}

.sep {
	width: 100%;
	height: 1px;
	background: #f2f2f2;
}

.row {
	display: flex;
	gap: 10px;
	align-items: center;
	justify-content: center;
}

.link {
	font-size: 26rpx;
}

.link.gray {
	color: #b2b2b2;
}

.link.blue {
	color: #2fb2ff;
	font-weight: 800;
}
</style>
