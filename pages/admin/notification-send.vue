<template>
	<view class="container">
		<view class="form card">
			<view class="form-item">
				<text class="label">通知标题</text>
				<input class="input" v-model="formData.title" placeholder="输入标题" />
			</view>
			
			<view class="form-item">
				<text class="label">通知内容</text>
				<textarea class="textarea" v-model="formData.content" placeholder="输入通知详细内容..." />
			</view>
			
			<view class="form-item">
				<text class="label">发送范围</text>
				<radio-group class="radio-group" @change="onTargetTypeChange">
					<label class="radio-label"><radio value="all" :checked="formData.targetType === 'all'" />所有人</label>
					<label class="radio-label"><radio value="role" :checked="formData.targetType === 'role'" />按角色</label>
					<label class="radio-label"><radio value="user" :checked="formData.targetType === 'user'" />按用户</label>
				</radio-group>
			</view>
			
			<!-- 按角色选择 -->
			<view class="sub-form" v-if="formData.targetType === 'role'">
				<text class="sub-label">选择目标角色</text>
				<checkbox-group @change="onRolesChange" class="checkbox-group">
					<label class="checkbox-label" v-for="role in allRoles" :key="role">
						<checkbox :value="role" :checked="formData.targetRoles.includes(role)" />{{ role }}
					</label>
				</checkbox-group>
			</view>
			
			<!-- 按用户选择 -->
			<view class="sub-form" v-if="formData.targetType === 'user'">
				<view class="sub-header">
					<text class="sub-label">已选择 {{ formData.targetUsers.length }} 人</text>
					<button class="btn-mini" size="mini" @click="showUserPicker = true">添加用户</button>
				</view>
				<view class="user-tags">
					<view class="user-tag" v-for="(u, index) in selectedUserNames" :key="index">
						{{ u }} <text class="close" @click="removeUser(index)">×</text>
					</view>
				</view>
			</view>
		</view>
		
		<button class="btn-primary" @click="submit">立即下发通知</button>
		
		<!-- 用户选择弹窗 (简易实现) -->
		<view class="modal" v-if="showUserPicker">
			<view class="modal-content card">
				<view class="modal-header">
					<text class="modal-title">搜索并选择用户</text>
					<text class="close-icon" @click="showUserPicker = false">×</text>
				</view>
				<input class="search-input" v-model="searchKey" placeholder="输入姓名/手机号搜索" @input="onSearch" />
				<scroll-view scroll-y class="user-list">
					<view class="user-item" v-for="user in searchList" :key="user._id" @click="selectUser(user)">
						<text>{{ user.nickname || user.username }} ({{ user.mobile || '无手机号' }})</text>
					</view>
				</scroll-view>
			</view>
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
		methods: {
			onTargetTypeChange(e) {
				this.formData.targetType = e.detail.value;
			},
			onRolesChange(e) {
				this.formData.targetRoles = e.detail.value;
			},
			onSearch() {
				if (this.searchKey.length < 1) {
					this.searchList = [];
					return;
				}
				const db = uniCloud.database();
				db.collection('uni-id-users').where({
					nickname: new RegExp(this.searchKey, 'i')
				})
				.field('_id, nickname, username, mobile')
				.limit(10).get().then(res => {
					this.searchList = res.result.data;
				});
			},
			selectUser(user) {
				if (!this.formData.targetUsers.includes(user._id)) {
					this.formData.targetUsers.push(user._id);
					this.selectedUserNames.push(user.nickname || user.username);
				}
				this.showUserPicker = false;
				this.searchKey = '';
				this.searchList = [];
			},
			removeUser(index) {
				this.formData.targetUsers.splice(index, 1);
				this.selectedUserNames.splice(index, 1);
			},
			submit() {
				if (!this.formData.title || !this.formData.content) {
					uni.showToast({ title: '请填写完整', icon: 'none' });
					return;
				}
				
				uni.showLoading({ title: '正在发送' });
				uniCloud.callFunction({
					name: 'notification-manager',
					data: {
						action: 'create',
						params: this.formData,
						uniIdToken: uni.getStorageSync('uni_id_token')
					},
					success: (res) => {
						if (res.result.code === 0) {
							uni.showToast({ title: '已下发' });
							setTimeout(() => uni.navigateBack(), 1500);
						} else {
							uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					},
					fail: () => uni.showToast({ title: '网络错误', icon: 'none' }),
					complete: () => uni.hideLoading()
				});
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
		margin-bottom: 20px;
	}
	
	.form-item {
		margin-bottom: 20px;
		.label { font-size: 14px; color: #646566; margin-bottom: 8px; display: block; font-weight: bold; }
		.input { border: 1px solid #ebedf0; padding: 10px; border-radius: 4px; font-size: 14px; }
		.textarea { border: 1px solid #ebedf0; padding: 10px; border-radius: 4px; font-size: 14px; width: 100%; height: 100px; box-sizing: border-box; }
		.radio-group { display: flex; gap: 15px; .radio-label { font-size: 14px; } }
	}
	
	.sub-form {
		background: #f9f9f9;
		padding: 12px;
		border-radius: 8px;
		.sub-label { font-size: 12px; color: #969799; margin-bottom: 10px; display: block; }
		.checkbox-group { display: flex; flex-direction: column; gap: 8px; .checkbox-label { font-size: 13px; } }
		
		.sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
		.user-tags { display: flex; flex-wrap: wrap; gap: 8px;
			.user-tag { background: #e8f3ff; color: #1677ff; padding: 4px 8px; border-radius: 4px; font-size: 12px;
				.close { margin-left: 6px; font-weight: bold; }
			}
		}
	}
	
	.btn-primary { background: #1677ff; color: #fff; border-radius: 25px; margin-top: 20px; }
	
	.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
		.modal-content { width: 100%; max-height: 70vh; display: flex; flex-direction: column; margin-bottom: 0; }
		.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; .modal-title { font-weight: bold; } .close-icon { font-size: 24px; color: #969799; } }
		.search-input { border: 1px solid #ebedf0; padding: 8px; border-radius: 4px; margin-bottom: 10px; }
		.user-list { flex: 1; .user-item { padding: 12px 0; border-bottom: 1px solid #f2f3f5; font-size: 14px; } }
	}
</style>