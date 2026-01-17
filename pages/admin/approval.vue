<template>
	<view class="container">
		<view class="header">
			<text class="title">待审批申请 ({{ list.length }})</text>
		</view>
		
		<view class="list">
			<view class="item" v-for="(item, index) in list" :key="item._id">
				<view class="info-row">
					<text class="name">{{ item.name }}</text>
					<text class="role-badge">{{ item.role }}</text>
				</view>
				<view class="detail-row">手机号：{{ item.mobile }}</view>
				<view class="detail-row">申请时间：{{ formatDate(item.create_date) }}</view>
				<view class="reason-box">
					<text class="label">理由：</text>
					<text class="content">{{ item.reason }}</text>
				</view>
				
				<view class="action-row">
					<button class="btn reject" size="mini" @click="handleReject(item)">拒绝</button>
					<button class="btn approve" size="mini" @click="handleApprove(item)">通过</button>
				</view>
			</view>
		</view>
		
		<view v-if="list.length === 0 && !isLoading" class="empty">
			<text>暂无待审批申请</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				isLoading: false
			}
		},
		onShow() {
			this.loadData();
		},
		methods: {
			loadData() {
				this.isLoading = true;
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'getApplications',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						this.isLoading = false;
						if (res.result.code === 0) {
							this.list = res.result.data;
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					fail: () => {
						this.isLoading = false;
					}
				});
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
			},
			handleApprove(item) {
				uni.showModal({
					title: '确认通过',
					content: `确认将用户 ${item.name} 设为 ${item.role} 吗？`,
					success: (res) => {
						if (res.confirm) {
							this.audit(item._id, 1);
						}
					}
				});
			},
			handleReject(item) {
				uni.showModal({
					title: '拒绝申请',
					editable: true,
					placeholderText: '请输入拒绝理由',
					success: (res) => {
						if (res.confirm) {
							this.audit(item._id, 2, res.content);
						}
					}
				});
			},
			audit(id, status, reason = '') {
				uni.showLoading({ title: '处理中' });
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'auditApplication',
						params: { id, status, rejectReason: reason },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						uni.hideLoading();
						if (res.result.code === 0) {
							uni.showToast({ title: '操作成功' });
							this.loadData(); // Refresh
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.header {
		margin-bottom: 15px;
		.title {
			font-size: 16px;
			font-weight: bold;
			color: #333;
		}
	}
	
	.item {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
		
		.info-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
			
			.name {
				font-size: 18px;
				font-weight: bold;
			}
			
			.role-badge {
				font-size: 12px;
				background: #e3f2fd;
				color: #1976d2;
				padding: 2px 8px;
				border-radius: 4px;
			}
		}
		
		.detail-row {
			font-size: 14px;
			color: #666;
			margin-bottom: 5px;
		}
		
		.reason-box {
			background: #f9f9f9;
			padding: 8px;
			border-radius: 4px;
			margin: 10px 0;
			font-size: 14px;
			
			.label { color: #999; }
			.content { color: #333; }
		}
		
		.action-row {
			display: flex;
			justify-content: flex-end;
			gap: 10px;
			margin-top: 10px;
			
			.btn {
				margin: 0;
				font-size: 14px;
				
				&.approve {
					background-color: #4caf50;
					color: #fff;
				}
				
				&.reject {
					background-color: #ef5350;
					color: #fff;
				}
			}
		}
	}
	
	.empty {
		text-align: center;
		color: #999;
		margin-top: 50px;
	}
</style>