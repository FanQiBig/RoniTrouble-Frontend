const MAX_MID_KEY = 'maxMidForUser'
const MESSAGE_PREFIX = 'chat_messages_'
const LOCAL_PREFIX = 'chat_local_messages_'
const UNREAD_PREFIX = 'chat_unread_'
const listeners = new Set()

function getMessageKey(message) {
  if (!message) return ''
  if (message.localId) {
    return `local:${message.localId}`
  }
  if (message.midForUser) {
    return `midForUser:${message.midForUser}`
  }
  if (message.mid) {
    return `mid:${message.mid}`
  }
  return `${message.conversationId}-${message.senderId}-${message.content}`
}

function normalizeList(list) {
  if (!Array.isArray(list)) return []
  return list.filter(Boolean)
}

function getSortValue(item) {
  const mid = Number(item && item.midForUser)
  if (Number.isFinite(mid)) return { type: 0, value: mid }
  const localMid = Number(item && item.localMid)
  if (Number.isFinite(localMid)) return { type: 0, value: localMid }
  const localTs = Number(item && item.localTs)
  if (Number.isFinite(localTs)) return { type: 1, value: localTs }
  const localId = Number(item && item.localId)
  if (Number.isFinite(localId)) return { type: 2, value: localId }
  return { type: 3, value: 0 }
}

function mergeMessages(existing, incoming) {
  const map = new Map()
  normalizeList(existing).forEach((item) => {
    map.set(getMessageKey(item), item)
  })
  normalizeList(incoming).forEach((item) => {
    map.set(getMessageKey(item), item)
  })
  const merged = Array.from(map.values())
  merged.sort((a, b) => {
    const aSort = getSortValue(a)
    const bSort = getSortValue(b)
    if (aSort.type !== bSort.type) return aSort.type - bSort.type
    return aSort.value - bSort.value
  })
  return merged
}

function emit(payload) {
  listeners.forEach((cb) => {
    try {
      cb(payload)
    } catch (e) {
    }
  })
}

export function getMaxMidForUser() {
  const stored = uni.getStorageSync(MAX_MID_KEY)
  const value = Number(stored)
  return Number.isFinite(value) ? value : 0
}

export function setMaxMidForUser(mid) {
  const value = Number(mid)
  if (!Number.isFinite(value)) return getMaxMidForUser()
  const current = getMaxMidForUser()
  if (value > current) {
    uni.setStorageSync(MAX_MID_KEY, value)
    return value
  }
  return current
}

export function getConversationMessages(conversationId) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return []
  const key = `${MESSAGE_PREFIX}${conversationId}`
  const stored = normalizeList(uni.getStorageSync(key))
  const localKey = `${LOCAL_PREFIX}${conversationId}`
  const local = normalizeList(uni.getStorageSync(localKey))
  return mergeMessages(stored, local)
}

function getServerMessages(conversationId) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return []
  const key = `${MESSAGE_PREFIX}${conversationId}`
  return normalizeList(uni.getStorageSync(key)).filter((item) => !item || !item.localEcho)
}

function updateMaxMidFromMessages(messages) {
  const list = normalizeList(messages)
  if (!list.length) return
  const max = list.reduce((acc, item) => {
    const mid = Number(item && item.midForUser)
    if (Number.isFinite(mid) && mid > acc) return mid
    return acc
  }, getMaxMidForUser())
  setMaxMidForUser(max)
}

