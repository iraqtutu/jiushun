<template>
	<view class="container">
		<!-- Section A: Basic Info -->
		<view class="section">
			<view class="section-title">基础信息</view>
			<view class="form-item">
				<text class="label">派工单号</text>
				<input class="input disabled" :value="formData.orderNo" disabled placeholder="自动生成" />
			</view>
			<view class="form-item">
				<text class="label">填单人</text>
				<input class="input disabled" :value="currentUser" disabled />
			</view>
		</view>

		<!-- Section B: Customer Info -->
		<view class="section">
			<view class="section-title">客户资料</view>
			<view class="form-item">
				<text class="label required">姓名</text>
				<input class="input" v-model="formData.customer.name" placeholder="客户姓名" />
			</view>
			<view class="form-item">
				<text class="label required">电话</text>
				<input class="input" type="number" v-model="formData.customer.phone" placeholder="联系电话" maxlength="11" />
			</view>
			<view class="form-item">
				<text class="label required">地址</text>
				<input class="input" v-model="formData.customer.address" placeholder="详细地址" />
			</view>
			<view class="form-item">
				<text class="label required">农机用途</text>
				<radio-group @change="onUsageChange" class="radio-group">
					<label class="radio"><radio value="自用" :checked="formData.customer.usageType === '自用'" />自用</label>
					<label class="radio"><radio value="作业" :checked="formData.customer.usageType === '作业'" />作业</label>
				</radio-group>
			</view>
			<view class="form-item">
				<text class="label">经销商</text>
				<input class="input" v-model="formData.customer.distributorName" placeholder="经销商名称" />
			</view>
		</view>

		<!-- Section C: Product Info -->
		<view class="section">
			<view class="section-title">产品信息</view>
			<view class="form-item">
				<text class="label required">机器编号</text>
				<input class="input" v-model="formData.product.machineNo" placeholder="请输入机器编号" />
			</view>
			<view class="form-item">
				<text class="label required">发动机号</text>
				<input class="input" v-model="formData.product.engineNo" placeholder="请输入发动机号" />
			</view>
			<view class="form-item">
				<text class="label required">生产日期</text>
				<picker mode="date" @change="onDateChange">
					<view class="picker-view">
						{{ formData.product.productionDate || '请选择日期' }}
					</view>
				</picker>
			</view>
			
			<view class="form-item column">
				<text class="label required">铭牌照片 (支持OCR识别)</text>
				<view class="upload-box" @click="chooseImage('plate')">
					<image v-if="formData.product.platePhoto" :src="formData.product.platePhoto" mode="aspectFill" class="preview-img"></image>
					<view v-else class="placeholder">
						<text class="icon">📷</text>
						<text>点击上传</text>
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">产品型号</text>
				<!-- Combo of Select and Manual input could be complex, using input for now or picker -->
				<input class="input" v-model="formData.product.model" placeholder="自动识别或手动输入" />
			</view>
		</view>

		<!-- Section D: Service Info -->
		<view class="section">
			<view class="section-title">服务内容</view>
			<view class="form-item">
				<text class="label required">服务类型</text>
				<picker :range="serviceTypes" @change="onServiceTypeChange">
					<view class="picker-view">
						{{ formData.service.type || '请选择类型' }}
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label required">故障分类</text>
				<picker :range="faultCategories" @change="onFaultCatChange">
					<view class="picker-view">
						{{ formData.service.faultCategory || '请选择分类' }}
					</view>
				</picker>
			</view>
			<view class="form-item column">
				<text class="label required">故障现象</text>
				<textarea class="textarea" v-model="formData.service.faultDesc" placeholder="描述故障表现" />
			</view>
			<view class="form-item column">
				<text class="label required">处理方法</text>
				<textarea class="textarea" v-model="formData.service.handleDesc" placeholder="描述维修过程" />
			</view>
			
			<!-- Parts List could be a sub-list UI, skipping complex dynamic list for MVP, just a simple add button placeholder -->
			<view class="form-item column">
				<text class="label">更换零件</text>
				<button size="mini" @click="addPart">添加零件</button>
				<view v-for="(part, idx) in formData.service.parts" :key="idx" class="part-row">
					<input v-model="part.name" placeholder="名称" class="mini-input" />
					<input v-model="part.count" type="number" placeholder="数量" class="mini-input small" />
				</view>
			</view>
			
			<view class="form-item column">
				<text class="label">现场照片 (1-5张)</text>
				<view class="photo-grid">
					<view class="upload-box small" @click="chooseImage('site')">
						<text>+</text>
					</view>
					<image v-for="(img, idx) in formData.service.sitePhotos" :key="idx" :src="img" class="grid-img" mode="aspectFill"></image>
				</view>
			</view>
		</view>

		<!-- Section E: Confirmation -->
		<view class="section">
			<view class="section-title">客户确认</view>
			<view class="form-item column">
				<text class="label required">人机合影</text>
				<view class="upload-box" @click="chooseImage('confirm')">
					<image v-if="formData.confirm.machineUserPhoto" :src="formData.confirm.machineUserPhoto" mode="aspectFill" class="preview-img"></image>
					<view v-else class="placeholder">
						<text class="icon">👥</text>
						<text>点击拍摄</text>
					</view>
				</view>
			</view>
		</view>

		<button class="btn-submit" @click="submitOrder">提交工单</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentUser: '',
				serviceTypes: ['三包', '维修', '保养', '技改', '其他'],
				faultCategories: ['发动机', '液压系统', '行走传动系统', '电气系统', '插值系统', '其他'],
				formData: {
					orderNo: '', // Auto-gen
					customer: {
						name: '',
						phone: '',
						address: '',
						usageType: '自用',
						distributorName: ''
					},
					product: {
						machineNo: '',
						engineNo: '',
						productionDate: '',
						platePhoto: '',
						model: ''
					},
					service: {
						type: '',
						faultCategory: '',
						faultDesc: '',
						handleDesc: '',
						parts: [],
						sitePhotos: []
					},
					confirm: {
						machineUserPhoto: ''
					}
				}
			}
		},
		onLoad() {
			const userInfo = uni.getStorageSync('userInfo');
			this.currentUser = userInfo ? userInfo.name : '未知用户';
			
			// Generate Order No (Mock)
			const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
			this.formData.orderNo = 'JS' + dateStr + Math.floor(Math.random() * 1000);
			
			// Check Draft
			this.checkDraft();
		},
		onUnload() {
			// Auto save draft logic could go here or on every change
			this.saveDraft();
		},
		methods: {
			checkDraft() {
				const draft = uni.getStorageSync('order_draft');
				if (draft) {
					uni.showModal({
						title: '发现草稿',
						content: '是否恢复上次未提交的草稿？',
						success: (res) => {
							if (res.confirm) {
								this.formData = draft;
							} else {
								uni.removeStorageSync('order_draft');
							}
						}
					});
				}
			},
			saveDraft() {
				// Only save if some data exists
				if (this.formData.customer.name) {
					uni.setStorageSync('order_draft', this.formData);
				}
			},
			onUsageChange(e) { this.formData.customer.usageType = e.detail.value; },
			onDateChange(e) { this.formData.product.productionDate = e.detail.value; },
			onServiceTypeChange(e) { this.formData.service.type = this.serviceTypes[e.detail.value]; },
			onFaultCatChange(e) { this.formData.service.faultCategory = this.faultCategories[e.detail.value]; },
			
			addPart() {
				this.formData.service.parts.push({ name: '', count: 1 });
			},
			
			chooseImage(type) {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						const path = res.tempFilePaths[0];
						if (type === 'plate') {
							this.formData.product.platePhoto = path;
							// Mock OCR call here
							uni.showToast({ title: '正在识别...', icon: 'loading' });
							setTimeout(() => {
								this.formData.product.model = 'OCR-Model-X100'; // Mock result
								uni.hideToast();
							}, 1000);
						} else if (type === 'confirm') {
							this.formData.confirm.machineUserPhoto = path;
						} else if (type === 'site') {
							this.formData.service.sitePhotos.push(path);
						}
					}
				})
			},
			
			submitOrder() {
				// Validate
				if (!this.formData.customer.name || !this.formData.product.machineNo) {
					uni.showToast({ title: '请完善必填信息', icon: 'none' });
					return;
				}
				
				uni.showModal({
					title: '确认提交',
					content: '提交后将无法修改，是否确认？',
					success: (res) => {
						if (res.confirm) {
							// TODO: Cloud Submit
							console.log('Submitting:', this.formData);
							uni.showLoading({ title: '提交中' });
							setTimeout(() => {
								uni.hideLoading();
								uni.removeStorageSync('order_draft'); // Clear draft
								uni.showToast({ title: '提交成功' });
								setTimeout(() => uni.navigateBack(), 1500);
							}, 1500);
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		padding-bottom: 50px;
		background-color: #f5f5f5;
	}
	
	.section {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		
		.section-title {
			font-size: 16px;
			font-weight: bold;
			border-left: 4px solid #007aff;
			padding-left: 10px;
			margin-bottom: 15px;
		}
	}
	
	.form-item {
		display: flex;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
		
		&:last-child {
			border-bottom: none;
		}
		
		&.column {
			flex-direction: column;
			align-items: flex-start;
			
			.label {
				margin-bottom: 10px;
			}
		}
		
		.label {
			width: 90px;
			font-size: 14px;
			color: #333;
			
			&.required::after {
				content: '*';
				color: red;
			}
		}
		
		.input, .picker-view, .radio-group {
			flex: 1;
			font-size: 14px;
		}
		
		.input.disabled {
			color: #999;
		}
		
		.radio {
			margin-right: 15px;
		}
		
		.textarea {
			width: 100%;
			height: 80px;
			background: #f8f8f8;
			padding: 10px;
			box-sizing: border-box;
			border-radius: 4px;
			font-size: 14px;
		}
	}
	
	.upload-box {
		width: 100px;
		height: 100px;
		background: #f0f0f0;
		border-radius: 4px;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		
		&.small {
			width: 80px;
			height: 80px;
		}
		
		.placeholder {
			display: flex;
			flex-direction: column;
			align-items: center;
			color: #999;
			font-size: 12px;
			
			.icon {
				font-size: 24px;
				margin-bottom: 5px;
			}
		}
		
		.preview-img {
			width: 100%;
			height: 100%;
		}
	}
	
	.photo-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		
		.grid-img {
			width: 80px;
			height: 80px;
			border-radius: 4px;
		}
	}
	
	.part-row {
		display: flex;
		gap: 10px;
		margin-top: 10px;
		width: 100%;
		
		.mini-input {
			background: #f8f8f8;
			padding: 5px;
			border-radius: 4px;
			font-size: 14px;
			
			&.small {
				width: 60px;
				text-align: center;
			}
		}
	}
	
	.btn-submit {
		background-color: #007aff;
		color: #fff;
		margin-top: 20px;
	}
</style>