<template>
	<view class="container">
		<view class="user-info-card">
			<view class="greeting">欢迎你，{{ userName }}</view>
			<view class="role-tag">服务人员</view> <!-- Placeholder role -->
		</view>
		
		<view class="menu-grid">
			<view class="menu-item primary" @click="navTo('/pages/work-order/create')">
				<view class="icon">+</view>
				<text class="menu-title">新建派工单</text>
				<text class="menu-desc">填写新的售后服务工单</text>
			</view>
			
			<view class="menu-item secondary" @click="navTo('/pages/work-order/list')">
				<view class="icon">📄</view>
				<text class="menu-title">我的工单</text>
				<text class="menu-desc">查看历史提交记录</text>
			</view>
		</view>
		
		<button class="logout-btn" @click="handleLogout">退出登录</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userName: '用户'
			}
		},
		onShow() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo && userInfo.name) {
				this.userName = userInfo.name;
			}
		},
		methods: {
			navTo(url) {
				uni.navigateTo({ url });
			},
			handleLogout() {
				uni.removeStorageSync('userInfo');
				uni.reLaunch({
					url: '/pages/login/login'
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 20px;
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.user-info-card {
		background: #fff;
		padding: 20px;
		border-radius: 10px;
		margin-bottom: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		
		.greeting {
			font-size: 18px;
			font-weight: bold;
			color: #333;
		}
		
		.role-tag {
			background: #e1f5fe;
			color: #0288d1;
			padding: 4px 10px;
			border-radius: 20px;
			font-size: 12px;
		}
	}
	
	.menu-grid {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	
	.menu-item {
		padding: 25px;
		border-radius: 10px;
		color: #fff;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 15px rgba(0,0,0,0.1);
		
		&.primary {
			background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		}
		
		&.secondary {
			background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		}
		
		.icon {
			font-size: 40px;
			margin-bottom: 10px;
			opacity: 0.8;
		}
		
		.menu-title {
			display: block;
			font-size: 20px;
			font-weight: bold;
			margin-bottom: 5px;
		}
		
		.menu-desc {
			font-size: 14px;
			opacity: 0.9;
		}
	}
	
	.logout-btn {
		margin-top: 40px;
		background: #fff;
		color: #ff5252;
		border: none;
		font-size: 14px;
	}
</style>