function removeLocalDuplicates(conversationId, serverMessages) {
  const list = normalizeList(serverMessages)
  if (!list.length) return
  const localKey = `${LOCAL_PREFIX}${conversationId}`
  const local = normalizeList(uni.getStorageSync(localKey))
  if (!local.length) return
  let changed = false
  const next = local.slice()
  list.forEach((serverMsg) => {
    if (!serverMsg || serverMsg.content === undefined || serverMsg.content === null) return
    if (serverMsg.senderId === undefined || serverMsg.senderId === null) return
    const idx = next.findIndex((localMsg) => {
      if (!localMsg || !localMsg.localEcho) return false
      if (localMsg.content !== serverMsg.content) return false
      if (localMsg.senderId === undefined || localMsg.senderId === null) return false
      return String(localMsg.senderId) === String(serverMsg.senderId)
    })
    if (idx !== -1) {
      next.splice(idx, 1)
      changed = true
    }
  })
  if (changed) {
    uni.setStorageSync(localKey, next)
  }
}

export function appendConversationMessages(conversationId, messages) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return []
  const key = `${MESSAGE_PREFIX}${conversationId}`
  const existing = getServerMessages(conversationId)
  const merged = mergeMessages(existing, messages)
  uni.setStorageSync(key, merged)
  updateMaxMidFromMessages(messages)
  removeLocalDuplicates(conversationId, messages)
  emit({ conversationId, messages: normalizeList(messages), allMessages: getConversationMessages(conversationId) })
  return merged
}

export function appendLocalMessages(conversationId, messages) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return []
  const localKey = `${LOCAL_PREFIX}${conversationId}`
  const existing = normalizeList(uni.getStorageSync(localKey))
  const merged = mergeMessages(existing, messages)
  uni.setStorageSync(localKey, merged)
  emit({ conversationId, messages: normalizeList(messages), allMessages: getConversationMessages(conversationId) })
  return merged
}

export function appendMessages(messages, myUserId) {
  const list = normalizeList(messages)
  const grouped = new Map()
  list.forEach((item) => {
    const conversationId = item.conversationId
    if (!conversationId) return
    const key = String(conversationId)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(item)
  })
  grouped.forEach((group, conversationId) => {
    appendConversationMessages(conversationId, group)
    if (myUserId) {
      const hasOthersMessage = group.some(msg => msg.senderId !== myUserId)
      if (hasOthersMessage) {
        incrementUnreadCount(conversationId)
      }
    }
  })
}

export function subscribeMessages(callback) {
  if (typeof callback !== 'function') return () => {}
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function dedupeLocalMessages(conversationId, predicate) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return []
  const localKey = `${LOCAL_PREFIX}${conversationId}`
  const existing = normalizeList(uni.getStorageSync(localKey))
  if (!existing.length) return []
  const next = existing.filter((item) => !predicate(item))
  if (next.length !== existing.length) {
    uni.setStorageSync(localKey, next)
    emit({ conversationId, messages: [], allMessages: getConversationMessages(conversationId) })
  }
  return next
}

export function updateLocalMessage(conversationId, localId, updater) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return null
  if (!localId) return null
  const localKey = `${LOCAL_PREFIX}${conversationId}`
  const existing = normalizeList(uni.getStorageSync(localKey))
  if (!existing.length) return null
  let changed = false
  const next = existing.map((item) => {
    if (!item || String(item.localId) !== String(localId)) return item
    const updated = typeof updater === 'function' ? updater({ ...item }) : { ...item, ...updater }
    changed = true
    return updated
  })
  if (changed) {
    uni.setStorageSync(localKey, next)
    emit({ conversationId, messages: [], allMessages: getConversationMessages(conversationId) })
  }
  return changed
}

export function getUnreadCount(conversationId) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return 0
  const key = `${UNREAD_PREFIX}${conversationId}`
  const count = uni.getStorageSync(key)
  return Number.isFinite(Number(count)) ? Number(count) : 0
}

export function incrementUnreadCount(conversationId) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return
  const key = `${UNREAD_PREFIX}${conversationId}`
  const current = getUnreadCount(conversationId)
  uni.setStorageSync(key, current + 1)
}

export function clearUnreadCount(conversationId) {
  if (conversationId === undefined || conversationId === null || conversationId === '') return
  const key = `${UNREAD_PREFIX}${conversationId}`
  uni.setStorageSync(key, 0)
}
