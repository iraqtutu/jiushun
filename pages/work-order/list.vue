<template>
	<view class="container">
		<!-- Search/Filter Header -->
		<view class="filter-header">
			<view class="filter-toggle" @click="showFilter = !showFilter">
				<text>🔍 {{ isAdmin ? '高级查询' : '日期筛选' }}</text>
				<text>{{ showFilter ? '▲' : '▼' }}</text>
			</view>
			
			<view v-if="showFilter" class="filter-panel">
				<view class="filter-row">
					<text class="label">日期范围:</text>
					<view class="date-picker-group">
						<picker mode="date" :value="filter.startDate" @change="bindStartDateChange">
							<view class="picker-input">{{ filter.startDate || '开始日期' }}</view>
						</picker>
						<text class="separator">-</text>
						<picker mode="date" :value="filter.endDate" @change="bindEndDateChange">
							<view class="picker-input">{{ filter.endDate || '结束日期' }}</view>
						</picker>
					</view>
				</view>
				<view class="filter-row" v-if="isAdmin">
					<input class="input" v-model="filter.customerName" placeholder="客户姓名" />
					<input class="input" v-model="filter.customerPhone" placeholder="客户手机号" />
				</view>
				<view class="filter-row" v-if="isAdmin">
					<input class="input" v-model="filter.reporterName" placeholder="报单人姓名" />
					<input class="input" v-model="filter.productModel" placeholder="产品型号" />
				</view>
				<view class="filter-actions">
					<button class="btn reset" size="mini" @click="resetFilter">重置</button>
					<button class="btn search" size="mini" type="primary" @click="doSearch">查询</button>
				</view>
			</view>
		</view>
		
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
					<view class="row" v-if="isAdmin && item.reporterName"><text class="label">报单人：</text>{{ item.reporterName }}</view>
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
				isLoading: false,
				showFilter: false,
				isAdmin: false,
				filter: {
					startDate: '',
					endDate: '',
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				}
			}
		},
		onShow() {
			this.checkRole();
			// Initialize dates if empty
			if (!this.filter.startDate) {
				this.resetFilter(); // Sets default dates
			}
			this.loadData();
		},
		methods: {
			checkRole() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.role) {
					this.isAdmin = userInfo.role.includes('admin');
				} else {
					this.isAdmin = false;
				}
				
				uni.setNavigationBarTitle({
					title: this.isAdmin ? '工单查询' : '我的工单'
				});
			},
			bindStartDateChange(e) {
				this.filter.startDate = e.detail.value;
			},
			bindEndDateChange(e) {
				this.filter.endDate = e.detail.value;
			},
			resetFilter() {
				const end = new Date();
				const start = new Date();
				start.setMonth(start.getMonth() - 1);
				
				this.filter = {
					startDate: this.formatDateSimple(start),
					endDate: this.formatDateSimple(end),
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				};
			},
			doSearch() {
				this.loadData();
			},
			loadData() {
				this.isLoading = true;
				
				// Prepare params
				const params = {};
				if (this.filter.startDate) {
					params.startDate = new Date(this.filter.startDate + 'T00:00:00').getTime();
				}
				if (this.filter.endDate) {
					params.endDate = new Date(this.filter.endDate + 'T23:59:59').getTime();
				}
				
				// Only add advanced filters if Admin
				if (this.isAdmin) {
					if (this.filter.customerName) params.customerName = this.filter.customerName;
					if (this.filter.customerPhone) params.customerPhone = this.filter.customerPhone;
					if (this.filter.reporterName) params.reporterName = this.filter.reporterName;
					if (this.filter.productModel) params.productModel = this.filter.productModel;
				}
				
				uniCloud.callFunction({
					name: 'work-order-manager',
					data: {
						action: 'list',
						uniIdToken: uni.getStorageSync('uni_id_token'),
						params: params
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
								submitTime: this.formatDate(item.create_date),
								reporterName: item.reporterName
							}));
						} else {
							uni.showToast({ title: '加载失败', icon: 'none' });
						}
					},
					fail: (err) => {
						this.isLoading = false;
						console.error(err);
						uni.showToast({ title: '网络错误', icon: 'none' });
					}
				});
			},
			formatDateSimple(date) {
				const y = date.getFullYear();
				const m = (date.getMonth() + 1).toString().padStart(2, '0');
				const d = date.getDate().toString().padStart(2, '0');
				return `${y}-${m}-${d}`;
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const h = d.getHours().toString().padStart(2, '0');
				const min = d.getMinutes().toString().padStart(2, '0');
				return `${y}-${m}-${date} ${h}:${min}`;
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
	
	.filter-header {
		background: #fff;
		border-radius: 8px;
		padding: 10px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		
		.filter-toggle {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-weight: bold;
			color: #333;
		}
		
		.filter-panel {
			margin-top: 15px;
			border-top: 1px solid #eee;
			padding-top: 10px;
			
			.filter-row {
				display: flex;
				align-items: center;
				margin-bottom: 10px;
				gap: 10px;
				
				.label {
					font-size: 14px;
					color: #666;
					width: 70px;
				}
				
				.input {
					flex: 1;
					border: 1px solid #ddd;
					border-radius: 4px;
					padding: 6px 10px;
					font-size: 14px;
				}
				
				.date-picker-group {
					flex: 1;
					display: flex;
					align-items: center;
					
					.picker-input {
						border: 1px solid #ddd;
						border-radius: 4px;
						padding: 6px 10px;
						font-size: 14px;
						min-width: 90px;
						text-align: center;
					}
					
					.separator {
						margin: 0 5px;
						color: #999;
					}
				}
			}
			
			.filter-actions {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 10px;
				
				.btn {
					margin: 0;
				}
			}
		}
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