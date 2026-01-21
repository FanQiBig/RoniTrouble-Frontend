import request from './request.js'

const BASE_URL = 'http://127.0.0.1:8080'

export const chatApi = {
	chat(message, onChunk, onComplete, onError) {
		const url = `${BASE_URL}/api/ai/chat?message=${encodeURIComponent(message)}`
		const es = new EventSource(url)

		es.onopen = () => {
			console.log('SSE 连接成功')
		}

		es.onmessage = (event) => {
			const data = event.data
			if (data === '[DONE]') {
				es.close()
				if (onComplete) onComplete()
			} else if (onChunk) {
				onChunk(data)
			}
		}

		es.onerror = (error) => {
			console.error('SSE错误:', error)
			es.close()
			if (onError) onError(error)
		}

		return es
	},

	chatHTTP(message, onChunk, onComplete, onError) {
		request.get('/api/ai/chat', { message })
			.then(data => {
				if (typeof data === 'string') {
					const lines = data.split('\n')
					let fullText = ''

					for (const line of lines) {
						const trimmed = line.trim()
						if (trimmed.startsWith('data:')) {
							const content = trimmed.substring(5).trim()
							if (content) {
								fullText += content
								if (onChunk) onChunk(fullText)
							}
						}
					}
				} else if (Array.isArray(data)) {
					data.forEach(item => {
						if (onChunk) onChunk(item)
					})
				} else if (onChunk) {
					onChunk(data)
				}

				if (onComplete) onComplete()
			})
			.catch(err => {
				console.error('HTTP 请求失败:', err)
				if (onError) onError(err)
			})
	}
}

export default chatApi
