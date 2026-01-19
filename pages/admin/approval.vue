<template>
	<view class="container">
		<view class="tabs">
			<view 
				class="tab-item" 
				:class="{ active: currentTab === 'pending' }" 
				@click="switchTab('pending')"
			>
				待审批
			</view>
			<view 
				class="tab-item" 
				:class="{ active: currentTab === 'processed' }" 
				@click="switchTab('processed')"
			>
				已审批
			</view>
		</view>
		
		<view class="list">
			<view class="item" v-for="(item, index) in list" :key="item._id">
				<view class="info-row">
					<text class="name">{{ item.name }}</text>
					<view class="right-badges">
						<text class="role-badge">{{ item.role }}</text>
						<text v-if="currentTab === 'processed'" class="status-badge" :class="getStatusClass(item.status)">
							{{ getStatusText(item.status) }}
						</text>
					</view>
				</view>
				<view class="detail-row">手机号：{{ item.mobile }}</view>
				<view class="detail-row">申请时间：{{ formatDate(item.create_date) }}</view>
				
				<template v-if="currentTab === 'processed'">
					<view class="detail-row">审批人：{{ item.auditor_name || '未知' }}</view>
					<view class="detail-row">审批时间：{{ formatDate(item.audit_date) }}</view>
				</template>
				
				<view class="reason-box">
					<text class="label">申请理由：</text>
					<text class="content">{{ item.reason }}</text>
				</view>
				
				<view v-if="item.status === 2 && item.rejectReason" class="reason-box reject">
					<text class="label">拒绝理由：</text>
					<text class="content">{{ item.rejectReason }}</text>
				</view>
				
				<view class="action-row" v-if="currentTab === 'pending'">
					<button class="btn reject" size="mini" @click="handleReject(item)">拒绝</button>
					<button class="btn approve" size="mini" @click="handleApprove(item)">通过</button>
				</view>
			</view>
		</view>
		
		<view v-if="list.length === 0 && !isLoading" class="empty">
			<text>暂无{{ currentTab === 'pending' ? '待审批' : '已审批' }}申请</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 'pending',
				list: [],
				isLoading: false
			}
		},
		onShow() {
			this.loadData();
		},
		methods: {
			switchTab(tab) {
				if (this.currentTab === tab) return;
				this.currentTab = tab;
				this.list = [];
				this.loadData();
			},
			loadData() {
				this.isLoading = true;
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'getApplications',
						params: { type: this.currentTab },
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
			getStatusText(status) {
				if (status === 1) return '已通过';
				if (status === 2) return '已拒绝';
				return '未知';
			},
			getStatusClass(status) {
				if (status === 1) return 'approved';
				if (status === 2) return 'rejected';
				return '';
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
	
	.tabs {
		display: flex;
		background: #fff;
		padding: 10px 10px 0;
		border-radius: 8px 8px 0 0;
		margin-bottom: 10px;
		
		.tab-item {
			flex: 1;
			text-align: center;
			padding: 10px 0;
			font-size: 15px;
			color: #666;
			border-bottom: 2px solid transparent;
			
			&.active {
				color: #1976d2;
				border-bottom-color: #1976d2;
				font-weight: bold;
			}
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
			
			.right-badges {
				display: flex;
				gap: 8px;
				align-items: center;
			}
			
			.role-badge {
				font-size: 12px;
				background: #e3f2fd;
				color: #1976d2;
				padding: 2px 8px;
				border-radius: 4px;
			}
			
			.status-badge {
				font-size: 12px;
				padding: 2px 8px;
				border-radius: 4px;
				
				&.approved {
					background: #e8f5e9;
					color: #4caf50;
				}
				
				&.rejected {
					background: #ffebee;
					color: #ef5350;
				}
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
			
			&.reject {
				background: #ffebee;
				color: #c62828;
			}
			
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