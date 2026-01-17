<template>
	<view class="container">
		<view class="section">
			<view class="section-title">基础信息</view>
			<view class="detail-item">
				<text class="label">派工单号</text>
				<text class="value">{{ order.orderNo }}</text>
			</view>
			<view class="detail-item">
				<text class="label">填单人</text>
				<text class="value">{{ order.creator }}</text>
			</view>
		</view>
		
		<view class="section">
			<view class="section-title">客户资料</view>
			<view class="detail-item">
				<text class="label">姓名</text>
				<text class="value">{{ order.customerName }}</text>
			</view>
			<view class="detail-item">
				<text class="label">电话</text>
				<text class="value">{{ order.phone }}</text>
			</view>
			<view class="detail-item">
				<text class="label">地址</text>
				<text class="value">{{ order.address }}</text>
			</view>
		</view>
		
		<!-- More sections would follow similar pattern -->
		
		<view class="section">
			<view class="section-title">服务内容</view>
			<view class="detail-item">
				<text class="label">服务类型</text>
				<text class="value">{{ order.serviceType }}</text>
			</view>
			<view class="detail-item">
				<text class="label">故障分类</text>
				<text class="value">{{ order.faultCategory }}</text>
			</view>
			<view class="detail-block">
				<text class="label">故障现象</text>
				<text class="block-value">{{ order.faultDesc }}</text>
			</view>
			<view class="detail-block">
				<text class="label">处理方法</text>
				<text class="block-value">{{ order.handleDesc }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				order: {
					orderNo: '',
					creator: '',
					customerName: '',
					phone: '',
					address: '',
					serviceType: '',
					faultCategory: '',
					faultDesc: '',
					handleDesc: ''
				}
			}
		},
		onLoad(options) {
			if (options.id) {
				this.loadDetail(options.id);
			}
		},
		methods: {
			loadDetail(id) {
				uni.showLoading({ title: '加载中' });
				uniCloud.callFunction({
					name: 'work-order-manager',
					data: {
						action: 'get',
						params: { id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						uni.hideLoading();
						if (res.result.code === 0) {
							const data = res.result.data;
							// Map DB structure to View structure
							this.order = {
								orderNo: data.orderNo,
								creator: '自填', // Could fetch creator name if needed
								customerName: data.customerInfo?.name,
								phone: data.customerInfo?.phone,
								address: data.customerInfo?.address,
								serviceType: data.serviceInfo?.type,
								faultCategory: data.serviceInfo?.faultCategory,
								faultDesc: data.serviceInfo?.faultDesc,
								handleDesc: data.serviceInfo?.handleDesc
							};
						} else {
							uni.showToast({ title: '加载失败', icon: 'none' });
						}
					},
					fail: () => {
						uni.hideLoading();
						uni.showToast({ title: '网络错误', icon: 'none' });
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
	
	.section {
		background: #fff;
		padding: 15px;
		border-radius: 8px;
		margin-bottom: 15px;
	}
	
	.section-title {
		font-size: 16px;
		font-weight: bold;
		border-left: 4px solid #007aff;
		padding-left: 10px;
		margin-bottom: 15px;
	}
	
	.detail-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
		font-size: 14px;
		
		.label {
			color: #999;
		}
		
		.value {
			color: #333;
			max-width: 70%;
			text-align: right;
		}
	}
	
	.detail-block {
		margin-bottom: 12px;
		font-size: 14px;
		
		.label {
			display: block;
			color: #999;
			margin-bottom: 5px;
		}
		
		.block-value {
			display: block;
			color: #333;
			background: #f9f9f9;
			padding: 10px;
			border-radius: 4px;
		}
	}
</style>