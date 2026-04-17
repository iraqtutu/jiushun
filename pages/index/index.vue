<template>
	<view class="container">
		<!-- Header User Info Card -->
		<view class="welcome-card">
			<view class="welcome-bg"></view>
			<view class="welcome-content">
				<view class="user-info">
					<image src="/static/logo.png" class="avatar" mode="aspectFill" />
					<view class="user-text">
						<text class="greeting">欢迎你，{{ userName }}</text>
						<view class="role-badges">
							<text class="role-badge" v-for="(role, idx) in userRolesArray" :key="idx">{{ role }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- Service Actions Grid -->
		<view class="section-container">
			<view class="section-header">
				<text class="section-title">常用服务</text>
			</view>
			<view class="service-grid">
				<view class="service-card primary" @click="navTo('/pages/work-order/create')">
					<view class="icon-circle"><text class="icon">➕</text></view>
					<view class="card-info">
						<text class="title">新建服务单</text>
						<text class="desc">填写新服务单</text>
					</view>
				</view>
				
				<view class="service-card secondary" @click="navTo('/pages/work-order/list')">
					<view class="icon-circle"><text class="icon">📄</text></view>
					<view class="card-info">
						<text class="title">{{ isAdmin ? '服务单管理' : '我的服务单' }}</text>
						<text class="desc">{{ isAdmin ? '统筹所有服务单' : '历史提交记录' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- Secondary Actions List -->
		<view class="section-container mt-4">
			<view class="section-header">
				<text class="section-title">系统功能</text>
			</view>
			<view class="action-list">
				<view v-if="isAdmin" class="action-item" @click="navTo('/pages/admin/distributor-list')" hover-class="hover-effect">
					<view class="item-left">
						<view class="action-icon dealer-icon">🏬</view>
						<view class="item-text">
							<text class="item-title">经销商管理</text>
							<text class="item-desc">维护系统内客户及经销商基础信息</text>
						</view>
					</view>
					<view class="item-right">
						<text class="arrow">›</text>
					</view>
				</view>

				<view v-if="isAdmin" class="action-item" @click="navTo('/pages/admin/approval')" hover-class="hover-effect">
					<view class="item-left">
						<view class="action-icon admin-icon">👤</view>
						<view class="item-text">
							<text class="item-title">成员审批</text>
							<text class="item-desc">处理新用户的入驻申请</text>
						</view>
					</view>
					<view class="item-right">
						<view class="badge-wrapper" v-if="pendingApprovalCount > 0">
							<text class="badge">{{ pendingApprovalCount > 99 ? '99+' : pendingApprovalCount }}</text>
						</view>
						<text class="arrow">›</text>
					</view>
				</view>

				<view v-if="isAdmin" class="action-item" @click="navTo('/pages/admin/user-list')" hover-class="hover-effect">
					<view class="item-left">
						<view class="action-icon user-icon">👥</view>
						<view class="item-text">
							<text class="item-title">用户管理</text>
							<text class="item-desc">查看并调整所有用户角色</text>
						</view>
					</view>
					<view class="item-right">
						<text class="arrow">›</text>
					</view>
				</view>
				
				<view class="action-item" @click="navTo('/pages/feedback/list')" hover-class="hover-effect">
					<view class="item-left">
						<view class="action-icon feedback-icon">💬</view>
						<view class="item-text">
							<text class="item-title">意见反馈</text>
							<text class="item-desc">提交问题建议或申请协助</text>
						</view>
					</view>
					<view class="item-right">
						<view class="badge-wrapper" v-if="isAdmin && unreadFeedbackCount > 0">
							<text class="badge danger">{{ unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount }}</text>
						</view>
						<text class="arrow">›</text>
					</view>
				</view>
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
				isAdmin: false,
				pendingApprovalCount: 0,
				unreadFeedbackCount: 0
			}
		},
		computed: {
			userRolesArray() {
				return this.userRoles ? this.userRoles.split(' / ') : [];
			}
		},
		onShow() {
			this.updateLocalInfo();
			this.refreshUserInfo();
			if (this.isAdmin) {
				this.loadBadgeCounts();
			}
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
					timeout: 10000,
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
							},
							fail: (e) => {
								console.warn('refreshUserInfo cloud call failed:', e);
							}
						});
					},
					fail: (e) => {
						console.warn('refreshUserInfo login failed:', e);
					}
				});
			},
			loadBadgeCounts() {
				// 获取待审批数量
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'getApplications',
						params: { type: 'pending' },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.pendingApprovalCount = res.result.data ? res.result.data.length : 0;
						}
					},
					fail: (e) => {
						console.warn('getApplications failed:', e);
					}
				});

				// 获取未处理反馈数量（status !== 1 表示未回复）
				uniCloud.callFunction({
					name: 'feedback-manager',
					data: {
						action: 'list',
						params: { page: 1, pageSize: 100 },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							const unreadList = (res.result.data || []).filter(item => item.status !== 1);
							this.unreadFeedbackCount = unreadList.length;
						}
					},
					fail: (e) => {
						console.warn('feedback list failed:', e);
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
	page {
		background-color: #f4f6f8;
	}

	.container {
		padding: 16px;
		min-height: 100vh;
	}
	
	/* Welcome Card Module */
	.welcome-card {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 24px;
		box-shadow: 0 8px 16px rgba(22, 93, 255, 0.15);
		
		.welcome-bg {
			position: absolute;
			top: 0; left: 0; right: 0; bottom: 0;
			background: linear-gradient(135deg, #165dff, #4080ff);
			z-index: 1;
		}
		
		.welcome-content {
			position: relative;
			z-index: 2;
			padding: 24px 20px;
		}
		
		.user-info {
			display: flex;
			align-items: center;
			gap: 16px;
			
			.avatar {
				width: 56px;
				height: 56px;
				border-radius: 50%;
				background-color: #fff;
				border: 2px solid rgba(255, 255, 255, 0.4);
			}
			
			.user-text {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			
			.greeting {
				font-size: 18px;
				font-weight: 600;
				color: #fff;
				letter-spacing: 0.5px;
			}
			
			.role-badges {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
				
				.role-badge {
					background: rgba(255, 255, 255, 0.2);
					color: #fff;
					padding: 2px 8px;
					border-radius: 4px;
					font-size: 11px;
					font-weight: 500;
					backdrop-filter: blur(4px);
				}
			}
		}
	}

	/* Section Globals */
	.section-container {
		margin-bottom: 20px;
		
		&.mt-4 { margin-top: 24px; }
	}
	
	.section-header {
		margin-bottom: 12px;
		padding-left: 4px;
		
		.section-title {
			font-size: 16px;
			font-weight: 600;
			color: #1d2129;
		}
	}
	
	/* Service Grid (Top action buttons) */
	.service-grid {
		display: flex;
		gap: 12px;
	}
	
	.service-card {
		flex: 1;
		background: #fff;
		border-radius: 12px;
		padding: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		gap: 12px;
		position: relative;
		overflow: hidden;
		
		&::after {
			content: '';
			position: absolute;
			right: -10px;
			bottom: -10px;
			width: 60px;
			height: 60px;
			border-radius: 50%;
			opacity: 0.05;
			z-index: 1;
		}
		
		&.primary::after { background-color: #165dff; }
		&.secondary::after { background-color: #00b42a; }
		
		.icon-circle {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 2;
		}
		
		&.primary .icon-circle { background: #e8f3ff; }
		&.secondary .icon-circle { background: #e6fcf5; }
		
		.icon { font-size: 20px; }
		
		.card-info {
			display: flex;
			flex-direction: column;
			gap: 4px;
			z-index: 2;
			
			.title { font-size: 15px; font-weight: bold; color: #1d2129; }
			.desc { font-size: 12px; color: #86909c; }
		}
	}
	
	/* Action List (Bottom entries) */
	.action-list {
		background: #fff;
		border-radius: 12px;
		padding: 0 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}
	
	.action-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-bottom: 1px solid #f2f3f5;
		
		&:last-child {
			border-bottom: none;
		}
		
		.item-left {
			display: flex;
			align-items: center;
			gap: 12px;
			
			.action-icon {
				width: 36px;
				height: 36px;
				border-radius: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				
				&.admin-icon { background: #fff7e8; }
				&.dealer-icon { background: #e6fcf5; }
				&.feedback-icon { background: #e8f3ff; }
				&.user-icon { background: #f0f5ff; }
			}
			
			.item-text {
				display: flex;
				flex-direction: column;
				gap: 4px;
				
				.item-title { font-size: 15px; font-weight: 600; color: #1d2129; }
				.item-desc { font-size: 12px; color: #86909c; }
			}
		}
		
		.item-right {
			display: flex;
			align-items: center;
			gap: 8px;
			.arrow {
				font-size: 24px;
				color: #c9cdd4;
				font-weight: 300;
			}
		}
	}

	.badge-wrapper {
		position: relative;
		.badge {
			position: absolute;
			top: -6px;
			right: -6px;
			min-width: 18px;
			height: 18px;
			background: #ff4d4f;
			color: #fff;
			font-size: 10px;
			font-weight: 600;
			border-radius: 9px;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 5px;
			box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);

			&.danger {
				background: #ff7d00;
				box-shadow: 0 2px 4px rgba(255, 125, 0, 0.3);
			}
		}
	}

	.hover-effect {
		background-color: rgba(0, 0, 0, 0.02);
	}
</style>