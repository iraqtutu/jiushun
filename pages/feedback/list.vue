<template>
	<view class="container">
		<view class="list">
			<view class="item" v-for="(item, index) in list" :key="item._id" @click="navToDetail(item._id)">
				<view class="header-row">
					<view class="left">
						<text class="type-tag" :class="item.type">{{ item.type === 'problem' ? '问题' : '建议' }}</text>
						<text class="time">{{ formatDate(item.create_date) }}</text>
					</view>
					<text class="status-tag" :class="item.status === 1 ? 'replied' : 'pending'">
						{{ item.status === 1 ? '已回复' : '待处理' }}
					</text>
				</view>
				
				<view class="content-row">
					<text class="content">{{ truncate(item.content) }}</text>
				</view>
				
				<view v-if="item.user_name" class="user-row">
					<text>用户: {{ item.user_name }}</text>
				</view>
			</view>
		</view>
		
		<view v-if="list.length === 0 && !isLoading" class="empty">
			<text>暂无反馈记录</text>
		</view>
		
		<uni-load-more :status="loadMoreStatus"></uni-load-more>
		
		<!-- Floating Action Button for Create -->
		<view class="fab" @click="navToCreate">
			<text class="plus">+</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				page: 1,
				pageSize: 20,
				total: 0,
				isLoading: false,
				loadMoreStatus: 'more'
			}
		},
		onShow() {
			this.refresh();
		},
		onReachBottom() {
			if (this.loadMoreStatus === 'more') {
				this.loadData();
			}
		},
		methods: {
			refresh() {
				this.page = 1;
				this.list = [];
				this.loadMoreStatus = 'more';
				this.loadData();
			},
			loadData() {
				if (this.isLoading) return;
				this.isLoading = true;
				this.loadMoreStatus = 'loading';
				
				uniCloud.callFunction({
					name: 'feedback-manager',
					data: {
						action: 'list',
						params: { page: this.page, pageSize: this.pageSize },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						this.isLoading = false;
						if (res.result.code === 0) {
							if (this.page === 1) this.list = [];
							this.list = this.list.concat(res.result.data);
							this.total = res.result.total;
							
							if (this.list.length >= this.total) {
								this.loadMoreStatus = 'noMore';
							} else {
								this.page++;
								this.loadMoreStatus = 'more';
							}
						} else {
							this.loadMoreStatus = 'more';
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					fail: () => {
						this.isLoading = false;
						this.loadMoreStatus = 'more';
					}
				});
			},
			navToCreate() {
				uni.navigateTo({ url: '/pages/feedback/create' });
			},
			navToDetail(id) {
				uni.navigateTo({ url: `/pages/feedback/detail?id=${id}` });
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
			},
			truncate(str) {
				if (!str) return '';
				return str.length > 30 ? str.substring(0, 30) + '...' : str;
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 80px; // Space for FAB
	}
	
	.item {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
		
		.header-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
			
			.left {
				display: flex;
				align-items: center;
				gap: 10px;
				
				.type-tag {
					font-size: 12px;
					padding: 2px 6px;
					border-radius: 4px;
					
					&.problem {
						background: #ffebee;
						color: #c62828;
					}
					
					&.suggestion {
						background: #e3f2fd;
						color: #1565c0;
					}
				}
				
				.time {
					font-size: 12px;
					color: #999;
				}
			}
			
			.status-tag {
				font-size: 12px;
				
				&.replied {
					color: #4caf50;
				}
				
				&.pending {
					color: #ff9800;
				}
			}
		}
		
		.content-row {
			margin-bottom: 5px;
			.content {
				font-size: 15px;
				color: #333;
				line-height: 1.4;
			}
		}
		
		.user-row {
			margin-top: 8px;
			font-size: 12px;
			color: #666;
			border-top: 1px solid #f0f0f0;
			padding-top: 8px;
		}
	}
	
	.fab {
		position: fixed;
		right: 20px;
		bottom: 30px;
		width: 56px;
		height: 56px;
		background: #1976d2;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4px 10px rgba(0,0,0,0.3);
		z-index: 100;
		
		.plus {
			color: #fff;
			font-size: 32px;
			font-weight: bold;
			margin-top: -4px;
		}
	}
	
	.empty {
		text-align: center;
		color: #999;
		margin-top: 50px;
	}
</style>
