# 删除 publish.vue 中的商家功能

## 修改文件
`pages/publish/publish.vue`

## 具体改动

### 1. 修改 tabs
- 删除 "美食" 选项

### 2. 修改 postTypeMap
- 删除 `"美食推荐": "REVIEW"`

### 3. 删除 isReviewPost computed
- 删除 `const isReviewPost` 定义

### 4. 修改 resetPostSpecificData
- 删除商家相关的数据重置（merchantId、cuisineId、score、selectedMerchantIndex、selectedCuisineIndex、cuisines）

### 5. 修改 canPublish
- 删除 isReviewPost 的检查逻辑

### 6. 修改 publish
- 删除 isReviewPost 的判断和商家数据添加

### 7. 修改 onMounted
- 删除 `loadMerchants()` 调用

## 保留内容

- 生活分享、失物招领、闲置推荐功能保持不变
- lostAndFoundType 相关功能保持不变