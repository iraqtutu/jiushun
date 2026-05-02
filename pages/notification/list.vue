<template>
	<view class="container">
		<!-- 顶部操作栏 -->
		<view class="action-bar card" v-if="list.length > 0">
			<view class="unread-summary">
				<text class="count" v-if="!isEditMode">{{ unreadCount > 0 ? unreadCount + ' 条未读' : '全部已读' }}</text>
				<text class="count" v-else>已选 {{ selectedIds.length }} 项</text>
			</view>
			<view class="btn-group">
				<template v-if="!isEditMode">
					<view class="action-btn" @click="isEditMode = true">管理</view>
					<view class="action-btn" @click="handleReadAll" v-if="unreadCount > 0">一键已读</view>
					<view class="action-btn delete" @click="handleClearAll">清空</view>
				</template>
				<template v-else>
					<view class="action-btn" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</view>
					<view class="action-btn delete" :class="{ disabled: selectedIds.length === 0 }" @click="handleBatchDelete">删除</view>
					<view class="action-btn" @click="exitEditMode">完成</view>
				</template>
			</view>
		</view>

		<view class="list" v-if="list.length > 0">
			<view class="item-wrapper" v-for="(item, index) in list" :key="index">
				<view class="item-flex">
					<!-- 多选框 -->
					<view class="checkbox-box" v-if="isEditMode" @click="toggleSelect(item._id)">
						<view class="checkbox" :class="{ checked: selectedIds.includes(item._id) }">
							<text v-if="selectedIds.includes(item._id)" class="check-mark">✓</text>
						</view>
					</view>
					
					<view class="item card" :class="{ 'editing': isEditMode }" @click="handleItemClick(item)" @longpress="handleLongPress(item)">
						<view class="item-header">
							<view class="title-box">
								<view v-if="!item.isRead" class="unread-dot"></view>
								<text class="title" :class="{ 'read': item.isRead }">{{ item.title }}</text>
							</view>
							<text class="date">{{ formatDate(item.create_date) }}</text>
						</view>
						<view class="summary">{{ item.content }}</view>
						<view class="footer-row">
							<text class="type-tag" v-if="item.type">{{ item.type === 'system' ? '系统' : item.type }}</text>
							<view class="arrow-box">
								<text class="arrow">查看详情 ›</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="empty" v-else>
			<image src="/static/logo.png" mode="aspectFit" class="empty-img"></image>
			<text class="empty-text">暂无新通知</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				isEditMode: false,
				selectedIds: []
			}
		},
		computed: {
			unreadCount() {
				return this.list.filter(i => !i.isRead).length;
			},
			isAllSelected() {
				return this.list.length > 0 && this.selectedIds.length === this.list.length;
			}
		},
		onShow() {
			this.loadList();
		},
		methods: {
			loadList() {
				uni.showLoading({ title: '加载中' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'getList',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.list = res.result.data;
						} else {
							uni.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
						}
					},
					fail: () => {
						uni.showToast({ title: '网络错误', icon: 'none' });
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			},
			handleItemClick(item) {
				if (this.isEditMode) {
					this.toggleSelect(item._id);
				} else {
					this.goToDetail(item);
				}
			},
			goToDetail(item) {
				if (!item.isRead) {
					item.isRead = true;
					uniCloud.callFunction({
						name: 'notification-manager',
						data: {
							action: 'markAsRead',
							params: { id: item._id },
							uniIdToken: uni.getStorageSync('uni_id_token')
						}
					});
				}
				uni.navigateTo({
					url: `/pages/notification/detail?id=${item._id}`
				});
			},
			toggleSelect(id) {
				const index = this.selectedIds.indexOf(id);
				if (index > -1) {
					this.selectedIds.splice(index, 1);
				} else {
					this.selectedIds.push(id);
				}
			},
			toggleSelectAll() {
				if (this.isAllSelected) {
					this.selectedIds = [];
				} else {
					this.selectedIds = this.list.map(i => i._id);
				}
			},
			exitEditMode() {
				this.isEditMode = false;
				this.selectedIds = [];
			},
			handleBatchDelete() {
				if (this.selectedIds.length === 0) return;
				
				uni.showModal({
					title: '确认删除',
					content: `确定要删除选中的 ${this.selectedIds.length} 条通知吗？`,
					success: (res) => {
						if (res.confirm) {
							this.executeBatchDelete();
						}
					}
				});
			},
			async executeBatchDelete() {
				uni.showLoading({ title: '正在处理' });
				// 循环调用隐藏接口（云函数端也可以写个批量接口，为简化目前循环调用）
				const promises = this.selectedIds.map(id => {
					return uniCloud.callFunction({
						name: 'notification-manager',
						data: {
							action: 'hideItem',
							params: { id },
							uniIdToken: uni.getStorageSync('uni_id_token')
						}
					});
				});

				try {
					await Promise.all(promises);
					uni.showToast({ title: '删除成功' });
					this.list = this.list.filter(i => !this.selectedIds.includes(i._id));
					this.exitEditMode();
				} catch (e) {
					uni.showToast({ title: '部分删除失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},
			handleLongPress(item) {
				if (this.isEditMode) return;
				uni.showActionSheet({
					itemList: ['选择性删除 (进入管理模式)', '删除该通知'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.isEditMode = true;
							this.selectedIds = [item._id];
						} else if (res.tapIndex === 1) {
							this.deleteItem(item._id);
						}
					}
				});
			},
			deleteItem(id) {
				uni.showLoading({ title: '正在删除' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'hideItem',
						params: { id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.list = this.list.filter(i => i._id !== id);
							uni.showToast({ title: '已删除' });
						}
					},
					complete: () => uni.hideLoading()
				});
			},
			handleReadAll() {
				uni.showLoading({ title: '处理中' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'readAll',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.list.forEach(i => i.isRead = true);
							uni.showToast({ title: '已全部标记为已读' });
						}
					},
					complete: () => uni.hideLoading()
				});
			},
			handleClearAll() {
				uni.showModal({
					title: '确认清空',
					content: '清空后通知将不再显示，确定吗？',
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '正在清空' });
							uniCloud.callFunction({
								name: 'notification-manager',
								data: {
									action: 'clearAll',
									uniIdToken: uni.getStorageSync('uni_id_token')
								},
								success: (res) => {
									if (res.result.code === 0) {
										this.list = [];
										uni.showToast({ title: '已清空' });
									}
								},
								complete: () => uni.hideLoading()
							});
						}
					}
				});
			},
			formatDate(ts) {
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				return `${y}-${m}-${date}`;
			}
		}
	}
