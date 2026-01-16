<template>
	<view class="container">
		<view class="form-card">
			<view class="form-item">
				<text class="label">姓名</text>
				<input class="input" v-model="formData.name" placeholder="请输入真实姓名" />
			</view>
			
			<view class="form-item">
				<text class="label">手机号</text>
				<input class="input" type="number" v-model="formData.mobile" placeholder="请输入手机号" maxlength="11" />
			</view>
			
			<view class="form-item">
				<text class="label">角色</text>
				<picker :range="roles" @change="onRoleChange">
					<view class="picker-view">
						<text v-if="formData.role">{{ formData.role }}</text>
						<text v-else class="placeholder">请选择角色</text>
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="label">申请理由</text>
				<textarea class="textarea" v-model="formData.reason" placeholder="例如：我是XX地区经销商王某某" />
			</view>
			
			<button class="btn-submit" @click="submitApply">提交申请</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				roles: ['玖顺员工', '经销商人员', '服务人员'],
				formData: {
					name: '',
					mobile: '',
					role: '',
					reason: ''
				}
			}
		},
		methods: {
			onRoleChange(e) {
				this.formData.role = this.roles[e.detail.value];
			},
			submitApply() {
				if (!this.formData.name || !this.formData.mobile || !this.formData.role || !this.formData.reason) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				
				// TODO: Call cloud function to save application
				console.log('Applying:', this.formData);
				
				uni.showLoading({ title: '提交中...' });
				
				// Mock submission
				setTimeout(() => {
					uni.hideLoading();
					uni.showModal({
						title: '提交成功',
						content: '您的申请已提交，请等待管理员审核。审核通过后即可登录。',
						showCancel: false,
						success: () => {
							uni.navigateBack();
						}
					});
				}, 1000);
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 20px;
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.form-card {
		background: #fff;
		border-radius: 8px;
		padding: 20px;
	}
	
	.form-item {
		margin-bottom: 20px;
		
		.label {
			display: block;
			font-size: 14px;
			color: #333;
			margin-bottom: 8px;
			font-weight: bold;
		}
		
		.input, .picker-view, .textarea {
			width: 100%;
			background: #f8f8f8;
			border-radius: 4px;
			padding: 10px;
			font-size: 15px;
			box-sizing: border-box;
		}
		
		.input {
			height: 44px;
		}
		
		.textarea {
			height: 100px;
		}
		
		.placeholder {
			color: #999;
		}
	}
	
	.btn-submit {
		background-color: #007aff;
		color: #fff;
		margin-top: 30px;
	}
</style>