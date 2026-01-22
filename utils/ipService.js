const IP_API_URL = 'https://httpbin.org/ip'

export async function getPublicIP() {
  try {
    const response = await uni.request({
      url: IP_API_URL,
      method: 'GET',
      timeout: 10000
    })
    
    if (response.statusCode === 200 && response.data) {
      return response.data
    }
    
    throw new Error('获取IP失败')
  } catch (error) {
    console.error('获取IP失败:', error)
    throw error
  }
}

export async function getIPAddress() {
  try {
    const geoInfo = await getPublicIP()
    return geoInfo.origin || null
  } catch (error) {
    console.error('获取IP地址失败:', error)
    return null
  }
}
