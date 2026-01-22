<script setup>
	import {
		ref,
		computed,
		onMounted,
		nextTick,
		getCurrentInstance
	} from "vue";

	import {
		postApi
	} from "@/api/post.js";
	import {
		POST_TABS
	} from "@/utils/postTabs.js";

	const tabs = ref([...POST_TABS]);
	const tabTypeMap = {
		生活分享: "LIFE_STYLE",
		美食推荐: "REVIEW",
		美食: "REVIEW",
		寻物招领: "LOST_AND_FOUND",
		闲置交易: "TRADE",
	};
	const activeTab = ref(0);
	const isDrawerOpen = ref(false);
	const from = ref(0);
	const pageSize = ref(10);
	const posts = ref([]);
	const hasMore = ref(true);
	const loading = ref(false);
	const tabsScrollLeft = ref(0);
	const tabsScrollInto = ref("");
	const tabsWrapWidth = ref(0);
	const tabsScrollWidth = ref(0);
	const tabRects = ref([]);

	function pad2(value) {
		return String(value).padStart(2, '0');
	}

	function parsePostDate(value) {
		if (!value && value !== 0) return null;
		if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
		if (typeof value === 'number') {
			if (!Number.isFinite(value)) return null;
			const ts = value < 1e11 ? value * 1000 : value;
			const date = new Date(ts);
			return isNaN(date.getTime()) ? null : date;
		}
		if (typeof value !== 'string') return null;
		const text = value.trim();
		if (!text) return null;
		if (/^\d{2}:\d{2}$/.test(text) || /^\d{2}-\d{2}$/.test(text)) return null;
		if (/^\d+$/.test(text)) {
			const num = Number(text);
			if (!Number.isFinite(num)) return null;
			const ts = text.length <= 10 ? num * 1000 : num;
			const date = new Date(ts);
			return isNaN(date.getTime()) ? null : date;
		}
		let match = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
		if (match) {
			const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
			return isNaN(date.getTime()) ? null : date;
		}
		match = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
		if (match) {
			const date = new Date(
				Number(match[1]),
				Number(match[2]) - 1,
				Number(match[3]),
				Number(match[4]),
				Number(match[5]),
				Number(match[6] || 0)
			);
			return isNaN(date.getTime()) ? null : date;
		}
		const parsed = new Date(text);
		if (!isNaN(parsed.getTime())) return parsed;
		const alt = new Date(text.replace(/-/g, '/').replace('T', ' '));
		return isNaN(alt.getTime()) ? null : alt;
	}

	function formatPostTime(value) {
		if (value === null || value === undefined || value === '') return '';
		const raw = String(value).trim();
		if (/^\d{2}:\d{2}$/.test(raw) || /^\d{2}-\d{2}$/.test(raw) || /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
			return raw;
		}
		const date = parsePostDate(value);
		if (!date) return raw;
		const now = new Date();
		const isSameYear = date.getFullYear() === now.getFullYear();
		const isSameDay = isSameYear &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate();
		if (isSameDay) {
			return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
		}
		if (isSameYear) {
			return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
		}
		return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
	}

	function normalizePost(item) {
		const post = item?.post ?? item ?? {};
		const postId = item?.postId ?? post?.postId ?? post?.id ?? item?.id;
		const rawUserInfo = item?.userInfo ?? item?.user ?? post?.user ?? item?.author ?? post?.author ?? {};
		const normalizedUserInfo = {
			...rawUserInfo,
			avatarUrl: rawUserInfo?.avatarUrl ?? rawUserInfo?.avtarUrl ?? rawUserInfo?.avatar ?? '',
			nickname: rawUserInfo?.nickname ?? rawUserInfo?.name ?? ''
		};
		const replyList = (item?.replyList ?? post?.replyList ?? item?.commentList ?? []).map((r) => ({
			...r,
			user: r?.user ?? r?.author ?? {},
			text: r?.text ?? r?.content ?? r?.comment ?? ''
		}));

		return {
			...item,
			post,
			id: item?.id ?? postId,
			postId,
			postType: item?.postType ?? post?.postType,
			user: normalizedUserInfo,
			userInfo: normalizedUserInfo,
			content: item?.content ?? post?.content ?? '',
			images: item?.images ?? post?.images ?? post?.imageList ?? post?.imageUrls ?? [],
			time: item?.time ?? post?.time ?? post?.createTime ?? post?.createdAt ?? '',
			likes: item?.likes ?? post?.likeCount ?? item?.likeCount ?? 0,
			comments: item?.comments ?? post?.commentCount ?? item?.commentCount ?? 0,
			shares: item?.shares ?? post?.shareCount ?? item?.shareCount ?? 0,
			liked: item?.liked ?? post?.liked ?? false,
			replyList
		};
	}

	async function loadPosts() {
		if (loading.value || !hasMore.value) return;

		loading.value = true;
		try {
			const res = await postApi.getHomePage(from.value, pageSize.value);
			if (res.posts && res.posts.length > 0) {
				posts.value.push(...res.posts.map(normalizePost));
				from.value += res.posts.length;
				if (res.posts.length < pageSize.value) {
					hasMore.value = false;
				}
			} else {
				hasMore.value = false;
			}
		} catch (error) {
			console.error('加载帖子失败:', error);
		} finally {
			loading.value = false;
		}
	}

	onMounted(() => {
		loadPosts();
		nextTick(() => measureTabs());
	});

	function onTabsScroll(e) {
		tabsScrollLeft.value = e.detail?.scrollLeft || 0;
	}

	function measureTabs() {
		const instance = getCurrentInstance()?.proxy;
		if (!instance) return;
		const query = uni.createSelectorQuery().in(instance);
		query.select(".tabs").boundingClientRect();
		query.selectAll(".tab").boundingClientRect();
		query.exec((res) => {
			const wrap = res?.[0];
			const tabs = res?.[1];
			if (!wrap || !tabs || !tabs.length) return;
			const baseLeft = tabs[0].left || 0;
			tabRects.value = tabs.map((t) => ({
				left: Math.max(0, t.left - baseLeft),
				width: t.width || 0
			}));
			tabsWrapWidth.value = wrap.width || 0;
			const last = tabRects.value[tabRects.value.length - 1];
			tabsScrollWidth.value = last ? last.left + last.width : 0;
		});
	}

	function centerTab(i) {
		if (!tabRects.value.length || !tabsWrapWidth.value) {
			measureTabs();
			nextTick(() => centerTab(i));
			return;
		}
		const rect = tabRects.value[i];
		if (!rect) return;
		let target = rect.left + rect.width / 2 - tabsWrapWidth.value / 2;
		const max = Math.max(0, tabsScrollWidth.value - tabsWrapWidth.value);
		target = Math.min(max, Math.max(0, target));
		tabsScrollLeft.value = Math.round(target);
	}

	function onTabClick(i) {
		activeTab.value = i;
		tabsScrollInto.value = `tab-${i}`;
		measureTabs();
		nextTick(() => centerTab(i));
	}

	const filteredPosts = computed(() => {
		const tab = tabs.value[activeTab.value];
		if (tab === "全部") return posts.value;
		if (tab === "热门") return posts.value;
		const expectType = tabTypeMap[tab];
		if (!expectType) return posts.value;
		return posts.value.filter((p) => (p.postType ?? p.post?.postType) === expectType);
	})

	function onMenu() {
		isDrawerOpen.value = true;
	}

	function closeDrawer() {
		isDrawerOpen.value = false;
	}

	function toMine() {
		closeDrawer();
		uni.navigateTo({
			url: "/pages/mine/mine"
		});
	}

	function toAlarm() {
		closeDrawer();
		uni.navigateTo({
			url: "/pages/alarm/alarm"
		});
	}

	function onLogout() {
		closeDrawer();
		uni.showModal({
			title: "退出登录",
			content: "确定要退出登录吗？",
			confirmText: "退出",
			success: (res) => {
				if (res.confirm) {
					uni.removeStorageSync('token');
					uni.showToast({
						title: "已退出登录",
						icon: "none"
					});
					setTimeout(() => {
						uni.reLaunch({
							url: "/pages/index/index"
						});
					}, 300);
				}
			}
		});
	}

	function onSearch() {
		uni.showToast({
			title: "搜索",
			icon: "none"
		});
	}

	function onAiTalk() {
		uni.showToast({
			title: "Ai问答",
			icon: "none"
		});
	}

	function preview(urls, current) {
		uni.previewImage({
			urls,
			current: urls[current]
		});
	}

	async function toggleLike(postItem) {
		const postId = postItem?.postId ?? postItem?.post?.postId;
		if (!postId || postItem?.likePending) return;
		postItem.likePending = true;
		const wasLiked = Boolean(postItem?.liked ?? postItem?.post?.liked);
		applyLikeState(postItem, !wasLiked);
		try {
			await postApi.changeLikeStatus(postId, 'POST_LIKE');
			uni.showToast({
				title: wasLiked ? '已取消点赞' : '点赞成功',
				icon: wasLiked ? 'none' : 'success'
			});
		} catch (error) {
			applyLikeState(postItem, wasLiked);
			console.error('点赞失败:', error);
			uni.showToast({
				title: '点赞失败',
				icon: 'none'
			});
		} finally {
			postItem.likePending = false;
		}
	}

	function resolveLikeCount(postItem) {
		const raw = postItem?.post?.likeCount ?? postItem?.likes ?? 0;
		const num = Number(raw);
		return Number.isFinite(num) ? num : 0;
	}

	function applyLikeState(postItem, nextLiked) {
		if (!postItem) return;
		const currentLiked = Boolean(postItem.liked ?? postItem.post?.liked);
		if (currentLiked !== nextLiked) {
			const delta = nextLiked ? 1 : -1;
			const nextCount = Math.max(0, resolveLikeCount(postItem) + delta);
			if (postItem.post) postItem.post.likeCount = nextCount;
			postItem.likes = nextCount;
		}
		postItem.liked = nextLiked;
		if (postItem.post) postItem.post.liked = nextLiked;
	}

	function openComments(postItem) {
		const postId = postItem.postId ?? postItem.post?.postId;
		if (postId) {
			uni.navigateTo({
				url: `/pages/detail/detail?postId=${postId}`
			});
		}
	}

	function share(post) {
		uni.showToast({
			title: "分享",
			icon: "none"
		});
	}

	function toPostDetail(postItem) {
		const postId = postItem.postId ?? postItem.post?.postId;
		if (postId) {
			uni.navigateTo({
				url: `/pages/detail/detail?postId=${postId}`
			});
		}
	}
