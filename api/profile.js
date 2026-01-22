import request from './request.js'

export function isProfileExisted() {
  return request.get('/userInfo/isExisted')
}

export function getMyProfile() {
  return request.get('/userInfo/me')
}

export function saveProfile(data) {
  return request.post('/userInfo', data)
}
