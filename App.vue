<script setup>
<<<<<<< HEAD
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
=======
	import {
		onLaunch,
		onShow,
		onHide
	} from '@dcloudio/uni-app'
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
		reportUserIP()
		
	})

	onHide(() => {
		console.log('App Hide')
	})
</script>

<style>
	/*每个页面公共css */
</style>
>>>>>>> 75c61f11970c2c6b423da1f6167291da243695d2
