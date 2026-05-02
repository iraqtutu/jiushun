<template>
	<view class="page-bg">
		<!-- Sticky Header Action Bar -->
		<view class="sticky-header" v-if="list.length > 0">
			<view class="action-bar-content">
				<view class="summary-info">
					<text class="count-label" v-if="!isEditMode">
						{{ unreadCount > 0 ? unreadCount + ' 条未读消息' : '暂无未读消息' }}
					</text>
					<text class="count-label highlight" v-else>已选中 {{ selectedIds.length }} 项</text>
				</view>
				<view class="action-group">
					<template v-if="!isEditMode">
						<view class="icon-btn" @click="handleReadAll" v-if="unreadCount > 0">
							<text class="btn-text">一键已读</text>
						</view>
						<view class="icon-btn primary" @click="isEditMode = true">
							<text class="btn-text">管理</text>
						</view>
					</template>
					<template v-else>
						<view class="text-link" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</view>
						<view class="text-link danger" :class="{ disabled: selectedIds.length === 0 }" @click="handleBatchDelete">删除</view>
						<view class="confirm-btn" @click="exitEditMode">完成</view>
					</template>
				</view>
			</view>
		</view>

		<view class="list-container">
			<view class="notification-list" v-if="list.length > 0">
				<view class="list-item-wrapper" v-for="(item, index) in list" :key="item._id">
					<view class="item-flex-row">
						<!-- Custom Checkbox -->
						<view class="selection-area" v-if="isEditMode" @click="toggleSelect(item._id)">
							<view class="custom-checkbox" :class="{ checked: selectedIds.includes(item._id) }">
								<text class="check-icon" v-if="selectedIds.includes(item._id)">L</text>
							</view>
						</view>
						
						<!-- Notification Card -->
						<view 
							class="notify-card" 
							:class="{ 'is-read': item.isRead, 'is-editing': isEditMode }" 
							@click="handleItemClick(item)" 
							@longpress="handleLongPress(item)"
						>
							<view class="card-status-line" :class="{ 'active': !item.isRead }"></view>
							<view class="card-main">
								<view class="card-header">
									<view class="title-row">
										<text class="notify-title">{{ item.title }}</text>
										<view v-if="!item.isRead" class="new-badge">NEW</view>
									</view>
									<text class="notify-date">{{ formatSmartDate(item.create_date) }}</text>
								</view>
								<text class="notify-content">{{ item.content }}</text>
								<view class="card-footer">
									<view class="tag-box">
										<text class="type-tag" :class="item.type || 'system'">{{ item.type === 'reminder' ? '业务提醒' : '系统公告' }}</text>
									</view>
									<view class="detail-link">
										<text>详情</text>
										<text class="arrow">➔</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<!-- Bottom Clear Button (only in normal mode) -->
				<view class="list-footer" v-if="!isEditMode">
					<view class="clear-all-link" @click="handleClearAll">清空所有通知记录</view>
				</view>
			</view>
			
			<!-- Empty State -->
			<view class="empty-state" v-else>
				<view class="empty-icon-box">
					<text class="empty-icon">🔔</text>
				</view>
				<text class="empty-title">没有新的通知</text>
				<text class="empty-desc">所有的系统公告和业务提醒会显示在这里</text>
			</view>
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
				uni.showLoading({ title: '获取中' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'getList',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.list = res.result.data;
						}
					},
					complete: () => uni.hideLoading()
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
					content: `要从列表中移除这 ${this.selectedIds.length} 条通知吗？`,
					confirmColor: '#ff4d4f',
					success: (res) => {
						if (res.confirm) this.executeBatchDelete();
					}
				});
			},
			async executeBatchDelete() {
				uni.showLoading({ title: '处理中' });
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
					this.list = this.list.filter(i => !this.selectedIds.includes(i._id));
					this.exitEditMode();
				} finally {
					uni.hideLoading();
				}
			},
			handleLongPress(item) {
				if (this.isEditMode) return;
				uni.vibrateShort();
				uni.showActionSheet({
					itemList: ['删除该通知', '批量管理模式'],
					itemColor: '#333',
					success: (res) => {
						if (res.tapIndex === 0) this.deleteItem(item._id);
						if (res.tapIndex === 1) {
							this.isEditMode = true;
							this.selectedIds = [item._id];
						}
					}
				});
			},
			deleteItem(id) {
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'hideItem',
						params: { id },
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: () => {
						this.list = this.list.filter(i => i._id !== id);
					}
				});
			},
			handleReadAll() {
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'readAll',
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: () => {
						this.list.forEach(i => i.isRead = true);
						uni.showToast({ title: '全部标记已读', icon: 'none' });
					}
				});
			},
			handleClearAll() {
				uni.showModal({
					title: '清空列表',
					content: '清空后列表将不再显示任何历史通知，确定吗？',
					confirmColor: '#ff4d4f',
					success: (res) => {
						if (res.confirm) {
							uniCloud.callFunction({
								name: 'notification-manager',
								data: {
									action: 'clearAll',
									uniIdToken: uni.getStorageSync('uni_id_token')
								},
								success: () => {
									this.list = [];
								}
							});
						}
					}
				});
			},
			formatSmartDate(ts) {
				const d = new Date(ts);
				const now = new Date();
				const isToday = d.toDateString() === now.toDateString();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const hh = d.getHours().toString().padStart(2, '0');
				const mm = d.getMinutes().toString().padStart(2, '0');
				if (isToday) return `今天 ${hh}:${mm}`;
				return `${m}-${date} ${hh}:${mm}`;
			}
		}
	}
