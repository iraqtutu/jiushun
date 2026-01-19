<template>
	<view class="container">
		<view class="form-item">
			<text class="label">反馈类型</text>
			<view class="type-selector">
				<view 
					class="type-btn" 
					:class="{ active: form.type === 'problem' }" 
					@click="form.type = 'problem'"
				>
					程序问题
				</view>
				<view 
					class="type-btn" 
					:class="{ active: form.type === 'suggestion' }" 
					@click="form.type = 'suggestion'"
				>
					功能建议
				</view>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">详细内容</text>
			<textarea 
				class="input-area" 
				v-model="form.content" 
				placeholder="请详细描述您遇到的问题或建议..." 
				maxlength="500"
			/>
		</view>
		
		<view class="form-item">
			<text class="label">相关图片 (可选)</text>
			<view class="image-grid">
				<view class="image-item" v-for="(item, index) in imageList" :key="index">
					<image :src="item.url" mode="aspectFill" class="thumb" @click="previewImage(index)" />
					<view class="del-btn" @click="delImage(index)">×</view>
				</view>
				<view class="upload-btn" @click="chooseImage" v-if="imageList.length < 3">
					<text class="plus">+</text>
				</view>
			</view>
		</view>
		
		<button class="submit-btn" :loading="submitting" @click="submit">提交反馈</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: {
					type: 'problem',
					content: '',
					images: [] // Stores fileIDs
				},
				imageList: [], // Stores {url, fileID} for display
				submitting: false
			}
		},
		methods: {
			chooseImage() {
				uni.chooseImage({
					count: 3 - this.imageList.length,
					success: (res) => {
						this.uploadFiles(res.tempFilePaths);
					}
				})
			},
			async uploadFiles(paths) {
				uni.showLoading({ title: '上传中...' });
				
				for (const path of paths) {
					try {
						const result = await uniCloud.uploadFile({
							filePath: path,
							cloudPath: `feedback/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`
						});
						
						this.imageList.push({
							url: path, // Local preview
							fileID: result.fileID
						});
						this.form.images.push(result.fileID);
						
					} catch (e) {
						uni.showToast({ title: '上传失败', icon: 'none' });
						console.error(e);
					}
				}
				
				uni.hideLoading();
			},
			delImage(index) {
				this.imageList.splice(index, 1);
				this.form.images.splice(index, 1);
			},
			previewImage(index) {
				const urls = this.imageList.map(item => item.url);
				uni.previewImage({
					current: index,
					urls: urls
				});
			},
			submit() {
				if (!this.form.content.trim()) {
					uni.showToast({ title: '请输入内容', icon:'none' });
					return;
				}
				
				this.submitting = true;
				uniCloud.callFunction({
					name: 'feedback-manager',
					data: {
						action: 'add',
						params: this.form,
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						this.submitting = false;
						if (res.result.code === 0) {
							uni.showToast({ title: '提交成功' });
							setTimeout(() => uni.navigateBack(), 1500);
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					fail: () => {
						this.submitting = false;
						uni.showToast({ title: '网络错误', icon: 'none' });
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 20px;
	}
	
	.form-item {
		margin-bottom: 20px;
		
		.label {
			display: block;
			font-weight: bold;
			margin-bottom: 10px;
			color: #333;
		}
	}
	
	.type-selector {
		display: flex;
		gap: 15px;
		
		.type-btn {
			flex: 1;
			text-align: center;
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 6px;
			color: #666;
			transition: all 0.3s;
			
			&.active {
				background: #e3f2fd;
				color: #1976d2;
				border-color: #1976d2;
			}
		}
	}
	
	.input-area {
		width: 100%;
		height: 150px;
		background: #f9f9f9;
		padding: 10px;
		border-radius: 6px;
		border: 1px solid #eee;
		font-size: 14px;
		box-sizing: border-box;
	}
	
	.image-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	
	.image-item {
		width: 80px;
		height: 80px;
		position: relative;
		border-radius: 6px;
		overflow: hidden;
		
		.thumb {
			width: 100%;
			height: 100%;
		}
		
		.del-btn {
			position: absolute;
			top: 0;
			right: 0;
			background: rgba(0,0,0,0.5);
			color: #fff;
			width: 20px;
			height: 20px;
			text-align: center;
			line-height: 20px;
			border-bottom-left-radius: 6px;
			font-size: 12px;
		}
	}
	
	.upload-btn {
		width: 80px;
		height: 80px;
		border: 1px dashed #ccc;
		border-radius: 6px;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #fafafa;
		
		.plus {
			font-size: 40px;
			color: #ccc;
			font-weight: 100;
		}
	}
	
	.submit-btn {
		background: #1976d2;
		color: #fff;
		margin-top: 30px;
	}
</style>
