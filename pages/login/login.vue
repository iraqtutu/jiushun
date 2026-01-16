<template>
	<view class="container">
		<view class="header">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="title">玖顺农机售后服务</text>
		</view>
		
		<view class="form-box">
			<view class="input-group">
				<text class="label">手机号</text>
				<input class="input" type="number" v-model="mobile" placeholder="请输入手机号" maxlength="11" />
			</view>
			<view class="input-group">
				<text class="label">密码</text>
				<input class="input" type="password" v-model="password" placeholder="请输入密码" />
			</view>
			
			<button class="btn-primary" @click="handleLogin">登录</button>
			
			<view class="link-area">
				<text class="link-text" @click="goToApply">没有账号？点击申请</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				mobile: '',
				password: ''
			}
		},
		methods: {
			handleLogin() {
				if (!this.mobile || !this.password) {
					uni.showToast({
						title: '请填写手机号和密码',
						icon: 'none'
					});
					return;
				}
				
				// TODO: Integrate with uni-id-co login
				// For now, simple mock or direct redirect for demo
				console.log('Login attempt', this.mobile);
				
				// Mock success
				uni.setStorageSync('userInfo', { mobile: this.mobile, name: '测试用户' });
				uni.reLaunch({
					url: '/pages/index/index'
				});
			},
			goToApply() {
				uni.navigateTo({
					url: '/pages/register/apply'
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
		background-color: #f5f5f5;
	}
	
	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 50px;
		
		.logo {
			width: 80px;
			height: 80px;
			margin-bottom: 15px;
		}
		
		.title {
			font-size: 20px;
			font-weight: bold;
			color: #333;
		}
	}
	
	.form-box {
		width: 100%;
		background: #fff;
		border-radius: 10px;
		padding: 20px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.05);
	}
	
	.input-group {
		margin-bottom: 20px;
		
		.label {
			display: block;
			font-size: 14px;
			color: #666;
			margin-bottom: 8px;
		}
		
		.input {
			width: 100%;
			height: 44px;
			background: #f8f8f8;
			border-radius: 4px;
			padding: 0 10px;
			font-size: 16px;
			box-sizing: border-box;
		}
	}
	
	.btn-primary {
		background-color: #007aff;
		color: #fff;
		margin-top: 30px;
		border-radius: 4px;
		font-size: 16px;
	}
	
	.link-area {
		margin-top: 20px;
		text-align: center;
		
		.link-text {
			font-size: 14px;
			color: #007aff;
		}
	}
</style>