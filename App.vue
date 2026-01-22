<script setup>
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