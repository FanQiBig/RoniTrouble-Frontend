<script setup>
import {
	reactive,
	ref,
	computed,
	onMounted
} from "vue";
import {
	postApi
} from "@/api/post.js";

const menuAvatar = '/static/component/menu.png'
const searchAvatar = '/static/component/search.png'
const talkAvatar = '/static/component/talk.png'
const likeAvatar = '/static/component/like.png'
const likeActiveAvatar = '/static/component/like-active.png'
const commentAvatar = '/static/component/comment.png'
const shareAvatar = '/static/component/share.png'
const addAvatar = '/static/component/add.png'

// --- state ---
const tabs = ref(["全部", "热门", "美食", "失物招领", "闲置推荐"]);
const activeTab = ref(0);
const loading = ref(false);
const from = ref(0);
const pageSize = ref(10);

const posts = ref([]);
const hasMore = ref(true);

async function loadPosts() {
	if (loading.value || !hasMore.value) return;

	loading.value = true;
	try {
		const res = await postApi.getHomePage(from.value, pageSize.value);
		if (res.posts && res.posts.length > 0) {
			posts.value.push(...res.posts);
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
});

// --- computed ---
const filteredPosts = computed(() => {
	const tab = tabs.value[activeTab.value];
	if (tab === "全部") return posts.value;
	return posts.value.filter((p) => {
		const postType = p.post?.postType;
		if (tab === "热门") return true;
		if (tab === "美食") return postType === "REVIEW";
		if (tab === "失物招领") return postType === "LOST_AND_FOUND";
		if (tab === "闲置推荐") return postType === "TRADE";
		return false;
	});
})

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

function toPublish() {
	uni.navigateTo({
		url: "/pages/publish/publish"
	});
}

function preview(urls, current) {
	uni.previewImage({
		urls,
		current: urls[current]
	});
}

async function toggleLike(postItem) {
	try {
		await postApi.changeLikeStatus(
			postItem.post.postId,
			'POST_LIKE'
		);
		postItem.post.likeCount += 1;
		uni.showToast({
			title: '点赞成功',
			icon: 'success'
		});
	} catch (error) {
		console.error('点赞失败:', error);
	}
}

function openComments(postItem) {
	const postId = postItem.post?.postId;
	if (postId) {
		uni.navigateTo({
			url: `/pages/detail/detail?postId=${postId}`
		});
	}
}

function share(postItem) {
	uni.showToast({
		title: "分享",
		icon: "none"
	});
}

function toPostDetail(postItem) {
	const postId = postItem.post?.postId;
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
				<img class="nav-icon" :src="menuAvatar" mode="aspectFit" @click="onMenu" />
			</view>

			<view class="nav-center">
				<text class="nav-title">Ronitrouble</text>
			</view>

			<view class="nav-right">
				<img class="nav-icon" :src="searchAvatar" mode="aspectFit" @click="onSearch" />
				<img class="nav-icon" :src="talkAvatar" mode="aspectFit" @click="onAiTalk" />
			</view>
		</view>

		<!-- 分类 -->
		<view class="tab-wrap">
			<scroll-view scroll-x class="tabs" :show-scrollbar="false">
				<view v-for="(t, i) in tabs" :key="t" class="tab" :class="{ active: i === activeTab }"
					@click="activeTab = i">
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
						<text class="time">{{ postItem.post.createdAt }}</text>

						<view class="actions">
							<view class="act" @click="toggleLike(postItem)">
								<image class="act-icon" :src="likeAvatar" mode="aspectFit" />
								<text class="act-num">{{ postItem.post.likeCount || 0 }}</text>
							</view>

							<view class="act" @click="openComments(postItem)">
								<img class="act-icon" :src="commentAvatar" />
								<text class="act-num">{{ postItem.post.commentCount || 0 }}</text>
							</view>

							<view class="act" @click="share(postItem)">
								<img class="act-icon" :src="shareAvatar" />
							</view>
						</view>
					</view>
				</view>

				<!-- 评论 -->
				<view v-if="postItem.comments && postItem.comments.length" class="reply-card">
					<view v-for="c in postItem.comments.slice(0, 2)" :key="c.commentId" class="reply-row"
						@click="toPostDetail(postItem)">
						<text class="reply-line">
							<text class="reply-name">{{ c.userId }}</text>
							<text class="reply-colon">：</text>
							<text class="reply-text">{{ c.content }}</text>
						</text>
					</view>

					<!-- 更多评论 -->
					<view v-if="postItem.post.commentCount > 2" class="reply-more" @click="toPostDetail(postItem)">
						<text class="reply-more-text">共{{ postItem.post.commentCount }}条评论</text>
					</view>
				</view>
			</view>

			<view v-if="loading" class="load-tip">加载中...</view>
			<view v-else-if="!hasMore" class="load-tip">没有更多了～</view>
		</scroll-view>
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
	width: 44rpx;
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
</style>