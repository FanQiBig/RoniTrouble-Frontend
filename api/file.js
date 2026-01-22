import request from './request.js'

export function getUploadInfo(category = 'AVATAR', rawFileName = '') {
  const safeName = rawFileName || 'file'
  return request.get('/file', { Category: category, rawFileName: safeName })
}

export function getRawFileName(ossFileName) {
  return request.get('/file/rawName', { ossFileName })
}

export function uploadToPresigned(url, file) {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': (file && file.type) || 'application/octet-stream'
    },
    body: file
  }).then((resp) => {
    if (resp.ok) return
    throw new Error('上传失败')
  })
}
