<template>
	<view class="container">
		<!-- 1. 搜索栏 -->
		<view class="search-box">
			<uni-search-bar @confirm="search" @cancel="cancelSearch" @clear="clearSearch" placeholder="搜索经销商或业务员" />
		</view>

		<!-- 2. 数据列表 -->
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" collection="jiushun-distributors"
			:where="where" orderby="create_date desc">
			<view v-if="error" class="error-text">{{error.message}}</view>
			<view v-else-if="loading" class="loading-text">加载中...</view>
			<view v-else class="list">
				<view class="item" v-for="(item, index) in data" :key="item._id" @click="handleEdit(item)">
					<view class="info-row">
						<text class="name">{{ item.name }}</text>
						<text class="region-badge">{{ item.region || '未设地区' }}</text>
					</view>
					<view class="detail-row">
						<text class="label">业务员：</text>
						<text class="value">{{ item.salesman || '未指定' }}</text>
					</view>
					<view class="edit-btn">编辑</view>
				</view>
				
				<view v-if="data && data.length === 0" class="empty">
					<text>暂无经销商数据</text>
				</view>
			</view>
		</unicloud-db>

		<!-- 3. 悬浮新增按钮 -->
		<view class="fab" @click="handleAdd">
			<text class="plus">+</text>
		</view>

		<!-- 4. 自定义弹出层 (代替 uni-popup，彻底避免组件 Bug) -->
		<view class="custom-overlay" v-if="showPopup" @click.self="closePopup">
			<view class="popup-panel">
				<view class="popup-title">{{ formData._id ? '修改经销商' : '新增经销商' }}</view>
				
				<view class="form-item">
					<text class="label">客户名称 <text class="required">*</text></text>
					<input class="input" v-model="formData.name" placeholder="请输入客户名称" :focus="showPopup" />
				</view>
				
				<view class="form-item">
					<text class="label">业务员</text>
					<input class="input" v-model="formData.salesman" placeholder="请输入业务员姓名" />
				</view>
				
				<view class="form-item">
					<text class="label">地区</text>
					<input class="input" v-model="formData.region" placeholder="请输入省市区" />
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
				where: '',
				showPopup: false, // 严格控制显示逻辑
				formData: {
					_id: '',
					name: '',
					salesman: '',
					region: ''
				}
			}
		},
		onShow() {
			// 每次进入页面强制关闭弹窗，防止缓存导致自动打开
			this.showPopup = false;
		},
		methods: {
			search(res) {
				this.updateWhere(res.value);
			},
			cancelSearch() {
				this.updateWhere('');
			},
			clearSearch() {
				this.updateWhere('');
			},
			updateWhere(val) {
				if (val) {
					this.where = `/${val}/.test(name) || /${val}/.test(salesman)`;
				} else {
					this.where = '';
				}
			},
			handleAdd() {
				this.formData = {
					_id: '',
					name: '',
					salesman: '',
					region: ''
				};
				this.showPopup = true;
			},
			handleEdit(item) {
				this.formData = JSON.parse(JSON.stringify(item));
				this.showPopup = true;
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
						await collection.add(this.formData);
					}

					uni.hideLoading();
					uni.showToast({ title: '已保存' });
					this.closePopup();
					if (this.$refs.udb) {
						this.$refs.udb.refresh();
					}
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
								this.$refs.udb.refresh();
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
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.popup-panel {
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
</style>
