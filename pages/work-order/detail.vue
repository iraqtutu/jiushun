<template>
	<view class="container">
		<!-- Section A: Basic Info -->
		<view class="header-card">
			<view class="header-main">
				<view class="order-no-box">
					<text class="label">派工单号</text>
					<text class="order-no">{{ order.orderNo || '-' }}</text>
				</view>
				<view class="status-box">
					<text class="status-tag" :class="statusClass">{{ order.status || '已完成' }}</text>
				</view>
			</view>
			<view class="header-sub">
				<text class="label">填单人:</text>
				<text class="value">{{ order.creator || '-' }}</text>
			</view>
		</view>
		
		<!-- Section B: Customer Info -->
		<view class="section card">
			<view class="section-title">客户资料</view>
			<view class="detail-item">
				<text class="label">姓名</text>
				<text class="value">{{ order.customer.name || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">电话</text>
				<view class="value phone-box" @click="makeCall(order.customer.phone)" v-if="order.customer.phone">
					<text class="phone-text">{{ order.customer.phone }}</text>
					<text class="phone-icon-wrap" style="font-size: 14px; margin-left: 4px;">📞</text>
				</view>
				<text class="value" v-else>-</text>
			</view>
			<view class="detail-item">
				<text class="label">地址</text>
				<text class="value">{{ order.customer.address || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">农机用途</text>
				<text class="value">{{ order.customer.usageType || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">经销商</text>
				<text class="value">{{ order.customer.distributorName || '-' }}</text>
			</view>
			<view class="detail-item m-0">
				<text class="label">报修时间</text>
				<text class="value">{{ formatDate(order.customer.reportTime, 'date') }}</text>
			</view>
		</view>

		<!-- Section C: Product Info -->
		<view class="section card">
			<view class="section-title">产品信息</view>
			<view class="detail-item">
				<text class="label">机器编号</text>
				<text class="value">{{ order.product.machineNo || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">发动机号</text>
				<text class="value">{{ order.product.engineNo || '-' }}</text>
			</view>
			<view class="detail-item">
				<text class="label">产品型号</text>
				<text class="value">{{ order.product.model || '-' }}</text>
			</view>
			<view class="detail-item m-0">
				<text class="label">生产日期</text>
				<text class="value">{{ formatDate(order.product.productionDate, 'date') }}</text>
			</view>
			<view class="detail-block mt-4" v-if="order.product.platePhoto">
				<text class="label">铭牌照片</text>
				<image :src="order.product.platePhoto" mode="aspectFill" class="single-img" @click="previewImage(order.product.platePhoto)"></image>
			</view>
		</view>
		
		<!-- Section D: Service Info -->
		<view class="section card">
			<view class="section-title">服务内容</view>
			<view class="detail-item">
				<text class="label">服务类型</text>
				<text class="value">{{ order.service.type || '-' }}</text>
			</view>
			<view class="detail-item m-0">
				<text class="label">故障分类</text>
				<text class="value">{{ faultCategoryText }}</text>
			</view>
			<view class="detail-block mt-4">
				<text class="label">故障现象</text>
				<text class="block-value">{{ order.service.faultDesc || '无描述' }}</text>
			</view>
			<view class="detail-block mt-3">
				<text class="label">处理方法</text>
				<text class="block-value">{{ order.service.handleDesc || '无描述' }}</text>
			</view>
			<view class="detail-item mt-3">
				<text class="label">完成时间</text>
				<text class="value">{{ formatDate(order.service.finishTime, 'datetime') }}</text>
			</view>
			
			<!-- Parts List -->
			<view class="detail-block mt-4" v-if="order.service.parts && order.service.parts.length > 0">
				<view class="flex-title">
					<text class="label m-0 font-medium">更换零件</text>
					<text class="part-count">共 {{ order.service.parts.length }} 项</text>
				</view>
				
				<view class="parts-list">
					<view class="part-card" v-for="(part, idx) in order.service.parts" :key="idx">
						<view class="part-main">
							<text class="part-name">{{ part.name }}</text>
							<text class="part-qty">x{{ part.count }}</text>
						</view>
						<view class="part-sub">
							<text class="p-badge code" v-if="part.code">{{ part.code }}</text>
							<text class="p-badge action" :class="part.oldPartAction === '丢弃' ? 'gray' : 'blue'">
								旧件: {{ part.oldPartAction || '带回' }}
							</text>
							<text class="p-badge source" :class="part.source === '自带' ? 'gray' : 'orange'">
								{{ part.source || '自带' }}
							</text>
						</view>
						<view class="part-remark" v-if="part.sourceRemark">备注: {{ part.sourceRemark }}</view>
						<view class="part-price" v-if="order.service.isChargeable === '收费'">
							<text class="price-symbol">￥</text>
							<text class="price-num">{{ part.total || ((part.price || 0) * (part.count || 0)).toFixed(1) }}</text>
						</view>
					</view>
				</view>
				<view class="parts-total" v-if="order.service.isChargeable === '收费'">
					零件小计: <text class="price-highlight">￥{{ partsTotal }}</text>
				</view>
			</view>

			<!-- Site Photos -->
			<view class="detail-block mt-4" v-if="order.service.sitePhotos && order.service.sitePhotos.length > 0">
				<text class="label">现场照片</text>
				<view class="photo-grid">
					<image v-for="(img, idx) in order.service.sitePhotos" :key="idx" :src="img" mode="aspectFill" class="grid-img" @click="previewImage(img, order.service.sitePhotos)"></image>
				</view>
			</view>
		
			<!-- Payment Info -->
			<view class="detail-block charge-block" v-if="order.service.isChargeable">
				<view class="detail-item m-0" style="border-bottom: none;">
					<text class="label" style="margin-bottom: 0;">收费类型</text>
					<text class="value charge-type" :class="order.service.isChargeable === '收费' ? 'red' : 'green'">{{ order.service.isChargeable }}</text>
				</view>
			</view>
		</view>

		<!-- Section E: Additional Fees & Labor Info -->
		<view class="section card" v-if="order.additionalFees && (order.additionalFees.travelFee || order.additionalFees.laborFee)">
			<view class="section-title">路程与工时</view>
			
			<view class="fee-card" v-if="order.additionalFees.travelFee">
				<view class="fee-header">
					<text class="fee-title">🚗 路程核算</text>
					<text class="fee-amount">￥{{ order.additionalFees.travelFee.total || 0 }}</text>
				</view>
				<view class="fee-desc">
					<text>公里数: {{ order.additionalFees.travelFee.distance || 0 }}km</text>
					<text>单价: ￥{{ order.additionalFees.travelFee.unitPrice || 0 }}/km</text>
				</view>
			</view>

			<view class="fee-card" v-if="order.additionalFees.laborFee">
				<view class="fee-header">
					<text class="fee-title">⏱️ 工时记录</text>
					<text class="fee-amount">￥{{ order.additionalFees.laborFee.total || 0 }}</text>
				</view>
				<view class="fee-detail" v-if="order.additionalFees.laborFee.departureTime">
					<view class="time-row"><text class="t-label">出发:</text> <text class="t-val">{{ formatDate(order.additionalFees.laborFee.departureTime, 'datetime') }}</text></view>
					<view class="time-row"><text class="t-label">完成:</text> <text class="t-val">{{ formatDate(order.additionalFees.laborFee.finishTime, 'datetime') }}</text></view>
					<view class="time-row"><text class="t-label">预计返程:</text> <text class="t-val">{{ order.additionalFees.laborFee.returnDuration || 0 }} 分钟</text></view>
				</view>
				<view class="fee-desc mt-2">
					<text>总工时: {{ order.additionalFees.laborFee.totalHours || 0 }}h</text>
					<text>单价: ￥{{ order.additionalFees.laborFee.unitPrice || 0 }}/h</text>
				</view>
			</view>

			<view class="sub-total-bar" v-if="order.additionalFees.totalAmount">
				<text class="sub-label">附加费用小计</text>
				<text class="sub-amount">￥{{ order.additionalFees.totalAmount }}</text>
			</view>
		</view>
		
		<!-- Settlement Dashboard -->
		<view class="settlement-card" v-if="order.service.isChargeable === '收费'">
			<view class="settlement-bg"></view>
			<view class="settlement-content">
				<view class="s-row p-method" v-if="order.service.paymentMethod">
					<text class="s-label">支付方式</text>
					<text class="s-value">{{ order.service.paymentMethod }}</text>
				</view>
				<view class="s-row grand-total-row">
					<text class="s-label-large">工单应收合计</text>
					<view class="s-total-box">
						<text class="s-currency">￥</text>
						<text class="s-grand-total">{{ grandTotal }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- Section F: Confirmation -->
		<view class="section card mb-safe" v-if="order.confirm.machineUserPhoto">
			<view class="section-title">客户确认</view>
			<view class="detail-block m-0">
				<text class="label">人机合影</text>
				<image :src="order.confirm.machineUserPhoto" mode="aspectFill" class="single-img" @click="previewImage(order.confirm.machineUserPhoto)"></image>
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
			statusClass() {
				const s = this.order.status;
				if (s === '待处理') return 'status-pending';
				if (s === '处理中') return 'status-processing';
				if (s === '已评价') return 'status-evaluated';
				return 'status-completed'; // 已完成 or other
			},
			faultCategoryText() {
				const svc = this.order.service || {};
				if (Array.isArray(svc.faultCategories)) {
					return svc.faultCategories.join('、');
				}
				return svc.faultCategory || svc.faultCategories || '-';
			},
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
	page {
		background-color: #f4f6f8;
	}

	.container {
		padding: 12px 12px 40px;
	}
	
	/* Header Card */
	.header-card {
		background: linear-gradient(135deg, #2b323b, #1d2129);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 12px;
		color: #fff;
		box-shadow: 0 4px 12px rgba(29, 33, 41, 0.15);
		
		.header-main {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 16px;
			padding-bottom: 16px;
			border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
		}
		
		.order-no-box {
			display: flex;
			flex-direction: column;
			gap: 6px;
			
			.label { font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1; }
			.order-no { font-size: 19px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.2; }
		}
		
		.status-tag {
			font-size: 13px;
			padding: 4px 12px;
			border-radius: 20px;
			font-weight: 500;
			
			&.status-pending { background: rgba(255, 125, 0, 0.2); color: #ff7d00; border: 1px solid rgba(255, 125, 0, 0.3); }
			&.status-processing { background: rgba(22, 93, 255, 0.2); color: #4080ff; border: 1px solid rgba(22, 93, 255, 0.3); }
			&.status-completed { background: rgba(0, 180, 42, 0.2); color: #0cf843; border: 1px solid rgba(0, 180, 42, 0.4); }
			&.status-evaluated { background: rgba(114, 46, 209, 0.2); color: #b768fa; border: 1px solid rgba(114, 46, 209, 0.3); }
		}
		
		.header-sub {
			display: flex;
			align-items: center;
			font-size: 14px;
			
			.label { color: rgba(255, 255, 255, 0.7); margin-right: 8px; }
			.value { font-weight: 500; }
		}
	}
	
	/* Card Base */
	.card {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
	}
	
	.section-title {
		font-size: 16px;
		font-weight: 600;
		color: #1d2129;
		display: flex;
		align-items: center;
		margin-bottom: 16px;
		
		&::before {
			content: '';
			display: inline-block;
			width: 4px;
			height: 16px;
			background-color: #165dff;
			border-radius: 2px;
			margin-right: 8px;
		}
	}
	
	/* Detail Items */
	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		font-size: 14px;
		align-items: flex-start;
		border-bottom: 1px solid #f7f8fa;
		
		&:last-child { border-bottom: none; padding-bottom: 0; }
		&.m-0 { padding-bottom: 0; border-bottom: none; }
		
		.label { color: #86909c; width: 85px; flex-shrink: 0; line-height: 1.5; }
		
		.value {
			color: #1d2129;
			flex: 1;
			text-align: right;
			word-break: break-all;
			font-weight: 500;
			line-height: 1.5;
			
			&.charge-type {
				font-weight: bold;
				&.red { color: #f53f3f; }
				&.green { color: #00b42a; }
			}
		}
	}
	
	.phone-box {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		
		.phone-text {
			color: #165dff;
			font-weight: 600;
			text-decoration: underline;
		}
	}
	
	/* Detail Blocks */
	.detail-block {
		font-size: 14px;
		
		.label { display: block; color: #86909c; margin-bottom: 8px; }
		&.m-0 .label { margin-bottom: 8px; }
		
		.block-value {
			display: block;
			color: #1d2129;
			background: #f7f8fa;
			padding: 12px;
			border-radius: 8px;
			line-height: 1.6;
		}
	}
	
	.mt-2 { margin-top: 12px; }
	.mt-3 { margin-top: 16px; }
	.mt-4 { margin-top: 20px; }
	.m-0 { margin: 0; }
	.font-medium { font-weight: 500; }
	
	.single-img { width: 100%; height: 200px; border-radius: 8px; background-color: #f7f8fa; }
	
	.photo-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		
		.grid-img {
			width: calc(33.33% - 7px);
			height: 90px;
			border-radius: 8px;
			background-color: #f7f8fa;
		}
	}
	
	/* Parts List - Modern Styling */
	.flex-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		
		.label { margin-bottom: 0; color: #1d2129; }
		.part-count { font-size: 13px; color: #86909c; }
	}
	
	.parts-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.part-card {
		background: #f7f8fa;
		border-radius: 8px;
		padding: 14px;
		position: relative;
		
		.part-main {
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
			padding-right: 60px; /* Space for price */
			
			.part-name { font-weight: bold; color: #1d2129; font-size: 15px; }
			.part-qty { font-weight: bold; color: #86909c; font-size: 14px; }
		}
		
		.part-sub {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 6px;
			
			.p-badge {
				font-size: 11px;
				padding: 2px 6px;
				border-radius: 4px;
				
				&.code { background: #e5e6eb; color: #4e5969; }
				&.action {
					&.blue { background: #e8f3ff; color: #165dff; }
					&.gray { background: #e5e6eb; color: #86909c; }
				}
				&.source {
					&.orange { background: #fff7e8; color: #ff7d00; }
					&.gray { background: #e5e6eb; color: #86909c; }
				}
			}
		}
		
		.part-remark { font-size: 12px; color: #86909c; background: #e5e6eb; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }
		
		.part-price {
			position: absolute;
			right: 14px;
			top: 14px;
			color: #f53f3f;
			
			.price-symbol { font-size: 12px; }
			.price-num { font-size: 16px; font-weight: bold; }
		}
	}
	
	.parts-total {
		text-align: right; margin-top: 12px; font-size: 14px; color: #1d2129; font-weight: 500;
		padding-top: 12px; border-top: 1px dashed #e5e6eb;
		
		.price-highlight { color: #f53f3f; font-size: 16px; font-weight: bold; margin-left: 4px; }
	}
	
	.charge-block {
		margin-top: 20px;
		background: #f7f8fa;
		padding: 12px 16px;
		border-radius: 8px;
	}

	/* Fees Ext */
	.fee-card {
		background: #f7f8fa;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 12px;
		
		.fee-header {
			display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
			
			.fee-title { font-weight: bold; color: #1d2129; font-size: 15px; }
			.fee-amount { font-weight: bold; color: #f53f3f; font-size: 16px; }
		}
		
		.fee-desc { display: flex; justify-content: space-between; font-size: 13px; color: #86909c; }
	}
	
	.fee-detail {
		background: #fff; border-radius: 6px; padding: 12px; margin-bottom: 12px;
		
		.time-row {
			display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;
			&:last-child { margin-bottom: 0; }
			.t-label { color: #86909c; }
			.t-val { color: #1d2129; font-weight: 500; }
		}
	}
	
	.sub-total-bar {
		display: flex; justify-content: flex-end; align-items: center; padding-top: 16px; margin-top: 16px; border-top: 1px dashed #e5e6eb;
		.sub-label { font-size: 14px; color: #1d2129; font-weight: 600; margin-right: 8px; }
		.sub-amount { font-size: 18px; color: #f53f3f; font-weight: bold; }
	}
	
	/* Settlement Card */
	.settlement-card {
		margin-top: 8px; border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 6px 16px rgba(245, 63, 63, 0.15);
		
		.settlement-bg {
			position: absolute; top: 0; left: 0; right: 0; bottom: 0;
			background: linear-gradient(135deg, #ff7d00, #f53f3f);
			z-index: 1;
		}
		
		.settlement-content { position: relative; z-index: 2; padding: 20px; color: #fff; }
		
		.s-row {
			display: flex; justify-content: space-between; align-items: center;
			
			&.p-method {
				margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
				.s-label { font-size: 14px; color: rgba(255, 255, 255, 0.9); }
				.s-value { font-size: 15px; font-weight: 500; }
			}
			
			&.grand-total-row {
				align-items: flex-end;
				.s-label-large { font-size: 16px; font-weight: 600; }
				.s-total-box {
					color: #fff;
					.s-currency { font-size: 18px; font-weight: bold; margin-right: 2px;}
					.s-grand-total { font-size: 28px; font-weight: 800; }
				}
			}
		}
	}
	
	.mb-safe { margin-bottom: env(safe-area-inset-bottom); }
</style>