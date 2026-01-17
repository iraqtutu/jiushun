<template>
	<view class="container">
		<view class="header">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="title">玖顺农机售后服务</text>
		</view>
		
		<view class="status-box">
			<view v-if="isLoading" class="loading-area">
				<text class="loading-text">正在验证身份...</text>
			</view>
			
			<view v-else class="action-area">
				<!-- Show error or status message -->
				<text v-if="statusMsg" class="status-msg">{{ statusMsg }}</text>
				
				<button class="btn-weixin" @click="handleWxLogin">
					<text>微信一键登录</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isLoading: true,
				statusMsg: ''
			}
		},
		onLoad() {
			this.handleWxLogin();
		},
		methods: {
			handleWxLogin() {
				this.isLoading = true;
				this.statusMsg = '';
				
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						this.callCloudLogin(loginRes.code);
					},
					fail: (err) => {
						this.isLoading = false;
						this.statusMsg = '微信登录失败，请重试';
						console.error('Login Fail:', err);
					}
				});
			},
			
			callCloudLogin(code) {
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'login',
						params: { code: code }
					},
					success: (res) => {
						this.isLoading = false;
						const result = res.result;
						
						if (result.code !== 0) {
							this.statusMsg = '登录服务异常: ' + result.msg;
							return;
						}
						
						// Save Token
						uni.setStorageSync('uni_id_token', result.token);
						uni.setStorageSync('uni_id_token_expired', result.tokenExpired);
						uni.setStorageSync('userInfo', result.userInfo);
						
						if (result.authorized) {
							// Authorized -> Go Home
							uni.reLaunch({ url: '/pages/index/index' });
						} else {
							// Not Authorized
							if (result.applicationStatus === 0) {
								this.statusMsg = '您的申请正在审核中，请耐心等待。';
							} else if (result.applicationStatus === 2) {
								uni.showModal({
									title: '申请被拒绝',
									content: '您的申请已被拒绝，请联系管理员或重新申请。',
									confirmText: '重新申请',
									success: (m) => {
										if (m.confirm) uni.navigateTo({ url: '/pages/register/apply' });
									}
								});
							} else {
								// No application or unknown
								uni.showModal({
									title: '未授权用户',
									content: '您当前未在授权名单中，是否前往申请？',
									confirmText: '去申请',
									showCancel: false,
									success: () => {
										uni.navigateTo({ url: '/pages/register/apply' });
									}
								});
							}
						}
					},
					fail: (err) => {
						this.isLoading = false;
						this.statusMsg = '网络请求失败';
						console.error('Cloud Call Fail:', err);
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 40px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		background-color: #fff;
	}
	
	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 100px;
		margin-bottom: 80px;
		
		.logo {
			width: 100px;
			height: 100px;
			margin-bottom: 20px;
		}
		
		.title {
			font-size: 22px;
			font-weight: bold;
			color: #333;
		}
	}
	
	.status-box {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.loading-text {
		color: #666;
		font-size: 16px;
	}
	
	.status-msg {
		color: #ff5252;
		margin-bottom: 20px;
		font-size: 14px;
	}
	
	.btn-weixin {
		background-color: #07c160;
		color: #fff;
		width: 80%;
		border-radius: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 12px 0;
		font-size: 16px;
		
		&::after {
			border: none;
		}
	}
</style>