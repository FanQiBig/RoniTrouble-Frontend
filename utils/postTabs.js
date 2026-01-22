export const POST_TABS = ["全部", "热门", "生活分享", "美食推荐", "失物招领", "闲置交易"];

export const POST_TYPE_LABEL_MAP = {
	LIFE_STYLE: "生活分享",
	REVIEW: "美食推荐",
	LOST_AND_FOUND: "失物招领",
	TRADE: "闲置交易"
};

export const POST_TYPE_ALIAS_MAP = {
	"生活分享": "生活分享",
	"日常分享": "生活分享",
	"美食推荐": "美食推荐",
	"美食": "美食推荐",
	"失物招领": "失物招领",
	"寻物招领": "失物招领",
	"闲置交易": "闲置交易",
	"闲置推荐": "闲置交易"
};

export const DEFAULT_POST_LABEL =
	POST_TABS.find((tab) => tab !== "全部" && tab !== "热门") || "生活分享";

export function resolvePostTypeLabel(value) {
	if (value === undefined || value === null) return "";
	const raw = String(value).trim();
	if (!raw) return "";
	const upper = raw.toUpperCase();
	if (POST_TYPE_LABEL_MAP[upper]) return POST_TYPE_LABEL_MAP[upper];
	if (POST_TYPE_ALIAS_MAP[raw]) return POST_TYPE_ALIAS_MAP[raw];
	if (POST_TABS.includes(raw)) return raw;
	return "";
}