</script>

<style lang="scss" scoped>
	.page-bg {
		min-height: 100vh;
		background-color: #f7f9fc;
		padding-bottom: 40px;
	}

	/* Sticky Action Bar */
	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(247, 249, 252, 0.9);
		backdrop-filter: blur(10px);
		padding: 10px 16px;
		
		.action-bar-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 44px;
		}
		
		.summary-info {
			.count-label {
				font-size: 14px;
				color: #86909c;
				&.highlight { color: #165dff; font-weight: 600; }
			}
		}
		
		.action-group {
			display: flex;
			align-items: center;
			gap: 12px;
			
			.icon-btn {
				background: #fff;
				padding: 6px 14px;
				border-radius: 20px;
				box-shadow: 0 2px 6px rgba(0,0,0,0.04);
				&.primary { background: #165dff; .btn-text { color: #fff; } }
				.btn-text { font-size: 13px; color: #1d2129; font-weight: 500; }
			}
			
			.text-link {
				font-size: 14px;
				color: #165dff;
				&.danger { color: #f53f3f; }
				&.disabled { opacity: 0.3; }
			}
			
			.confirm-btn {
				background: #1d2129;
				color: #fff;
				padding: 4px 12px;
				border-radius: 6px;
				font-size: 13px;
			}
		}
	}

	.list-container {
		padding: 0 16px;
	}

	.notification-list {
		margin-top: 6px;
	}

	.item-flex-row {
		display: flex;
		align-items: center;
		margin-bottom: 14px;
	}

	/* Checkbox styling */
	.selection-area {
		padding-right: 12px;
		.custom-checkbox {
			width: 22px;
			height: 22px;
			border: 2px solid #c9cdd4;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #fff;
			transition: all 0.2s;
			
			&.checked {
				background: #165dff;
				border-color: #165dff;
			}
			
			.check-icon {
				color: #fff;
				font-size: 12px;
				transform: rotate(45deg) scaleX(-1) translate(1px, -2px);
				font-weight: 800;
			}
		}
	}

	/* Card Styling */
	.notify-card {
		flex: 1;
		background: #fff;
		border-radius: 12px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0,0,0,0.03);
		transition: all 0.2s;
		
		&.is-read {
			opacity: 0.85;
			box-shadow: none;
			background: #fdfdfe;
			.notify-title { color: #86909c; font-weight: normal; }
		}
		
		&.is-editing {
			transform: scale(0.98);
		}

		.card-status-line {
			position: absolute;
			left: 0; top: 0; bottom: 0;
			width: 4px;
			background: #e5e6eb;
			&.active { background: #165dff; }
		}

		.card-main {
			padding: 16px;
			padding-left: 18px;
		}

		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 8px;
			
			.title-row {
				display: flex;
				align-items: center;
				gap: 8px;
				flex: 1;
			}
			
			.notify-title {
				font-size: 16px;
				font-weight: 600;
				color: #1d2129;
				line-height: 1.4;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.new-badge {
				background: #f53f3f;
				color: #fff;
				font-size: 9px;
				font-weight: bold;
				padding: 1px 4px;
				border-radius: 4px;
				letter-spacing: 0.5px;
			}
			
			.notify-date {
				font-size: 12px;
				color: #86909c;
				flex-shrink: 0;
				margin-left: 10px;
			}
		}

		.notify-content {
			font-size: 14px;
			color: #4e5969;
			line-height: 1.6;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
			margin-bottom: 12px;
		}

		.card-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-top: 1px solid #f2f3f5;
			padding-top: 10px;
			
			.type-tag {
				font-size: 11px;
				padding: 2px 8px;
				border-radius: 4px;
				
				&.system { color: #165dff; background: #e8f3ff; }
				&.reminder { color: #ff7d00; background: #fff7e8; }
			}
			
			.detail-link {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 12px;
				color: #86909c;
				
				.arrow { font-size: 10px; }
			}
		}
	}

	.list-footer {
		padding: 20px 0 40px;
		text-align: center;
		.clear-all-link {
			font-size: 13px;
			color: #86909c;
			text-decoration: underline;
		}
	}

	/* Empty State */
	.empty-state {
		padding-top: 120px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		
		.empty-icon-box {
			width: 80px;
			height: 80px;
			background: #fff;
			border-radius: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 24px;
			box-shadow: 0 8px 24px rgba(0,0,0,0.04);
			.empty-icon { font-size: 32px; opacity: 0.8; }
		}
		
		.empty-title {
			font-size: 18px;
			font-weight: 600;
			color: #1d2129;
			margin-bottom: 8px;
		}
		
		.empty-desc {
			font-size: 14px;
			color: #86909c;
			max-width: 200px;
			line-height: 1.5;
		}
	}
</style>