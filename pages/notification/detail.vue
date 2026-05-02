<template>
	<view class="page-bg">
		<view class="detail-container" v-if="notification">
			<!-- Header Section -->
			<view class="detail-card">
				<view class="type-badge-top-right" :class="notification.type || 'system'">{{ notification.type === 'reminder' ? '业务提醒' : '系统公告' }}</view>
				<view class="header-main">
					<text class="title">{{ notification.title }}</text>
				</view>

				<view class="divider"></view>
				
				<!-- Content Section -->
				<view class="content-body">
					<text class="content-text">{{ notification.content }}</text>
				</view>
				
				<view class="detail-meta-footer">
					<view class="meta-item">
						<text class="meta-icon">🕒</text>
						<text class="meta-text">发布时间：{{ formatDate(notification.create_date, 'full') }}</text>
					</view>
					<view class="meta-item">
						<text class="meta-icon">👤</text>
						<text class="meta-text">发件人：系统管理员</text>
					</view>
				</view>
			</view>
			
			<!-- Bottom Action -->
			<view class="bottom-actions">
				<button class="back-btn" @click="goBack">返回列表</button>
			</view>
		</view>
		
		<!-- Skeleton / Loading -->
		<view class="loading-state" v-else>
			<view class="skeleton-title"></view>
			<view class="skeleton-meta"></view>
			<view class="skeleton-content"></view>
		</view>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				notification: null
			}
		},
		onLoad(options) {
			if (options.id) {
				this.loadDetail(options.id);
			}
		},
		methods: {
			async loadDetail(id) {
				uni.showLoading({ title: '加载中' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'getDetail',
						params: { id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.notification = res.result.data;
							this.markAsRead(id);
						} else {
							uni.showToast({ title: '通知不存在', icon: 'none' });
						}
					},
					complete: () => uni.hideLoading()
				});
			},
			markAsRead(id) {
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'markAsRead',
						params: { id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					}
				});
			},
			goBack() {
				uni.navigateBack();
			},
			formatDate(ts, mode) {
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const hh = d.getHours().toString().padStart(2, '0');
				const mm = d.getMinutes().toString().padStart(2, '0');
				if (mode === 'full') return `${y}年${m}月${date}日 ${hh}:${mm}`;
				return `${y}-${m}-${date}`;
			}
		}
	}
</script>
<style lang="scss" scoped>
	.page-bg {
		min-height: 100vh;
		background-color: #f7f9fc;
		padding: 20px 16px;
	}

	.detail-card {
		background: #fff;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.04);
		position: relative; /* CRITICAL: Ensure absolute children are relative to this card */
	}

	.header-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin-bottom: 0px; /* Remove margin-bottom as badge is now absolute and footer handles spacing */
	}

	.type-badge-top-right {
		position: absolute;
		top: 16px; /* 调整为更紧贴右上角 */
		right: 16px; /* 调整为更紧贴右上角 */
		z-index: 10; /* 确保在其他内容之上 */
		font-size: 11px;
		padding: 4px 12px;
		border-radius: 20px;
		font-weight: 600;

		&.system { color: #165dff; background: rgba(22, 93, 255, 0.08); }
		&.reminder { color: #ff7d00; background: rgba(255, 125, 0, 0.08); }
	}

	.title {
		font-size: 22px;
		font-weight: bold;
		color: #1d2129;
		line-height: 1.4;
		margin-bottom: 16px;
	}

	.content-body {
		.content-text {
			font-size: 16px;
			color: #4e5969;
			line-height: 1.8;
			white-space: pre-wrap;
			word-break: break-all;
		}
		padding-bottom: 30px; /* 增加正文底部间距 */
	}

	.detail-meta-footer {
		margin-top: 60px; /* Increased from 50px for more breathing room */
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 13px;
		color: #86909c;

		.meta-item {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.meta-icon { font-size: 12px; }
	}
</style>