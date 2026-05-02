<template>
	<view class="container">
		<!-- 1. 搜索栏 -->
		<view class="search-box">
			<uni-search-bar @confirm="search" @cancel="cancelSearch" @clear="clearSearch" placeholder="搜索经销商或业务员" />
		</view>

		<!-- 2. 数据列表 -->
		<view class="list">
			<view class="item" v-for="(item, index) in list" :key="item._id" @click="handleEdit(item)">
				<view class="info-row">
					<text class="name">{{ item.name }}</text>
					<text class="region-badge">{{ item.region || '未设地区' }}</text>
					<text v-if="item.selfWarranty" class="self-warranty-badge">自行三包</text>
				</view>
				<view class="detail-row">
					<text class="label">业务员：</text>
					<text class="value">{{ item.salesman || '未指定' }}</text>
				</view>
				<view class="edit-btn">编辑</view>
			</view>

			<view v-if="list.length === 0 && !isLoading" class="empty">
				<text>暂无经销商数据</text>
			</view>
		</view>

		<view class="load-status" v-if="list.length > 0">
			<text v-if="isLoadingMore">正在加载...</text>
			<text v-else-if="!hasMore">—— 已展示全部经销商 ——</text>
			<text v-else>上滑加载更多</text>
		</view>

		<view v-if="isLoading && list.length === 0" class="loading-text">加载中...</view>

		<!-- 3. 悬浮新增按钮 -->
		<view class="fab" @click="handleAdd">
			<text class="plus">+</text>
		</view>

		<!-- 4. 自定义弹出层 (代替 uni-popup，彻底避免组件 Bug) -->
		<view v-show="showPopup" class="custom-overlay">
			<view class="mask" @click="closePopup"></view>
			<view class="popup-panel" @click.stop>
				<view class="popup-title">{{ formData._id ? '修改经销商' : '新增经销商' }}</view>

				<view class="form-item" @click.stop>
					<text class="label">客户名称 <text class="required">*</text></text>
					<input class="input" v-model="formData.name" placeholder="请输入客户名称" @focus="onInputFocus" @click.stop adjust-position="false" />
				</view>

				<view class="form-item" @click.stop>
					<text class="label">业务员</text>
					<input class="input" v-model="formData.salesman" placeholder="请输入业务员姓名" @focus="onInputFocus" @click.stop adjust-position="false" />
				</view>

				<view class="form-item" @click.stop>
					<text class="label">地区</text>
					<input class="input" v-model="formData.region" placeholder="请输入省市区" @focus="onInputFocus" @click.stop adjust-position="false" />
				</view>

				<view class="form-item switch-item" @click.stop>
					<text class="label">自行三包</text>
					<switch class="self-switch" :checked="formData.selfWarranty === true" @change="onSelfWarrantyChange" color="#1989fa" />
				</view>

				<view class="popup-actions">
					<button class="btn cancel" @click="closePopup">取消</button>
					<button v-if="formData._id" class="btn delete" @click="handleDelete">删除</button>
					<button class="btn confirm" @click="submitForm">保存</button>
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
				page: 1,
				pageSize: 15,
				total: 0,
				hasMore: true,
				isLoading: false,
				isLoadingMore: false,
				showPopup: false,
				formData: {
					_id: '',
					name: '',
					salesman: '',
					region: '',
					selfWarranty: false
				}
			}
		},
		onShow() {
			this.showPopup = false;
		},
		onLoad() {
			this.loadData();
		},
		onReachBottom() {
			if (this.hasMore && !this.isLoadingMore) {
				this.page++;
				this.loadData(true);
			}
		},
		methods: {
			search(res) {
				this.page = 1;
				this.list = [];
				this.hasMore = true;
				this.searchKey = res.value;
				this.loadData();
			},
			cancelSearch() {
				this.searchKey = '';
				this.page = 1;
				this.list = [];
				this.hasMore = true;
				this.loadData();
			},
			clearSearch() {
				this.searchKey = '';
				this.page = 1;
				this.list = [];
				this.hasMore = true;
				this.loadData();
			},
			loadData(isAppend = false) {
				if (this.isLoading) return;

				if (isAppend) {
					this.isLoadingMore = true;
				} else {
					this.isLoading = true;
				}

				const db = uniCloud.database();
				let whereObj = {};

				if (this.searchKey) {
					whereObj = db.command.or([
						{ name: new RegExp(this.searchKey, 'i') },
						{ salesman: new RegExp(this.searchKey, 'i') }
					]);
				}

				db.collection('jiushun-distributors')
					.where(whereObj)
					.orderBy('create_date', 'desc')
					.skip((this.page - 1) * this.pageSize)
					.limit(this.pageSize)
					.get()
					.then(res => {
						if (res.result.data) {
							if (isAppend) {
								this.list = this.list.concat(res.result.data);
							} else {
								this.list = res.result.data;
							}
							this.hasMore = res.result.data.length >= this.pageSize;
						} else {
							this.hasMore = false;
						}
					})
					.catch(err => {
						console.error('加载失败:', err);
						uni.showToast({ title: '加载失败', icon: 'none' });
					})
					.finally(() => {
						this.isLoading = false;
						this.isLoadingMore = false;
					});
			},
			handleAdd() {
				this.formData = {
					_id: '',
					name: '',
					salesman: '',
					region: '',
					selfWarranty: false
				};
				this.showPopup = true;
			},
			handleEdit(item) {
				this.formData = JSON.parse(JSON.stringify(item));
				this.showPopup = true;
			},
			onInputFocus() {
				// 阻止输入框聚焦时意外关闭弹窗
			},
			onSelfWarrantyChange(e) {
				this.formData.selfWarranty = e.detail.value;
			},
			closePopup() {
				this.showPopup = false;
			},
			async submitForm() {
				if (!this.formData.name || !this.formData.name.trim()) {
					uni.showToast({ title: '客户名称必填', icon: 'none' });
					return;
				}

				uni.showLoading({ title: '正在提交...', mask: true });

				try {
					const db = uniCloud.database();
					const collection = db.collection('jiushun-distributors');

					if (this.formData._id) {
						const { _id, ...updateData } = this.formData;
						await collection.doc(_id).update(updateData);
					} else {
						// 手动设置创建时间和创建者 ID (Schema 强制默认值可能因环境兼容性报 Object 错误)
						const userInfo = uniCloud.getCurrentUserInfo();
						const addData = {
							...this.formData,
							create_date: Date.now(),
							creator_uid: userInfo.uid
						};
						delete addData._id; // 确保不包含空 ID
						await collection.add(addData);
					}

					uni.hideLoading();
					uni.showToast({ title: '已保存' });
					this.closePopup();
					this.page = 1;
					this.list = [];
					this.hasMore = true;
					this.loadData();
				} catch (err) {
					uni.hideLoading();
					uni.showToast({ title: err.message || '操作失败', icon: 'none' });
				}
			},
			handleDelete() {
				uni.showModal({
					title: '删除确认',
					content: `确定要删除 "${this.formData.name}" 吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '正在删除' });
							try {
								const db = uniCloud.database();
								await db.collection('jiushun-distributors').doc(this.formData._id).remove();
								uni.hideLoading();
								uni.showToast({ title: '已删除' });
								this.closePopup();
								this.page = 1;
								this.list = [];
								this.hasMore = true;
								this.loadData();
							} catch (e) {
								uni.hideLoading();
								uni.showToast({ title: '删除失败', icon: 'none' });
							}
						}
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
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
		position: relative;

		.info-row {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 10px;
			flex-wrap: wrap;
			gap: 8px;

			.name {
				font-size: 16px;
				font-weight: 600;
				color: #323233;
				flex: 1;
				margin-right: 8px;
			}

			.region-badge {
				font-size: 12px;
				color: #1989fa;
				background: #ecf9ff;
				padding: 2px 6px;
				border-radius: 4px;
			}

			.self-warranty-badge {
				font-size: 11px;
				color: #52c41a;
				background: #f6ffed;
				padding: 2px 6px;
				border-radius: 4px;
				border: 1px solid #b7eb8f;
			}
		}

		.detail-row {
			font-size: 14px;
			color: #646566;
			.label { color: #969799; }
		}

		.edit-btn {
			position: absolute;
			right: 16px;
			bottom: 16px;
			font-size: 12px;
			color: #1989fa;
			border: 1px solid #1989fa;
			padding: 2px 10px;
			border-radius: 100px;
		}
	}

	.fab {
		position: fixed;
		right: 24px;
		bottom: 40px;
		width: 56px;
		height: 56px;
		background: #1989fa;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
		z-index: 99;

		.plus {
			color: #fff;
			font-size: 32px;
			font-weight: bold;
		}
	}

	/* 自定义 Overlay 样式 - 100% 受控 */
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
				margin-bottom: 24px;
				color: #323233;
			}

			.form-item {
				margin-bottom: 20px;

				.label {
					display: block;
					font-size: 14px;
					color: #646566;
					margin-bottom: 8px;
					.required { color: #ee0a24; margin-left: 4px; }
				}

				.input {
					background: #f7f8fa;
					height: 44px;
					border-radius: 4px;
					padding: 0 12px;
					font-size: 15px;
				}
			}

			.switch-item {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.label {
					margin-bottom: 0;
				}

				.self-switch {
					transform: scale(0.8);
				}
			}

			.popup-actions {
				display: flex;
				gap: 12px;
				margin-top: 30px;

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
					&.delete { background: #fff; color: #ee0a24; border: 1px solid #ee0a24; }
				}
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}

	.empty, .loading-text, .error-text {
		text-align: center;
		padding: 60px 0;
		color: #969799;
		font-size: 14px;
	}

	.load-status {
		text-align: center;
		padding: 20px 0;
		color: #969799;
		font-size: 13px;
	}
</style>
