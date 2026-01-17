<template>
	<view class="container">
		<!-- Search/Filter could go here -->
		
		<view class="order-list">
			<view class="order-item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
				<view class="order-header">
					<text class="order-no">{{ item.orderNo }}</text>
					<text class="status-tag">已提交</text>
				</view>
				<view class="order-content">
					<view class="row"><text class="label">客户姓名：</text>{{ item.customerName }}</view>
					<view class="row"><text class="label">服务类型：</text>{{ item.serviceType }}</view>
					<view class="row"><text class="label">机器编号：</text>{{ item.machineNo }}</view>
					<view class="row"><text class="label">提交时间：</text>{{ item.submitTime }}</view>
				</view>
			</view>
		</view>
		
		<view v-if="list.length === 0" class="empty-state">
			<text>暂无工单记录</text>
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
					name: 'work-order-manager',
					data: {
						action: 'list',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						this.isLoading = false;
						if (res.result.code === 0) {
							// Transform data for display if needed
							this.list = res.result.data.map(item => ({
								id: item._id,
								orderNo: item.orderNo,
								customerName: item.customerInfo?.name || '未知',
								serviceType: item.serviceInfo?.type || '未知',
								machineNo: item.productInfo?.machineNo || '-',
								submitTime: this.formatDate(item.create_date)
							}));
						} else {
							uni.showToast({ title: '加载失败', icon: 'none' });
						}
					},
					fail: (err) => {
						this.isLoading = false;
						console.error(err);
					}
				});
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
			},
			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/work-order/detail?id=${item.id}`
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
	
	.order-item {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		
		.order-header {
			display: flex;
			justify-content: space-between;
			border-bottom: 1px solid #eee;
			padding-bottom: 10px;
			margin-bottom: 10px;
			
			.order-no {
				font-weight: bold;
				color: #333;
			}
			
			.status-tag {
				font-size: 12px;
				color: #4caf50;
				background: #e8f5e9;
				padding: 2px 6px;
				border-radius: 4px;
			}
		}
		
		.order-content {
			.row {
				font-size: 14px;
				color: #666;
				margin-bottom: 5px;
				
				.label {
					color: #999;
					margin-right: 5px;
				}
			}
		}
	}
	
	.empty-state {
		text-align: center;
		margin-top: 50px;
		color: #999;
	}
</style>