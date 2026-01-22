<script setup>
import {
	onLaunch,
	onShow,
	onHide
} from '@dcloudio/uni-app'
import {
	startMessageSse
} from './utils/messageSse.js'
import {
	getIPAddress
} from './utils/ipService.js'
import {
	reportIP
} from './api/auth.js'

async function reportUserIP() {
	const ip = await getIPAddress()
	if (ip) {
		await reportIP(ip)
	}
}

onLaunch(() => {
	console.log('App Launch')
	reportUserIP()
})

onShow(() => {
	console.log('App Show')
	startMessageSse()
})

onHide(() => {
	console.log('App Hide')
})
</script>

<style>
@import './icon/iconfont.css';
</style>
