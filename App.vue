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
		/* 调整布局：拉大垂直间距(height 240)，调整水平错位，防止视觉连线 */
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='360' height='340' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='90' y='60' fill='%23000000' fill-opacity='0.25' transform='rotate(-20 90 60)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='14'%3E江苏玖顺农业机械有限公司%3C/text%3E%3Ctext x='270' y='180' fill='%23000000' fill-opacity='0.25' transform='rotate(-20 270 180)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='14'%3E江苏玖顺农业机械有限公司%3C/text%3E%3C/svg%3E");
		background-repeat: repeat;
		pointer-events: none;
		z-index: 9999;
	}
</style>