</script>

<template>
	<view class="page">
		<view class="nav">
			<view class="nav-left">
				<image class="nav-icon" src="/static/component/menu.png" mode="aspectFit" @click="onMenu" />
			</view>

			<view class="nav-center">
				<text class="nav-title">Ronitrouble</text>
			</view>

			<view class="nav-right">
				<image class="nav-icon" src="/static/component/search.png" mode="aspectFit" @click="onSearch" />
				<image class="nav-icon" src="/static/component/talk.png" mode="aspectFit" @click="onAiTalk" />
			</view>
		</view>

		<!-- 分类 -->
		<view class="tab-wrap">
			<scroll-view scroll-x class="tabs" :show-scrollbar="false" :scroll-left="tabsScrollLeft"
				:scroll-into-view="tabsScrollInto" :scroll-with-animation="true" @scroll="onTabsScroll">
				<view v-for="(t, i) in tabs" :key="t" :id="`tab-${i}`" class="tab" :class="{ active: i === activeTab }"
					@click="onTabClick(i)">
					<text class="tab-txt">{{ t }}</text>
					<view v-if="i === activeTab" class="tab-line" />
				</view>
			</scroll-view>
		</view>

		<!-- 内容 -->
		<scroll-view scroll-y class="feed" @scrolltolower="loadPosts">
			<view v-for="postItem in filteredPosts" :key="postItem.post.postId" class="card">
				<!-- 帖子头 -->
				<view class="post-hd">
					<image class="avatar" :src="postItem.userInfo.avatarUrl || ''" mode="aspectFill" />
					<view class="user-info">
						<text class="user-name">{{ postItem.userInfo.nickname || '' }}</text>
					</view>
				</view>

				<!-- 正文 -->
				<view class="post-bd">
					<text class="content">{{ postItem.post.content }}</text>

					<view v-if="postItem.post.imageUrls && postItem.post.imageUrls.length" class="media-row">
						<image v-for="(img, idx) in postItem.post.imageUrls.slice(0, 3)" :key="idx" class="media"
							:src="img" mode="aspectFill" @click="preview(postItem.post.imageUrls, idx)" />
					</view>

					<view class="post-meta">
						<text class="time">{{ formatPostTime(postItem.time || postItem.post.createdAt) }}</text>

						<view class="actions">
							<view class="act" @click="toggleLike(postItem)">
								<image class="act-icon"
									:src="(postItem.liked || postItem.post?.liked) ? '/static/component/like-active.png' : '/static/component/like.png'"
									mode="aspectFit" />
								<text class="act-num">{{ postItem.post.likeCount || 0 }}</text>
							</view>

							<view class="act" @click="openComments(postItem)">
								<image class="act-icon" src="/static/component/comment.png" mode="aspectFit" />
								<text class="act-num">{{ postItem.post.commentCount }}</text>
							</view>

							<view class="act" @click="share(postItem)">
								<image class="act-icon" src="/static/component/share.png" mode="aspectFit" />
							</view>
						</view>
					</view>
				</view>

				<!-- 评论 -->
				<view v-if="postItem.replyList && postItem.replyList.length" class="reply-card">
					<view v-for="c in postItem.comments.slice(0, 2)" :key="c.commentId" class="reply-row"
						@click="toPostDetail(post)">
						<text class="reply-line">
							<text class="reply-name">{{ c.userId }}</text>
							<text class="reply-colon">：</text>
							<text class="reply-text">{{ c.content }}</text>
						</text>
					</view>

					<view v-if="postItem.post.commentCount > 2" class="reply-more" @click="toPostDetail(postItem)">
						<text class="reply-more-text">共{{ postItem.post.commentCount }}条评论</text>
					</view>
				</view>
			</view>

			<view v-if="loading" class="load-tip">加载中...</view>
			<view v-else-if="!hasMore" class="load-tip">没有更多了～</view>
		</scroll-view>

		<view class="drawer-mask" :class="{ show: isDrawerOpen }" @click="closeDrawer" />
		<view class="drawer" :class="{ open: isDrawerOpen }" @click.stop>
			<view class="drawer-hd">
				<text class="drawer-title">菜单</text>
			</view>
			<view class="drawer-list">
				<view class="drawer-item" @click="toMine">
					<image class="drawer-icon" src="/static/component/mine.png" mode="aspectFit" />
					<text class="drawer-item-text">我的资料</text>
				</view>

				<view class="drawer-item" @click="toAlarm">
					<image class="drawer-icon" src="/static/component/alarm.png" mode="aspectFit" />
					<text class="drawer-item-text">消息提醒</text>
				</view>

				<view class="drawer-item danger" @click="onLogout">
					<image class="drawer-icon" src="/static/component/logout.png" mode="aspectFit" />
					<text class="drawer-item-text">退出登录</text>
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
		background: #f6f7fb;
	}

	.nav {
		padding: 18rpx 24rpx 18rpx;
		display: flex;
		align-items: center;
		background: #ffffff;
	}

	.nav-left,
	.nav-right {
		width: 120rpx;
		display: flex;
		align-items: center;
	}

	.nav-right {
		justify-content: flex-end;
		gap: 22rpx;
	}

	.nav-icon {
		width: 42rpx;
		height: 42rpx;
		margin: 2px;
	}

	.nav-avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 32rpx;
		margin-right: 16rpx;
	}

	.nav-center {
		flex: 1;
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	.nav-title {
		font-size: 34rpx;
		color: #111;
		font-weight: 600;

	}

	.nav-sub {
		font-size: 22rpx;
		color: #999;
		margin-top: 4rpx;
	}

	.tab-wrap {
		background: #fff;
		padding: 0 8rpx;
		border-bottom: 2rpx solid #d9d9d9;
		border-top: 2rpx solid #d9d9d9;
	}

	.tabs {
		white-space: nowrap;
		width: 100%;
	}

	.tab {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 18rpx 32rpx 8rpx;
		margin-right: 6rpx;
	}

	.tab-txt {
		font-size: 28rpx;
		color: #666;
	}

	.tab.active .tab-txt {
		color: #111;
		font-weight: 600;
	}

	.tab-line {
		width: 48rpx;
		height: 6rpx;
		border-radius: 6rpx;
		background: #111;
		margin-top: 10rpx;
	}

	/* feed */
	.feed {
		padding: 20rpx;
		box-sizing: border-box;
		padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
	}

	/* card */
	.card {
		background: #fff;
		border-radius: 18rpx;
		padding: 20rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.04);
	}

	.post-hd {
		display: flex;
		align-items: center;
	}

	.avatar {
		width: 68rpx;
		height: 68rpx;
		border-radius: 36rpx;
		margin-right: 18rpx;
	}

	.user-name {
		font-size: 30rpx;
		color: #111;
		font-weight: 600;
	}

	.post-bd {
		margin-top: 14rpx;
	}

	.content {
		font-size: 28rpx;
		color: #222;
		line-height: 40rpx;
		white-space: pre-wrap;
		display: block;
		margin: 5px;
	}

	.media-row {
		margin: 12rpx;
		display: flex;
		gap: 20rpx;
	}

	.media {
		flex: 1;
		height: 230rpx;
		border-radius: 16rpx;
		background: #f2f3f5;
	}

	.post-meta {
		margin: 12rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.time {
		font-size: 24rpx;
		color: #999;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 22rpx;
	}

	.act {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.act-icon {
		width: 32rpx;
		height: 32rpx;
	}

	.act-num {
		font-size: 24rpx;
		color: #666;
	}

	/* replies */
	.reply-card {
		margin-top: 14rpx;
		background: #f6f7fb;
		border-radius: 16rpx;
		padding: 12rpx 14rpx;
	}

	.reply-row {
		padding: 8rpx 0;
	}

	.reply-row+.reply-row {
		border-top: 1rpx solid rgba(0, 0, 0, 0.06);
	}

	.reply-line {
		font-size: 26rpx;
		line-height: 38rpx;
		color: #333;

		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.reply-name {
		font-weight: 700;
		color: #111;
	}

	.reply-colon {
		color: #111;
	}

	.reply-text {
		font-weight: 400;
		color: #333;
	}

	.reply-more {
		margin: 4rpx;
		padding-top: 6rpx;
		border-top: 1rpx solid rgba(0, 0, 0, 0.06);
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.reply-more-text {
		font-size: 24rpx;
		color: #666;
	}

	.load-tip {
		padding: 14rpx 0 8rpx;
		text-align: center;
		color: #aaa;
		font-size: 24rpx;
	}

	.drawer-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.35);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
		z-index: 98;
	}

	.drawer-mask.show {
		opacity: 1;
		pointer-events: auto;
	}

	.drawer {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 520rpx;
		max-width: 80vw;
		background: #f7f7fb;
		transform: translateX(-100%);
		transition: transform 0.25s ease;
		z-index: 99;
		padding: 28rpx 24rpx;
		box-shadow: 8rpx 0 28rpx rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		gap: 22rpx;
	}

	.drawer.open {
		transform: translateX(0);
	}

	.drawer-hd {
		padding: 10rpx 6rpx 18rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
	}

	.drawer-title {
		font-size: 34rpx;
		color: #111;
		font-weight: 600;
		display: block;
	}

	.drawer-sub {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #999;
		display: block;
	}

	.drawer-list {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.drawer-item {
		padding: 26rpx 18rpx;
		margin: 4px 0;
		border-radius: 14rpx;
		background: #fff;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.drawer-icon {
		width: 32rpx;
		height: 32rpx;
		flex-shrink: 0;
		/* ✅ 不被挤压 */
		display: block;
		/* ✅ 去掉 inline 基线影响 */
	}

	.drawer-item-text {
		font-size: 30rpx;
		color: #222;
		line-height: 1;
		/* ✅ 更稳 */
		margin: 0;
		/* ✅ 删掉你原来的 20px */
	}

	/* danger 保持不变 */
	.drawer-item.danger {
		background: #fff2f0;
	}

	.drawer-item.danger .drawer-item-text {
		color: #d4380d;
		font-weight: 400;
	}
</style>