</script>

<style lang="scss">
	page { background-color: #f7f8fa; }
	.container { padding: 12px; }
	
	.card {
		background: #fff;
		border-radius: 10px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.03);
	}

	/* 操作栏样式 */
	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		
		.unread-summary {
			.count { font-size: 13px; color: #969799; }
		}
		
		.btn-group {
			display: flex;
			gap: 14px;
			
			.action-btn {
				font-size: 13px;
				color: #1677ff;
				&.delete { color: #ff4d4f; }
				&.disabled { opacity: 0.3; }
				&:active { opacity: 0.7; }
			}
		}
	}

	.item-flex {
		display: flex;
		align-items: center;
		
		.checkbox-box {
			padding: 0 10px 12px 0;
			
			.checkbox {
				width: 20px;
				height: 20px;
				border: 2px solid #ebedf0;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.2s;
				
				&.checked {
					background-color: #1677ff;
					border-color: #1677ff;
				}
				
				.check-mark {
					color: #fff;
					font-size: 14px;
					font-weight: bold;
				}
			}
		}
	}
	
	.item {
		flex: 1;
		transition: transform 0.2s;
		
		&.editing {
			transform: scale(0.98);
		}

		.item-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
			
			.title-box {
				display: flex;
				align-items: center;
				flex: 1;
				margin-right: 10px;
				
				.unread-dot {
					width: 8px;
					height: 8px;
					background-color: #ff4d4f;
					border-radius: 50%;
					margin-right: 8px;
					flex-shrink: 0;
				}
				
				.title {
					font-size: 16px;
					font-weight: bold;
					color: #323233;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					
					&.read {
						color: #969799;
						font-weight: normal;
					}
				}
			}
			
			.date {
				font-size: 12px;
				color: #969799;
				flex-shrink: 0;
			}
		}
		
		.summary {
			font-size: 14px;
			color: #646566;
			line-height: 1.5;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
			margin-bottom: 12px;
		}

		.footer-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.type-tag {
				font-size: 10px;
				background: #f0f2f5;
				color: #969799;
				padding: 2px 6px;
				border-radius: 4px;
			}
			
			.arrow-box {
				.arrow {
					font-size: 12px;
					color: #1677ff;
				}
			}
		}
	}
	
	.empty {
		padding-top: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.empty-img { width: 120px; height: 120px; opacity: 0.3; margin-bottom: 16px; }
		.empty-text { color: #969799; font-size: 14px; }
	}
</style>