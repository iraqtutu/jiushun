<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	page {
		position: relative;
		min-height: 100vh;
	}

	page::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		/* 调整布局：进一步拉大间距，降低透明度至 0.05 减少视觉污染 */
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='480' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='120' y='80' fill='%23000000' fill-opacity='0.05' transform='rotate(-20 120 80)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='14'%3E江苏玖顺农业机械有限公司%3C/text%3E%3Ctext x='360' y='280' fill='%23000000' fill-opacity='0.05' transform='rotate(-20 360 280)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='14'%3E江苏玖顺农业机械有限公司%3C/text%3E%3C/svg%3E");
		background-repeat: repeat;
		pointer-events: none;
		z-index: 9999;
	}
</style>
