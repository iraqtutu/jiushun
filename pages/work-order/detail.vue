<template>
	<view class="container">
		<!-- Section A: Basic Info -->
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
			<view class="detail-item">
				<text class="label">状态</text>
				<text class="value status-tag">{{ order.status || '已完成' }}</text>
			</view>
		</view>
		
		<!-- Section B: Customer Info -->
		<view class="section">
			<view class="section-title">客户资料</view>
			<view class="detail-item">
				<text class="label">姓名</text>
				<text class="value">{{ order.customer.name }}</text>
			</view>
			<view class="detail-item">
				<text class="label">电话</text>
				<text class="value clickable" @click="makeCall(order.customer.phone)">{{ order.customer.phone }}</text>
			</view>
			<view class="detail-item">
				<text class="label">地址</text>
				<text class="value">{{ order.customer.address }}</text>
			</view>
			<view class="detail-item">
				<text class="label">农机用途</text>
				<text class="value">{{ order.customer.usageType }}</text>
			</view>
			<view class="detail-item">
				<text class="label">经销商</text>
				<text class="value">{{ order.customer.distributorName || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">报修时间</text>
				<text class="value">{{ formatDate(order.customer.reportTime, 'date') }}</text>
			</view>
		</view>

		<!-- Section C: Product Info -->
		<view class="section">
			<view class="section-title">产品信息</view>
			<view class="detail-item">
				<text class="label">机器编号</text>
				<text class="value">{{ order.product.machineNo }}</text>
			</view>
			<view class="detail-item">
				<text class="label">发动机号</text>
				<text class="value">{{ order.product.engineNo }}</text>
			</view>
			<view class="detail-item">
				<text class="label">产品型号</text>
				<text class="value">{{ order.product.model }}</text>
			</view>
			<view class="detail-item">
				<text class="label">生产日期</text>
				<text class="value">{{ formatDate(order.product.productionDate, 'date') }}</text>
			</view>
			<view class="detail-block" v-if="order.product.platePhoto">
				<text class="label">铭牌照片</text>
				<image :src="order.product.platePhoto" mode="aspectFill" class="detail-img" @click="previewImage(order.product.platePhoto)"></image>
			</view>
		</view>
		
		<!-- Section D: Service Info -->
		<view class="section">
			<view class="section-title">服务内容</view>
			<view class="detail-item">
				<text class="label">服务类型</text>
				<text class="value">{{ order.service.type }}</text>
			</view>
			<view class="detail-item">
				<text class="label">故障分类</text>
				<text class="value">{{ Array.isArray(order.service.faultCategories) ? order.service.faultCategories.join('、') : (order.service.faultCategory || order.service.faultCategories || '-') }}</text>
			</view>
			<view class="detail-block">
				<text class="label">故障现象</text>
				<text class="block-value">{{ order.service.faultDesc }}</text>
			</view>
			<view class="detail-block">
				<text class="label">处理方法</text>
				<text class="block-value">{{ order.service.handleDesc }}</text>
			</view>
			<view class="detail-item">
				<text class="label">完成时间</text>
				<text class="value">{{ formatDate(order.service.finishTime, 'datetime') }}</text>
			</view>
			
			<!-- Parts List -->
			<view class="detail-block" v-if="order.service.parts && order.service.parts.length > 0">
				<text class="label">更换零件</text>
				<view class="parts-table">
					<view class="parts-header">
						<text class="th flex-2">名称</text>
						<text class="th flex-1">数量</text>
						<text class="th flex-1" v-if="order.service.isChargeable === '收费'">金额</text>
						<text class="th flex-1">来源</text>
					</view>
					<view class="parts-row" v-for="(part, idx) in order.service.parts" :key="idx">
						<view class="td flex-2">
							<text class="part-name">{{ part.name }}</text>
							<view class="part-badges">
								<text class="p-badge code" v-if="part.code">{{ part.code }}</text>
								<text class="p-badge action" :class="part.oldPartAction === '丢弃' ? 'gray' : 'blue'">
									旧件: {{ part.oldPartAction || '带回' }}
								</text>
							</view>
						</view>
						<text class="td flex-1 center">x{{ part.count }}</text>
						<view class="td flex-1 center" v-if="order.service.isChargeable === '收费'">
							<text class="red">￥{{ part.total || ((part.price || 0) * (part.count || 0)).toFixed(1) }}</text>
						</view>
						<view class="td flex-1 center" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
							<text class="source-text" :class="part.source === '自带' ? 'gray' : 'blue'">{{ part.source || '自带' }}</text>
							<text v-if="part.sourceRemark" class="source-remark">{{ part.sourceRemark }}</text>
						</view>
					</view>
				</view>
				<view class="parts-total" v-if="order.service.isChargeable === '收费'" style="text-align: right; margin-top: 8px; font-size: 13px; font-weight: bold; color: #333;">
					零件金额小计: <text class="red">￥{{ partsTotal }}</text>
				</view>
			</view>

			<!-- Site Photos -->
			<view class="detail-block" v-if="order.service.sitePhotos && order.service.sitePhotos.length > 0">
				<text class="label">现场照片</text>
				<view class="photo-grid">
					<image v-for="(img, idx) in order.service.sitePhotos" :key="idx" :src="img" mode="aspectFill" class="grid-img" @click="previewImage(img, order.service.sitePhotos)"></image>
				</view>
			</view>
		
			<!-- Payment Info -->
			<view class="detail-block" v-if="order.service.isChargeable" style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 15px;">
				<view class="detail-item" style="margin-bottom: 5px;">
					<text class="label">收费类型</text>
					<text class="value" :class="order.service.isChargeable === '收费' ? 'red bold' : 'green'">{{ order.service.isChargeable }}</text>
				</view>
				<view class="detail-item" v-if="order.service.isChargeable === '收费' && order.service.paymentMethod">
					<text class="label">支付方式</text>
					<text class="value">{{ order.service.paymentMethod }}</text>
				</view>
			</view>
		</view>

		<!-- Section E: Additional Fees & Labor Info -->
		<view class="section" v-if="order.additionalFees">
			<view class="section-title">路程与工时</view>
			
			<view class="detail-block" v-if="order.additionalFees.travelFee">
				<text class="label">路程核算</text>
				<view class="fee-row">
					<text class="fee-desc">公里数: {{ order.additionalFees.travelFee.distance || 0 }}km × 单价: ￥{{ order.additionalFees.travelFee.unitPrice || 0 }}/km</text>
					<text class="fee-amount">￥{{ order.additionalFees.travelFee.total || 0 }}</text>
				</view>
			</view>

			<view class="detail-block" v-if="order.additionalFees.laborFee">
				<text class="label">工时记录</text>
				<view class="fee-detail" v-if="order.additionalFees.laborFee.departureTime">
					<text class="time-line">出发: {{ formatDate(order.additionalFees.laborFee.departureTime, 'datetime') }}</text>
					<text class="time-line">完成: {{ formatDate(order.additionalFees.laborFee.finishTime, 'datetime') }}</text>
					<text class="time-line">预计返程: {{ order.additionalFees.laborFee.returnDuration || 0 }} 分钟</text>
				</view>
				<view class="fee-row" style="margin-top: 8px;">
					<text class="fee-desc">总工时: {{ order.additionalFees.laborFee.totalHours || 0 }}h × 单价: ￥{{ order.additionalFees.laborFee.unitPrice || 0 }}/h</text>
					<text class="fee-amount">￥{{ order.additionalFees.laborFee.total || 0 }}</text>
				</view>
			</view>

			<view class="detail-item" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;" v-if="order.additionalFees.totalAmount">
				<text class="label" style="color: #333; font-weight: bold; font-size: 15px; width: auto;">附加费用小计</text>
				<text class="value red" style="font-size: 16px; font-weight: bold;">￥{{ order.additionalFees.totalAmount }}</text>
			</view>
		</view>
		
		<!-- Settlement Dashboard -->
		<view class="section settlement-section" v-if="order.service.isChargeable === '收费'">
			<view class="settlement-header">
				<text>工单应收合计</text>
				<text class="grand-total">￥{{ grandTotal }}</text>
			</view>
		</view>

		<!-- Section F: Confirmation -->
		<view class="section">
			<view class="section-title">客户确认</view>
			<view class="detail-block" v-if="order.confirm.machineUserPhoto">
				<text class="label">人机合影</text>
				<image :src="order.confirm.machineUserPhoto" mode="aspectFill" class="detail-img" @click="previewImage(order.confirm.machineUserPhoto)"></image>
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
					status: '',
					customer: {},
					product: {},
					service: {},
					confirm: {},
					additionalFees: null
				}
			}
		},
		computed: {
			partsTotal() {
				if (!this.order.service || !this.order.service.parts) return "0.0";
				return this.order.service.parts.reduce((sum, part) => {
					let lineTotal = part.total ? Number(part.total) : (Number(part.price || 0) * Number(part.count || 0));
					return sum + lineTotal;
				}, 0).toFixed(1);
			},
			grandTotal() {
				let addFee = this.order.additionalFees ? Number(this.order.additionalFees.totalAmount || 0) : 0;
				let pTotal = Number(this.partsTotal);
				return (addFee + pTotal).toFixed(1);
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
							// Use default empty objects to prevent v-if errors
							this.order = {
								orderNo: data.orderNo,
								creator: data.userInfo ? (data.userInfo.nickname || data.userInfo.name || '未知') : '未知', // Assuming DB joins userInfo
								status: data.status, // Assuming status exists
								customer: data.customer || {},
								product: data.product || {},
								service: data.service || {},
								confirm: data.customerConfirm || {},
								additionalFees: data.additionalFees || null
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
			},
			formatDate(timestamp, type) {
				if (!timestamp) return '-';
				const date = new Date(timestamp);
				const y = date.getFullYear();
				const m = String(date.getMonth() + 1).padStart(2, '0');
				const d = String(date.getDate()).padStart(2, '0');
				if (type === 'date') return `${y}-${m}-${d}`;
				const hh = String(date.getHours()).padStart(2, '0');
				const mm = String(date.getMinutes()).padStart(2, '0');
				return `${y}-${m}-${d} ${hh}:${mm}`;
			},
			makeCall(phone) {
				if(phone) uni.makePhoneCall({ phoneNumber: phone });
			},
			previewImage(current, list) {
				const urls = list || [current];
				uni.previewImage({
					current: current,
					urls: urls
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
		padding-bottom: 30px;
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
		align-items: flex-start;
		
		.label {
			color: #999;
			width: 80px;
			flex-shrink: 0;
		}
		
		.value {
			color: #333;
			flex: 1;
			text-align: right;
			word-break: break-all;
			
			&.clickable {
				color: #007aff;
				text-decoration: underline;
			}
		}
	}
	
	.detail-block {
		margin-bottom: 12px;
		font-size: 14px;
		
		.label {
			display: block;
			color: #999;
			margin-bottom: 8px;
		}
		
		.block-value {
			display: block;
			color: #333;
			background: #f9f9f9;
			padding: 10px;
			border-radius: 4px;
		}
		
		.detail-img {
			width: 100%;
			height: 200px;
			border-radius: 4px;
			background-color: #eee;
		}
	}
	
	.photo-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		
		.grid-img {
			width: calc(33.33% - 7px);
			height: 80px;
			border-radius: 4px;
			background-color: #eee;
		}
	}
	
	.parts-table {
		border: 1px solid #eee;
		border-radius: 4px;
		overflow: hidden;
		
		.parts-header {
			display: flex;
			background: #f0f0f0;
			padding: 8px 5px;
			font-weight: bold;
			font-size: 12px;
			color: #555;
		}
		
		.parts-row {
			display: flex;
			padding: 10px 5px;
			border-top: 1px solid #f2f3f5;
			font-size: 13px;
			align-items: center;
			
			.part-name {
				display: block;
				font-weight: bold;
				color: #1d2129;
				margin-bottom: 4px;
			}
			.part-badges {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
				.p-badge {
					font-size: 10px;
					padding: 1px 4px;
					border-radius: 3px;
					&.code { background: #f2f3f5; color: #86909c; }
					&.action { 
						&.blue { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; } 
						&.gray { background: #f5f5f5; color: #999; border: 1px solid #ddd; } 
					}
				}
			}
			
			.source-text { font-size: 12px; &.blue { color: #1890ff; } &.gray { color: #86909c; } }
			.source-remark { display: block; font-size: 10px; color: #999; margin-top: 2px; }
			
			.red { color: #ff5252; }
		}
		
		.flex-1 { flex: 1; }
		.flex-2 { flex: 2; }
		.center { text-align: center; }
		.th { text-align: center; }
		.th.flex-2 { text-align: left; padding-left: 5px;}
	}

	/* Fees Styles */
	.fee-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f9f9f9;
		padding: 8px 10px;
		border-radius: 6px;
	}
	.fee-desc { font-size: 12px; color: #666; }
	.fee-amount { font-size: 14px; font-weight: bold; color: #ff5252; }

	.fee-detail {
		background: #fdfdfd;
		border: 1px dashed #eee;
		padding: 8px 10px;
		border-radius: 6px;
		margin-bottom: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.time-line { font-size: 12px; color: #888; }
	
	.settlement-section {
		background: linear-gradient(135deg, #1d2129, #333);
		color: #fff;
		border-radius: 8px;
	}
	.settlement-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 5px;
		font-size: 15px;
	}
	.grand-total {
		font-size: 24px;
		font-weight: 800;
		color: #fffae6;
	}

	.red { color: #ff5252; }
	.green { color: #52c41a; }
	.gray { color: #999; }
	.bold { font-weight: bold; }
</style>