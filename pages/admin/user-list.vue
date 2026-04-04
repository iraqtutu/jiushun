<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-box">
			<uni-search-bar @confirm="search" @cancel="cancelSearch" @clear="clearSearch" placeholder="搜索用户名或手机号" />
		</view>

		<!-- 用户列表 -->
		<view class="list">
			<view class="item" v-for="(item, index) in list" :key="item._id" @click="handleEdit(item)">
				<view class="info-row">
					<text class="name">{{ item.nickname }}</text>
					<view class="role-badges">
						<text class="role-badge" v-for="(role, idx) in (item.role || [])" :key="idx">{{ role }}</text>
						<text v-if="!item.role || item.role.length === 0" class="role-badge empty">无角色</text>
					</view>
				</view>
				<view class="detail-row">
					<text class="label">📱 手机号：</text>
					<text class="value">{{ item.mobile || '未绑定' }}</text>
				</view>
				<view class="detail-row">
					<text class="label">📅 注册时间：</text>
					<text class="value">{{ formatDate(item.register_date || item.create_date) }}</text>
				</view>
				<view class="edit-btn">✏️ 编辑角色</view>
			</view>
		</view>

		<view v-if="list.length === 0 && !isLoading" class="empty">
			<text class="empty-icon">👥</text>
			<text class="empty-text">暂无用户数据</text>
		</view>

		<view v-if="isLoading" class="empty">
			<text>加载中...</text>
		</view>

		<!-- 自定义弹窗 - 角色编辑 -->
		<view v-show="showPopup" class="custom-overlay">
			<view class="mask" @click="closePopup"></view>
			<view class="popup-panel" @click.stop>
				<view class="popup-title">✏️ 编辑用户角色</view>
				<view class="popup-subtitle">{{ currentUser.nickname || '未设置昵称' }} ({{ currentUser.mobile || '未绑定手机' }})</view>

				<view class="role-list">
					<view class="role-item" v-for="role in allRoles" :key="role" @click="toggleRole(role)">
						<view class="checkbox" :class="{ checked: selectedRoles.includes(role) }">
							<text v-if="selectedRoles.includes(role)" class="check-icon">✓</text>
						</view>
						<text class="role-icon">{{ getRoleIcon(role) }}</text>
						<text class="role-name">{{ role }}</text>
					</view>
				</view>

				<view class="popup-actions">
					<button class="btn cancel" @click="closePopup">取消</button>
					<button class="btn confirm" @click="submitRoles">确认</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				isLoading: false,
				showPopup: false,
				currentUser: {},
				selectedRoles: [],
				allRoles: [],
				searchKey: ''
			}
		},
		onShow() {
			this.showPopup = false;
			this.loadRoles();
		},
		onPullDownRefresh() {
			this.loadData();
		},
		methods: {
			loadRoles() {
				uniCloud.callFunction({
					name: 'user-center',
					data: { action: 'getRoles' },
					success: (res) => {
						if (res.result.code === 0) {
							this.allRoles = res.result.data;
						}
						this.loadData();
					}
				});
			},
			search(res) {
				this.searchKey = res.value;
				this.loadData();
			},
			cancelSearch() {
				this.searchKey = '';
				this.loadData();
			},
			clearSearch() {
				this.searchKey = '';
				this.loadData();
			},
			loadData() {
				this.isLoading = true;
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'getUsers',
						params: {},
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						this.isLoading = false;
						uni.stopPullDownRefresh();
						if (res.result.code === 0) {
							let data = res.result.data || [];
							// 客户端筛选（简单实现）
							if (this.searchKey) {
								const key = this.searchKey.toLowerCase();
								data = data.filter(item =>
									(item.nickname && item.nickname.toLowerCase().includes(key)) ||
									(item.mobile && item.mobile.includes(key))
								);
							}
							this.list = data;
						} else {
							uni.showToast({ title: res.result.msg || '获取用户列表失败', icon: 'none' });
						}
					},
					fail: (err) => {
						this.isLoading = false;
						uni.stopPullDownRefresh();
						uni.showToast({ title: '网络错误', icon: 'none' });
					}
				});
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			},
			handleEdit(item) {
				this.currentUser = item;
				this.selectedRoles = [...(item.role || [])];
				this.showPopup = true;
			},
			closePopup() {
				this.showPopup = false;
			},
			toggleRole(role) {
				const index = this.selectedRoles.indexOf(role);
				if (index === -1) {
					this.selectedRoles.push(role);
				} else {
					this.selectedRoles.splice(index, 1);
				}
			},
			getRoleIcon(role) {
				const icons = {
					'admin': '🔐',
					'玖顺员工': '🏢',
					'经销商人员': '🏪',
					'服务人员': '🔧',
					'数据分析员': '📊'
				};
				return icons[role] || '👤';
			},
			submitRoles() {
				if (this.selectedRoles.length === 0) {
					uni.showToast({ title: '请至少选择一个角色', icon: 'none' });
					return;
				}

				uni.showLoading({ title: '保存中...' });
				uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'updateUserRole',
						params: {
							uid: this.currentUser._id,
							roles: this.selectedRoles
						},
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						uni.hideLoading();
						if (res.result.code === 0) {
							uni.showToast({ title: '角色已更新' });
							this.closePopup();
							this.loadData();
						} else {
							uni.showToast({ title: res.result.msg || '更新失败', icon: 'none' });
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
		background-color: #f7f8fa;
		min-height: 100vh;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.search-box {
		background-color: #fff;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.list {
		padding: 12px;
	}

	.item {
		background: #fff;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		position: relative;

		.info-row {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 8px;

			.name {
				font-size: 16px;
				font-weight: 600;
				color: #323233;
				flex: 1;
				margin-right: 8px;
			}

			.role-badges {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
				justify-content: flex-end;
				max-width: 50%;
			}

			.role-badge {
				font-size: 11px;
				color: #1989fa;
				background: #ecf9ff;
				padding: 2px 6px;
				border-radius: 4px;

				&.empty {
					color: #969799;
					background: #f2f3f5;
				}
			}
		}

		.detail-row {
			font-size: 13px;
			color: #646566;
			margin-bottom: 4px;

			.label { color: #969799; }
			.value { color: #323233; }
		}

		.edit-btn {
			position: absolute;
			right: 16px;
			bottom: 16px;
			font-size: 12px;
			color: #1989fa;
			background: #ecf9ff;
			padding: 4px 12px;
			border-radius: 100px;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80px 0;
		color: #969799;

		.empty-icon {
			font-size: 64px;
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.empty-text {
			font-size: 14px;
		}
	}

	/* 自定义弹窗样式 */
	.custom-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;

		.mask {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.6);
		}

		.popup-panel {
			position: relative;
			z-index: 1000;
			background-color: #fff;
			width: 85vw;
			border-radius: 12px;
			padding: 24px;
			animation: fadeIn 0.2s ease-out;

			.popup-title {
				font-size: 18px;
				font-weight: bold;
				text-align: center;
				color: #323233;
			}

			.popup-subtitle {
				font-size: 13px;
				color: #969799;
				text-align: center;
				margin-top: 6px;
				margin-bottom: 20px;
			}

			.role-list {
				margin-bottom: 20px;
			}

			.role-item {
				display: flex;
				align-items: center;
				padding: 12px 0;
				border-bottom: 1px solid #f2f3f5;

				&:last-child {
					border-bottom: none;
				}
			}

			.checkbox {
				width: 20px;
				height: 20px;
				border: 2px solid #dcdee0;
				border-radius: 4px;
				margin-right: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.2s;

				&.checked {
					background: #1989fa;
					border-color: #1989fa;
				}

				.check-icon {
					color: #fff;
					font-size: 14px;
					font-weight: bold;
				}
			}

			.role-name {
				font-size: 15px;
				color: #323233;
			}

			.role-icon {
				font-size: 18px;
				margin-right: 8px;
			}

			.popup-actions {
				display: flex;
				gap: 12px;
				margin-top: 10px;

				.btn {
					flex: 1;
					height: 44px;
					line-height: 44px;
					font-size: 15px;
					border-radius: 4px;
					margin: 0;
					padding: 0;

					&::after { border: none; }

					&.cancel { background: #f2f3f5; color: #646566; }
					&.confirm { background: #1989fa; color: #fff; }
				}
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
