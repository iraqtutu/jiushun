<template>
	<view class="container">
		<view class="detail card" v-if="notification">
			<view class="title">{{ notification.title }}</view>
			<view class="meta">
				<text class="date">发布时间：{{ formatDate(notification.create_date) }}</text>
				<text class="type" v-if="notification.type">类型：{{ notification.type === 'system' ? '系统通知' : notification.type }}</text>
			</view>
			<view class="divider"></view>
			<view class="content">
				<text>{{ notification.content }}</text>
			</view>
		</view>
		<view class="loading" v-else>
			<text>加载中...</text>
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
				uni.showLoading({ title: '正在获取' });
				
				// 1. 获取详情 (通过云函数，避开 Schema 权限复杂配置)
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
							// 2. 进入详情页即视为已读
							this.markAsRead(id);
						} else {
							uni.showToast({ title: res.result.msg || '通知不存在', icon: 'none' });
						}
					},
					fail: () => {
						uni.showToast({ title: '加载失败', icon: 'none' });
					},
					complete: () => {
						uni.hideLoading();
					}
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
			formatDate(ts) {
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const hh = d.getHours().toString().padStart(2, '0');
				const mm = d.getMinutes().toString().padStart(2, '0');
				return `${y}-${m}-${date} ${hh}:${mm}`;
			}
		}
	}
</script>

<style lang="scss">
	page { background-color: #f7f8fa; }
	.container { padding: 12px; }
	
	.card {
		background: #fff;
		border-radius: 10px;
		padding: 24px 20px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.03);
	}
	
	.detail {
		.title {
			font-size: 20px;
			font-weight: bold;
			color: #323233;
			line-height: 1.4;
			margin-bottom: 12px;
		}
		
		.meta {
			display: flex;
			flex-direction: column;
			gap: 4px;
			font-size: 13px;
			color: #969799;
			margin-bottom: 16px;
		}
		
		.divider {
			height: 1px;
			background-color: #ebedf0;
			margin-bottom: 20px;
		}
		
		.content {
			font-size: 16px;
			color: #323233;
			line-height: 1.6;
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
	
	.loading {
		padding-top: 100px;
		text-align: center;
		color: #969799;
	}
</style>