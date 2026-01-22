import data from './data.json'

export { data }

const idMap = new Map()
const nameMap = new Map()

data.items?.forEach(item => {
  idMap.set(String(item.id), item)
  nameMap.set(`/${item.name}`, item)
})

export function getFaceById(id) {
  id = String(id)
  return idMap.get(id)
}

export function getFaceByName(name) {
  if (!name.startsWith('/')) {
    name = `/${name}`
  }
  return nameMap.get(name)
}

export function getFaceUrl(id, useApng = false) {
  const item = getFaceById(id)
  if (!item) return ''
  if (useApng) {
    return `/static/qq_emoji/${id}/apng/${id}.png`
  }
  return `/static/qq_emoji/${id}/png/${id}.png`
}

export {
  getFaceById as get,
  getFaceUrl as getUrl,
}
