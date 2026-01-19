<template>
	<view class="container" v-if="detail">
		<view class="card">
			<view class="header">
				<text class="type" :class="detail.type">{{ detail.type === 'problem' ? '问题' : '建议' }}</text>
				<text class="status" :class="detail.status === 1 ? 'replied' : 'pending'">
					{{ detail.status === 1 ? '已回复' : '待处理' }}
				</text>
			</view>
			
			<view class="meta-row">
				<text>提交时间: {{ formatDate(detail.create_date) }}</text>
			</view>
			
			<view v-if="detail.user_name" class="meta-row">
				<text>提交人: {{ detail.user_name }} ({{ detail.user_mobile }})</text>
			</view>
			
			<view class="content">
				<text>{{ detail.content }}</text>
			</view>
			
			<view class="images" v-if="detail.images && detail.images.length > 0">
				<image 
					v-for="(img, idx) in detail.images" 
					:key="idx" 
					:src="img" 
					class="thumb" 
					mode="aspectFill"
					@click="previewImage(img)"
				></image>
			</view>
		</view>
		
		<!-- Admin Reply Section -->
		<view class="reply-card" v-if="detail.reply && detail.status === 1">
			<view class="reply-header">
				<text class="title">管理员回复</text>
				<text class="time">{{ formatDate(detail.reply.create_date) }}</text>
			</view>
			<view class="reply-content">
				<text>{{ detail.reply.content }}</text>
			</view>
			<view class="admin-name">
				<text>— {{ detail.reply.admin_name || '管理员' }}</text>
			</view>
		</view>
		
		<!-- Admin Reply Input -->
		<view class="reply-input-card" v-if="isAdmin && detail.status === 0">
			<text class="label">回复用户</text>
			<textarea 
				class="input" 
				v-model="replyContent" 
				placeholder="请输入回复内容..."
			/>
			<button class="submit-btn" size="mini" @click="submitReply">发送回复</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				id: '',
				detail: null,
				isAdmin: false,
				replyContent: ''
			}
		},
		onLoad(options) {
			this.id = options.id;
			this.checkRole();
			this.loadDetail();
		},
		methods: {
			checkRole() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.role && userInfo.role.includes('admin')) {
					this.isAdmin = true;
				}
			},
			loadDetail() {
				uni.showLoading({ title: '加载中' });
				uniCloud.callFunction({
					name: 'feedback-manager',
					data: {
						action: 'get',
						params: { id: this.id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						uni.hideLoading();
						if (res.result.code === 0) {
							this.detail = res.result.data;
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					fail: () => {
						uni.hideLoading();
					}
				});
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
			},
			previewImage(url) {
				uni.previewImage({
					urls: this.detail.images,
					current: url
				});
			},
			submitReply() {
				if (!this.replyContent.trim()) {
					uni.showToast({ title: '请输入内容', icon: 'none' });
					return;
				}
				
				uni.showLoading({ title: '提交中' });
				uniCloud.callFunction({
					name: 'feedback-manager',
					data: {
						action: 'reply',
						params: { id: this.id, content: this.replyContent },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						uni.hideLoading();
						if (res.result.code === 0) {
							uni.showToast({ title: '回复成功' });
							this.loadDetail(); // Refresh
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
		background: #f5f5f5;
		min-height: 100vh;
	}
	
	.card, .reply-card, .reply-input-card {
		background: #fff;
		padding: 15px;
		border-radius: 8px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
		
		.type {
			font-weight: bold;
			
			&.problem { color: #c62828; }
			&.suggestion { color: #1565c0; }
		}
		
		.status {
			font-size: 12px;
			&.replied { color: #4caf50; }
			&.pending { color: #ff9800; }
		}
	}
	
	.meta-row {
		font-size: 12px;
		color: #999;
		margin-bottom: 5px;
	}
	
	.content {
		margin-top: 15px;
		margin-bottom: 15px;
		font-size: 16px;
		line-height: 1.6;
		color: #333;
	}
	
	.images {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		
		.thumb {
			width: 80px;
			height: 80px;
			border-radius: 4px;
		}
	}
	
	.reply-card {
		background: #f1f8e9; // Light green tint
		border: 1px solid #c8e6c9;
		
		.reply-header {
			display: flex;
			justify-content: space-between;
			margin-bottom: 10px;
			.title { font-weight: bold; color: #333; }
			.time { font-size: 12px; color: #666; }
		}
		
		.reply-content {
			color: #333;
			line-height: 1.5;
		}
		
		.admin-name {
			text-align: right;
			margin-top: 10px;
			font-size: 12px;
			color: #666;
		}
	}
	
	.reply-input-card {
		.label {
			display: block;
			font-weight: bold;
			margin-bottom: 10px;
		}
		
		.input {
			width: 100%;
			height: 100px;
			background: #f9f9f9;
			padding: 10px;
			border: 1px solid #eee;
			border-radius: 4px;
			margin-bottom: 10px;
		}
		
		.submit-btn {
			background: #1976d2;
			color: #fff;
			float: right;
		}
	}
</style>
