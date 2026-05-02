<template>
	<view class="page-bg">
		<view class="container">
			<!-- Form Card -->
			<view class="form-card">
				<view class="section-title">基本信息</view>
				<view class="form-item">
					<text class="label">通知标题</text>
					<input class="input" v-model="formData.title" placeholder="请简要概括通知内容" placeholder-class="placeholder" />
				</view>
				
				<view class="form-item">
					<text class="label">详细内容</text>
					<textarea class="textarea" v-model="formData.content" placeholder="请输入需要下发的具体通知正文..." placeholder-class="placeholder" />
				</view>

				<view class="form-item">
					<text class="label">通知分类</text>
					<view class="pill-selector">
						<view 
							class="pill-item" 
							:class="{ active: formData.type === 'system' }" 
							@click="formData.type = 'system'"
						>系统公告</view>
						<view 
							class="pill-item" 
							:class="{ active: formData.type === 'reminder' }" 
							@click="formData.type = 'reminder'"
						>业务提醒</view>
					</view>
				</view>
				
				<view class="divider"></view>
				
				<view class="section-title">推送范围</view>
				<view class="form-item">
					<view class="pill-selector">
						<view 
							class="pill-item" 
							:class="{ active: formData.targetType === 'all' }" 
							@click="formData.targetType = 'all'"
						>所有人</view>
						<view 
							class="pill-item" 
							:class="{ active: formData.targetType === 'role' }" 
							@click="formData.targetType = 'role'"
						>按角色</view>
						<view 
							class="pill-item" 
							:class="{ active: formData.targetType === 'user' }" 
							@click="formData.targetType = 'user'"
						>按用户</view>
					</view>
				</view>
				
				<!-- Target: Roles -->
				<view class="sub-section animate-fade-in" v-if="formData.targetType === 'role'">
					<text class="sub-label">选择目标角色 (多选)</text>
					<view class="checkbox-grid">
						<view 
							class="check-pill" 
							v-for="role in allRoles" 
							:key="role"
							:class="{ active: formData.targetRoles.includes(role) }"
							@click="toggleRole(role)"
						>
							<text class="check-icon" v-if="formData.targetRoles.includes(role)">✓</text>
							<text>{{ role }}</text>
						</view>
					</view>
				</view>
				
				<!-- Target: Users -->
				<view class="sub-section animate-fade-in" v-if="formData.targetType === 'user'">
					<view class="sub-header">
						<text class="sub-label">已选用户 ({{ formData.targetUsers.length }})</text>
						<view class="add-user-btn" @click="openUserPicker">
							<text class="plus">+</text>添加用户
						</view>
					</view>
					<view class="user-chips" v-if="selectedUserNames.length > 0">
						<view class="chip" v-for="(u, index) in selectedUserNames" :key="index">
							<text class="chip-text">{{ u }}</text>
							<text class="chip-close" @click="removeUser(index)">×</text>
						</view>
					</view>
					<view class="empty-selection" v-else @click="openUserPicker">
						<text>点击上方按钮搜索并添加指定接收人</text>
					</view>
				</view>
			</view>
			
			<!-- Submit -->
			<view class="footer-btn-box">
				<button class="submit-btn" :class="{ disabled: !isFormValid }" @click="submit">
					<text class="icon">🚀</text> 立即下发通知
				</button>
				<text class="notice-hint">通知下发后无法撤回，请检查内容是否准确</text>
			</view>
		</view>
		
		<!-- User Search Bottom Sheet -->
		<view class="mask" :class="{ show: showUserPicker }" @click="showUserPicker = false"></view>
		<view class="bottom-sheet" :class="{ show: showUserPicker }">
			<view class="sheet-header">
				<text class="sheet-title">搜索接收人</text>
				<view class="sheet-close" @click="showUserPicker = false">×</view>
			</view>
			
			<view class="search-box">
				<icon type="search" size="14" color="#86909c" />
				<input 
					class="search-input" 
					v-model="searchKey" 
					placeholder="输入姓名或手机号" 
					@input="onSearch" 
					focus 
				/>
			</view>
			
			<scroll-view scroll-y class="search-results">
				<view class="user-item" v-for="user in searchList" :key="user._id" @click="selectUser(user)">
					<view class="user-avatar">{{ (user.nickname || user.username || '?').charAt(0) }}</view>
					<view class="user-info-text">
						<text class="user-nickname">{{ user.nickname || user.username }}</text>
						<text class="user-mobile">{{ user.mobile || '未绑定手机' }}</text>
					</view>
					<view class="select-marker" :class="{ active: formData.targetUsers.includes(user._id) }">
						{{ formData.targetUsers.includes(user._id) ? '已选' : '选择' }}
					</view>
				</view>
				<view class="search-empty" v-if="searchKey && searchList.length === 0">
					<text>未找到匹配用户</text>
				</view>
				<view class="search-tip" v-if="!searchKey">
					<text>请输入至少一个字开始搜索</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				formData: {
					title: '',
					content: '',
					type: 'system',
					targetType: 'all',
					targetRoles: [],
					targetUsers: []
				},
				allRoles: ['玖顺员工', '经销商/服务人员', 'admin'],
				selectedUserNames: [],
				showUserPicker: false,
				searchKey: '',
				searchList: []
			}
		},
		computed: {
			isFormValid() {
				const basic = this.formData.title && this.formData.content;
				if (this.formData.targetType === 'role') return basic && this.formData.targetRoles.length > 0;
				if (this.formData.targetType === 'user') return basic && this.formData.targetUsers.length > 0;
				return basic;
			}
		},
		methods: {
			toggleRole(role) {
				const idx = this.formData.targetRoles.indexOf(role);
				if (idx > -1) {
					this.formData.targetRoles.splice(idx, 1);
				} else {
					this.formData.targetRoles.push(role);
				}
			},
			openUserPicker() {
				this.showUserPicker = true;
				this.searchKey = '';
				this.searchList = [];
			},
			onSearch() {
				if (!this.searchKey) {
					this.searchList = [];
					return;
				}
				const db = uniCloud.database();
				db.collection('uni-id-users').where({
					nickname: new RegExp(this.searchKey, 'i')
				})
				.field('_id, nickname, username, mobile')
				.limit(15).get().then(res => {
					this.searchList = res.result.data;
				});
			},
			selectUser(user) {
				if (!this.formData.targetUsers.includes(user._id)) {
					this.formData.targetUsers.push(user._id);
					this.selectedUserNames.push(user.nickname || user.username);
				}
				this.showUserPicker = false;
			},
			removeUser(index) {
				this.formData.targetUsers.splice(index, 1);
				this.selectedUserNames.splice(index, 1);
			},
			submit() {
				if (!this.isFormValid) {
					uni.showToast({ title: '请完善发送信息', icon: 'none' });
					return;
				}
				
				uni.showLoading({ title: '正在发布' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'create',
						params: this.formData,
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							uni.showToast({ title: '发布成功', icon: 'success' });
							setTimeout(() => uni.navigateBack(), 1500);
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					complete: () => uni.hideLoading()
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.page-bg {
		min-height: 100vh;
		background-color: #f7f9fc;
		padding: 16px;
		padding-bottom: 60px;
	}

	.form-card {
		background: #fff;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.03);
	}

	.section-title {
		font-size: 16px;
		font-weight: bold;
		color: #1d2129;
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		&::before {
			content: '';
			width: 4px;
			height: 16px;
			background: #165dff;
			border-radius: 2px;
			margin-right: 8px;
		}
	}

	.form-item {
		margin-bottom: 20px;
		
		.label {
			font-size: 14px;
			color: #4e5969;
			margin-bottom: 8px;
			display: block;
		}
		
		.input {
			background: #f2f3f5;
			padding: 12px 16px;
			border-radius: 8px;
			font-size: 15px;
			color: #1d2129;
		}
		
		.textarea {
			background: #f2f3f5;
			padding: 12px 16px;
			border-radius: 8px;
			font-size: 15px;
			color: #1d2129;
			width: 100%;
			height: 120px;
			box-sizing: border-box;
		}
		
		.placeholder { color: #86909c; font-size: 14px; }
	}

	.divider {
		height: 1px;
		background: #f2f3f5;
		margin: 24px 0;
	}

	/* Pill Selector Styling */
	.pill-selector {
		display: flex;
		background: #f2f3f5;
		padding: 4px;
		border-radius: 10px;
		
		.pill-item {
			flex: 1;
			text-align: center;
			padding: 8px 0;
			font-size: 14px;
			color: #4e5969;
			border-radius: 7px;
			transition: all 0.2s;
			
			&.active {
				background: #fff;
				color: #165dff;
				font-weight: 600;
				box-shadow: 0 2px 8px rgba(0,0,0,0.05);
			}
		}
	}

	.sub-section {
		padding-top: 10px;
		
		.sub-label {
			font-size: 13px;
			color: #86909c;
			margin-bottom: 12px;
			display: block;
		}
	}

	/* Checkbox Grid */
	.checkbox-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		
		.check-pill {
			background: #f2f3f5;
			padding: 6px 16px;
			border-radius: 20px;
			font-size: 13px;
			color: #4e5969;
			display: flex;
			align-items: center;
			gap: 4px;
			transition: all 0.2s;
			
			&.active {
				background: rgba(22, 93, 255, 0.1);
				color: #165dff;
				font-weight: 500;
			}
			
			.check-icon { font-weight: bold; }
		}
	}

	/* User Chips */
	.sub-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		
		.add-user-btn {
			font-size: 13px;
			color: #165dff;
			font-weight: 500;
			.plus { margin-right: 4px; font-weight: bold; }
		}
	}

	.user-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		
		.chip {
			background: #e8f3ff;
			padding: 4px 10px;
			border-radius: 6px;
			display: flex;
			align-items: center;
			gap: 6px;
			
			.chip-text { font-size: 13px; color: #165dff; }
			.chip-close { font-size: 16px; color: #165dff; opacity: 0.6; }
		}
	}

	.empty-selection {
		background: #f7f8fa;
		border: 1px dashed #c9cdd4;
		border-radius: 8px;
		padding: 20px;
		text-align: center;
		font-size: 13px;
		color: #86909c;
	}

	/* Footer */
	.footer-btn-box {
		margin-top: 32px;
		text-align: center;
		
		.submit-btn {
			background: #165dff;
			color: #fff;
			border-radius: 25px;
			height: 50px;
			line-height: 50px;
			font-weight: bold;
			font-size: 16px;
			box-shadow: 0 8px 16px rgba(22, 93, 255, 0.2);
			
			&.disabled { background: #c9cdd4; box-shadow: none; }
			&::after { border: none; }
			
			.icon { margin-right: 8px; }
		}
		
		.notice-hint {
			font-size: 12px;
			color: #86909c;
			margin-top: 12px;
			display: block;
		}
	}

	/* Bottom Sheet Modal */
	.mask {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.5);
		z-index: 1000;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
		&.show { opacity: 1; pointer-events: auto; }
	}

	.bottom-sheet {
		position: fixed;
		left: 0; right: 0; bottom: 0;
		background: #fff;
		border-radius: 20px 20px 0 0;
		z-index: 1001;
		transform: translateY(100%);
		transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		
		&.show { transform: translateY(0); }
		
		.sheet-header {
			padding: 20px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid #f2f3f5;
			.sheet-title { font-size: 17px; font-weight: bold; color: #1d2129; }
			.sheet-close { font-size: 24px; color: #86909c; padding: 4px; }
		}
		
		.search-box {
			padding: 12px 20px;
			background: #f2f3f5;
			margin: 16px 20px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			gap: 10px;
			.search-input { flex: 1; font-size: 15px; }
		}
		
		.search-results {
			flex: 1;
			padding: 0 20px 30px;
			
			.user-item {
				display: flex;
				align-items: center;
				padding: 14px 0;
				border-bottom: 1px solid #f2f3f5;
				
				.user-avatar {
					width: 40px; height: 40px;
					background: #165dff;
					color: #fff;
					border-radius: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: bold;
					margin-right: 12px;
				}
				
				.user-info-text {
					flex: 1;
					display: flex;
					flex-direction: column;
					.user-nickname { font-size: 15px; font-weight: 500; color: #1d2129; }
					.user-mobile { font-size: 13px; color: #86909c; }
				}
				
				.select-marker {
					font-size: 13px;
					color: #165dff;
					padding: 4px 12px;
					border: 1px solid #165dff;
					border-radius: 4px;
					&.active { background: #165dff; color: #fff; }
				}
			}
		}
		
		.search-empty, .search-tip {
			text-align: center;
			padding: 40px 0;
			color: #86909c;
			font-size: 14px;
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(5px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>