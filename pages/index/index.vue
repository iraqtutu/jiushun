<template>
	<view class="container">
		<view class="user-info-card">
			<view class="greeting">欢迎你，{{ userName }}</view>
			<view class="role-tag">{{ userRoles }}</view>
		</view>
		
		<view class="menu-grid">
			<view class="menu-item primary" @click="navTo('/pages/work-order/create')">
				<view class="icon">+</view>
				<text class="menu-title">新建派工单</text>
				<text class="menu-desc">填写新的售后服务工单</text>
			</view>
			
			<view class="menu-item secondary" @click="navTo('/pages/work-order/list')">
				<view class="icon">📄</view>
				<text class="menu-title">{{ isAdmin ? '工单查询' : '我的工单' }}</text>
				<text class="menu-desc">{{ isAdmin ? '查询所有工单记录' : '查看历史提交记录' }}</text>
			</view>
			
			<view v-if="isAdmin" class="menu-item admin" @click="navTo('/pages/admin/approval')">
				<view class="icon">👮</view>
				<text class="menu-title">成员审批</text>
				<text class="menu-desc">审核新用户申请</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userName: '用户',
				userRoles: '',
				isAdmin: false
			}
		},
		onShow() {
			this.updateLocalInfo();
			this.refreshUserInfo();
		},
		methods: {
			updateLocalInfo() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					const roles = userInfo.role || [];
					
					// Security: If no authorized roles, kick back to login to check application status
					const authorizedRoles = ['玖顺员工', '经销商人员', '服务人员', 'admin'];
					const isAuthorized = roles.some(r => authorizedRoles.includes(r));
					
					if (!isAuthorized) {
						uni.reLaunch({ url: '/pages/login/login' });
						return;
					}

					this.userName = userInfo.nickname || userInfo.name || '用户';
					this.userRoles = roles.join(' / ');
					
					// Only 'admin' can see the approval menu
					this.isAdmin = roles.includes('admin');
				} else {
					// No user info at all
					uni.reLaunch({ url: '/pages/login/login' });
				}
			},
			refreshUserInfo() {
				// Silent refresh to check latest roles
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						uniCloud.callFunction({
							name: 'user-center',
							data: {
								action: 'login', // Re-using login to get fresh info
								params: { code: loginRes.code }
							},
							success: (res) => {
								if (res.result.code === 0) {
									const freshInfo = res.result.userInfo;
									// Preserve token, just update info
									uni.setStorageSync('userInfo', freshInfo);
									this.updateLocalInfo();
								}
							}
						});
					}
				});
			},
			navTo(url) {
				uni.navigateTo({ url });
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
		
		&.admin {
			background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
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
</style>