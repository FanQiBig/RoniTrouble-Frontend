<script setup>
	import {
		ref,
		computed,
		onMounted,
		nextTick
	} from 'vue'

	const statusBarH = ref(0)
	const safeBottom = ref(0)
	const aiAvatar = '/static/ai/ai.png'

	onMounted(() => {
		const sys = uni.getSystemInfoSync()
		statusBarH.value = sys.statusBarHeight || 0
		// #ifdef APP-PLUS
		safeBottom.value = sys.safeAreaInsets?.bottom || 0
		// #endif
		// #ifndef APP-PLUS
		safeBottom.value = 0
		// #endif

		// 初次滚到底
		nextTick(() => scrollToBottom())
	})

	const theme = {
		blue: '#2FB2FF',
		blueSoft: 'rgba(47,178,255,0.12)'
	}

	const botName = ref('肉包包AI助手')
	const placeholder = ref('想问点什么…')
	const input = ref('')

	const chips = ref([
		'帮我推荐周末去哪玩',
		'给我写一段文案',
		'总结一下这段话',
		'给我出个学习计划'
	])

	const suggestions = ref([
		'推荐一下周末可以去的展览',
		'帮我规划周末的玩乐行程',
		'推荐几部高评分的电影',
		'我想做一个学生项目选题'
	])

	/** 消息列表 */
	const msgs = ref([{
		id: Date.now(),
		role: 'ai',
		type: 'welcome',
		text: `Hi，我是你的 AI 助手 ${botName.value}。\n我可以帮你做学习/文案/规划，也能陪你聊天～`
	}])

	const scrollInto = ref('m-last')

	const canSend = computed(() => input.value.trim().length > 0 && !sending.value)

	function goBack() {
		uni.navigateBack()
	}

	function tapChip(t) {
		input.value = t
		nextTick(() => {
			// 可选：点了直接发
			// send()
		})
	}

	function tapSuggestion(t) {
		input.value = t
		nextTick(() => send())
	}

	function scrollToBottom() {
		scrollInto.value = 'm-last-' + Date.now()
	}

	const sending = ref(false)

	// 打字机参数（想更快就调小 interval）
	const typingInterval = 28

	function fakeAIReply(userText) {
		const replys = [
			`收到～你想聊「${userText}」对吧？我可以先给你一个思路：\n1) 目标是什么\n2) 约束条件有哪些\n3) 给你 2-3 个可选方案`,
			`我懂！我先问你一个小问题：你更在意“效果”还是“省时间”？\n你回我一句我就能更精准～`,
			`安排！我先给你一个简洁版本，如果你想要更详细的我也能继续展开。`
		]
		return replys[Math.floor(Math.random() * replys.length)]
	}

	function addMessage(role, text, type = 'text') {
		msgs.value.push({
			id: Date.now() + Math.random(),
			role,
			type, // text | typing | welcome
			text
		})
		nextTick(() => scrollToBottom())
	}

	function replaceMessage(id, patch) {
		const idx = msgs.value.findIndex(m => m.id === id)
		if (idx !== -1) msgs.value[idx] = {
			...msgs.value[idx],
			...patch
		}
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	async function typewriter(id, fullText) {
		// 逐字输出（支持换行）
		let out = ''
		for (let i = 0; i < fullText.length; i++) {
			out += fullText[i]
			replaceMessage(id, {
				text: out
			})
			// 每次更新后滚动到底部
			if (i % 3 === 0) nextTick(() => scrollToBottom())
			await sleep(typingInterval)
		}
		nextTick(() => scrollToBottom())
	}

	async function send() {
		if (!canSend.value) return

		const text = input.value.trim()
		input.value = ''

		// 用户消息
		addMessage('user', text)

		// AI 思考气泡（动画三点）
		sending.value = true
		const thinkingId = Date.now() + Math.random()
		addMessage('ai', '正在思考…', 'typing')

		// 模拟“思考时间”
		await sleep(650)

		// 把思考气泡改成空文本（准备打字机输出）
		replaceMessage(thinkingId, {
			type: 'text',
			text: ''
		})

		// AI 的最终回复
		const reply = fakeAIReply(text)

		// 打字机输出到同一个气泡
		await typewriter(thinkingId, reply)

		sending.value = false
	}
</script>

<template>
	<view class="page">
		<!-- 顶部导航-->
		<view class="nav" :style="{ paddingTop: statusBarH + 'px' }">
			<view class="nav-inner">
				<view class="back" @tap="goBack">
					<text class="back-ico">‹</text>
				</view>

				<view class="nav-mid">
					<text class="nav-title">{{ botName }}</text>
					<text class="nav-sub">AI 对话</text>
				</view>

				<view class="nav-right"></view>
			</view>
		</view>

		<!-- 主体滚动 -->
		<scroll-view class="content" scroll-y :scroll-into-view="scrollInto" :show-scrollbar="false">
			<!-- 欢迎卡 -->
			<view class="welcome-card">
				<view class="welcome-top">
					<view class="hi-left">
						<text class="hi">Hi</text>
						<text class="hi-title">我是你的AI推荐官</text>
						<text class="hi-desc">
							我可以帮你推荐内容、做规划、写文案，也能陪你聊天。
						</text>
					</view>

					<view class="glow">
						<image class="ai-img" :src="aiAvatar" mode="aspectFit"/>
					</view>
				</view>

				<view class="suggest-list">
					<view class="suggest-item" v-for="s in suggestions" :key="s" @tap="tapSuggestion(s)">
						<text class="s-txt">{{ s }}</text>
						<text class="s-arrow">›</text>
					</view>
				</view>

				<view class="refresh">
					<text class="refresh-ico">↻</text>
					<text class="refresh-txt">换一换</text>
				</view>
			</view>

			<!-- 消息列表 -->
			<view class="msg-list">
				<view v-for="m in msgs" :key="m.id" class="msg-row" :class="{ right: m.role === 'user' }">
					<!-- 头像 -->
					<view class="avatar" v-if="m.role === 'ai'">
						<text class="av">AI</text>
					</view>

					<!-- 气泡 -->
					<view class="bubble" :class="{ user: m.role === 'user', typing: m.type === 'typing' }">
						<text class="bubble-text">{{ m.text }}</text>

						<view v-if="m.type === 'typing'" class="typing-row">
							<view class="dots">
								<view class="dot"></view>
								<view class="dot"></view>
								<view class="dot"></view>
							</view>
						</view>
					</view>

					<view class="avatar user-av" v-if="m.role === 'user'">
						<text class="av">我</text>
					</view>
				</view>

				<!-- 占位用于 scrollInto -->
				<view :id="scrollInto" style="height: 1px;"></view>
			</view>

			<view :style="{ height: (140 + safeBottom) + 'px' }"></view>
		</scroll-view>

		<!-- 底部输入栏 -->
		<view class="composer" :style="{ paddingBottom: safeBottom + 'px' }">
			<view class="composer-inner">
				<view class="input-wrap">
					<input class="composer-input" v-model="input" :placeholder="placeholder" placeholder-class="ph"
						confirm-type="send" @confirm="send" />
				</view>

				<view class="send" :class="{ off: !canSend }" @tap="send">
					<text class="send-ico">↑</text>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f1f8fc;
	}

	/* 顶部导航 */
	.nav {
		background: #fff;
		border-bottom: 2rpx solid #6b6b6b;
		margin-bottom: 20px;
	}

	.nav-inner {
		height: 96rpx;
		display: flex;
		align-items: center;
		padding: 0 22rpx;
		justify-content: space-between;
	}

	.back {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
	}

	.back-ico {
		font-size: 56rpx;
		color: #111;
		opacity: 0.75;
		transform: translateY(-2rpx);
	}

	.nav-mid {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rpx;
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: 900;
		color: #111;
	}

	.nav-sub {
		font-size: 22rpx;
		color: #7d8ea6;
	}

	.nav-right {
		width: 80rpx;
		display: flex;
		justify-content: flex-end;
	}

	/* 欢迎卡 */
	.welcome-card {
		margin: 18rpx 34rpx 10rpx;
		background: #fff;
		border-radius: 26rpx;
		box-shadow: 0 18rpx 50rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.welcome-top {
		padding: 26rpx 22rpx 16rpx;
		display: flex;
		justify-content: space-between;
		gap: 14rpx;
	}

	.hi-left {
		flex: 1;
		min-width: 0;
	}

	.hi {
		font-size: 56rpx;
		font-weight: 900;
		color: #111;
		line-height: 1;
	}

	.hi-title {
		display: block;
		margin-top: 8rpx;
		font-size: 32rpx;
		font-weight: 900;
		color: #111;
	}

	.hi-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #6b6b6b;
		line-height: 1.6;
	}

	.glow{
	  width: 280rpx;
	  height: 280rpx;
	  border-radius: 999rpx;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}
	
	.ai-img{
	  width: 260rpx;   /* ✅ 必须给尺寸 */
	  height: 260rpx;
	}

	/* 推荐列表 */
	.suggest-list {
		padding: 8rpx 22rpx 10rpx;
	}

	.suggest-item {
		height: 88rpx;
		border-radius: 18rpx;
		background: #fff;
		border: 1px solid #f1f1f1;
		padding: 0 18rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12rpx;
	}

	.s-txt {
		font-size: 28rpx;
		color: #111;
		font-weight: 700;
	}

	.s-arrow {
		font-size: 36rpx;
		color: #c7c7c7;
	}

	/* 换一换 */
	.refresh {
		padding: 12rpx 22rpx 18rpx;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8rpx;
	}

	.refresh-ico {
		font-size: 26rpx;
		color: #8fa3bd;
	}

	.refresh-txt {
		font-size: 24rpx;
		color: #8fa3bd;
		font-weight: 700;
	}

	/* 消息列表 */
	.msg-list {
		padding: 10rpx 22rpx 0;
	}

	.msg-row {
		display: flex;
		align-items: flex-end;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.msg-row.right {
		justify-content: flex-end;
	}

	.avatar {
		width: 62rpx;
		height: 62rpx;
		border-radius: 999rpx;
		background: rgba(47, 178, 255, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-av {
		background: rgba(0, 0, 0, 0.06);
	}

	.av {
		font-size: 24rpx;
		font-weight: 900;
		color: #2FB2FF;
	}

	.msg-row.right .av {
		color: #111;
	}

	/* 气泡 */
	.bubble {
		max-width: 520rpx;
		background: #fff;
		border-radius: 22rpx;
		padding: 18rpx 18rpx;
		border: 1px solid #f1f1f1;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
	}

	.bubble.user {
		background: rgba(47, 178, 255, 0.14);
		border: 1px solid rgba(47, 178, 255, 0.18);
	}

	.bubble-text {
		font-size: 28rpx;
		color: #111;
		line-height: 1.6;
		white-space: pre-line;
	}

	.bubble.typing {
		padding-bottom: 12rpx;
	}

	/* typing dots */
	.typing-row {
		margin-top: 10rpx;
	}

	.dots {
		display: flex;
		gap: 10rpx;
	}

	.dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 999rpx;
		background: rgba(47, 178, 255, 0.55);
		animation: bounce 1s infinite ease-in-out;
	}

	.dot:nth-child(2) {
		animation-delay: 0.15s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes bounce {

		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}

		40% {
			transform: translateY(-6rpx);
			opacity: 1;
		}
	}

	/* 底部输入栏 */
	.composer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		padding: 12rpx 22rpx 10rpx;
	}

	.composer-inner {
		height: 104rpx;
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	/* 中间输入框：白底 + 细边框 */
	.input-wrap {
		flex: 1;
		height: 76rpx;
		border-radius: 999rpx;
		background: #ffffff;
		border: 2px solid #eeeeee;
		padding: 0 22rpx;
		display: flex;
		align-items: center;
	}

	.composer-input {
		flex: 1;
		height: 76rpx;
		font-size: 28rpx;
		color: #111;
	}

	.ph {
		color: #b8b8b8;
	}

	/* 右侧发送按钮：圆形居中 */
	.send {
		width: 76rpx;
		height: 76rpx;
		border-radius: 999rpx;
		background: rgba(47, 178, 255, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.send.off {
		opacity: 0.45;
	}

	.send-ico {
		font-size: 34rpx;
		color: #fff;
		transform: translateY(-2rpx);
	}
</style>
