<template>
	<view class="page-wrapper">
		<view class="container">
			<!-- Section A: Basic Info -->
			<view class="section">
				<view class="section-title">基础信息</view>
				<view class="form-item">
					<text class="label">派工单号</text>
					<input class="input disabled" :value="formData.orderNo" disabled placeholder="自动生成" />
				</view>
				<view class="form-item">
					<text class="label">填单人</text>
					<input class="input disabled" :value="currentUser" disabled />
				</view>
			</view>

			<!-- Section B: Customer Info -->
			<view class="section">
				<view class="section-title">客户资料</view>
				<view class="form-item">
					<text class="label required">姓名</text>
					<input class="input" v-model="formData.customer.name" placeholder="客户姓名" />
				</view>
				<view class="form-item">
					<text class="label required">电话</text>
					<input class="input" type="number" v-model="formData.customer.phone" placeholder="联系电话" maxlength="11" />
				</view>
				<view class="form-item">
					<text class="label required">地址</text>
					<input class="input" v-model="formData.customer.address" placeholder="详细地址" />
				</view>
				<view class="form-item">
					<text class="label required">农机用途</text>
					<radio-group @change="onUsageChange" class="radio-group">
						<label class="radio"><radio value="自用" :checked="formData.customer.usageType === '自用'" />自用</label>
						<label class="radio"><radio value="作业" :checked="formData.customer.usageType === '作业'" />作业</label>
					</radio-group>
				</view>
				<view class="form-item">
					<text class="label">经销商</text>
					<input class="input" v-model="formData.customer.distributorName" placeholder="经销商名称" />
				</view>
				<view class="form-item">
					<text class="label required">报修时间</text>
					<picker mode="date" @change="onReportDateChange">
						<view class="picker-view">
							{{ formData.customer.reportTime }}
						</view>
					</picker>
				</view>
			</view>

			<!-- Section C: Product Info -->
			<view class="section">
				<view class="section-title">产品信息</view>
				<view class="form-item">
					<text class="label required">机器编号</text>
					<input class="input" v-model="formData.product.machineNo" placeholder="请输入机器编号" />
				</view>
				<view class="form-item">
					<text class="label required">发动机号</text>
					<input class="input" v-model="formData.product.engineNo" placeholder="请输入发动机号" />
				</view>
				<view class="form-item">
					<text class="label required">生产日期</text>
					<picker mode="date" @change="onDateChange">
						<view class="picker-view">
							{{ formData.product.productionDate || '请选择日期' }}
						</view>
					</picker>
				</view>
				
				<view class="form-item column">
					<text class="label required">铭牌照片</text>
					<view class="upload-box" @click="chooseImage('plate')">
						<image v-if="formData.product.platePhoto" :src="formData.product.platePhoto" mode="aspectFill" class="preview-img"></image>
						<view v-else class="placeholder">
							<text class="icon">📷</text>
							<text>点击上传</text>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<text class="label required">产品型号</text>
					<input class="input" v-model="formData.product.model" placeholder="产品型号" />
				</view>
			</view>

			<!-- Section D: Service Info -->
			<view class="section">
				<view class="section-title">服务内容</view>
				<view class="form-item">
					<text class="label required">服务类型</text>
					<picker :range="serviceTypes" @change="onServiceTypeChange">
						<view class="picker-view">
							{{ formData.service.type || '请选择类型' }}
						</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="label required">故障分类</text>
					<view class="picker-view" @click="toggleFaultPicker">
						{{ formData.service.faultCategory || '请选择分类' }}
					</view>
				</view>
				<view class="form-item column">
					<text class="label required">故障现象</text>
					<textarea class="textarea" v-model="formData.service.faultDesc" placeholder="描述故障表现" />
				</view>
				<view class="form-item column">
					<text class="label required">处理方法</text>
					<textarea class="textarea" v-model="formData.service.handleDesc" placeholder="描述维修过程" />
				</view>
						
				<view class="form-item column">
					<view class="part-header">
						<text class="label">更换零件</text>
						<button size="mini" type="primary" @click="addPart" style="margin:0;">+ 添加</button>
					</view>
					
					<view v-for="(part, idx) in formData.service.parts" :key="idx" class="part-card compact">
						<view class="col-inputs">
							<input v-model="part.name" placeholder="零件名称" class="mini-input mb-5" />
							<input v-model="part.code" placeholder="图号" class="mini-input" />
						</view>
						<view class="col-count">
							<view class="stepper">
								<view class="step-btn" @click.stop="updatePartCount(idx, -1)">-</view>
								<text class="step-val">{{ part.count }}</text>
								<view class="step-btn" @click.stop="updatePartCount(idx, 1)">+</view>
							</view>
						</view>
						<view class="col-action">
							<radio-group @change="(e) => onPartActionChange(e, idx)" class="radio-group-stack">
								<label class="radio-label"><radio value="带回" :checked="part.oldPartAction === '带回'" color="#007aff" style="transform:scale(0.6)" />带回</label>
								<label class="radio-label"><radio value="丢弃" :checked="part.oldPartAction === '丢弃'" color="#ff5252" style="transform:scale(0.6)" />丢弃</label>
							</radio-group>
						</view>
						<view class="col-del" @click="removePart(idx)">×</view>
					</view>
				</view>
				
				<view class="form-item column">
					<text class="label required">现场照片 (最少{{ formData.service.parts.length > 0 ? formData.service.parts.length : 1 }}张)</text>
					<view class="photo-grid">
						<view class="upload-box small" @click="chooseImage('site')">
							<text>+</text>
						</view>
						<image v-for="(img, idx) in formData.service.sitePhotos" :key="idx" :src="img" class="grid-img" mode="aspectFill"></image>
					</view>
				</view>
				
				<view class="form-item">
					<text class="label required">维修完成时间</text>
					<picker mode="time" @change="onFinishTimeChange">
						<view class="picker-view">
							{{ formData.service.finishTime || '请选择时间' }}
						</view>
					</picker>
				</view>
			</view>

			<!-- Section E: Confirmation -->
			<view class="section">
				<view class="section-title">客户确认</view>
				<view class="form-item column">
					<text class="label required">人机合影</text>
					<view class="upload-box" @click="chooseImage('confirm')">
						<image v-if="formData.confirm.machineUserPhoto" :src="formData.confirm.machineUserPhoto" mode="aspectFill" class="preview-img"></image>
						<view v-else class="placeholder">
							<text class="icon">👥</text>
							<text>点击拍摄</text>
						</view>
					</view>
				</view>
			</view>

			<button class="btn-submit" @click="submitOrder">提交工单</button>
		</view>

		<!-- Fault Category Picker Modal -->
		<view class="fault-picker-modal" v-if="showFaultPicker" @click.stop="toggleFaultPicker">
			<view class="modal-content" @click.stop="">
				<view class="modal-header">
					<text class="title">选择故障分类</text>
					<text class="close" @click="toggleFaultPicker">×</text>
				</view>
				<view class="search-bar">
					<input class="search-input" v-model="faultSearchKey" placeholder="输入关键字搜索节点..." />
				</view>
				<scroll-view scroll-y class="list-container">
					<!-- Search Results -->
					<block v-if="faultSearchKey">
						<view v-for="(item, idx) in searchResults" :key="idx" class="list-item leaf-item" @click="selectFaultLeaf(item.name)">
							<view class="name">{{ item.name }}</view>
							<view class="path">{{ item.parent }}</view>
						</view>
						<view v-if="searchResults.length === 0" class="empty-tip">未找到匹配的分类</view>
					</block>
					
					<!-- Category Level -->
					<block v-else-if="!selectedCategory">
						<view v-for="(cat, idx) in faultTree" :key="idx" class="list-item cat-item" @click="selectFaultCategory(cat)">
							<text>{{ cat.title }}</text>
							<text class="arrow">更多</text>
						</view>
					</block>
					
					<!-- Leaf Level -->
					<block v-else>
						<view class="back-bar" @click="selectedCategory = null">
							<text class="back-icon">返回</text>
							<text> ({{ selectedCategory.title }})</text>
						</view>
						<view v-for="(leaf, idx) in selectedCategory.children" :key="idx" class="list-item leaf-item-simple" @click="selectFaultLeaf(leaf)">
							{{ leaf }}
						</view>
					</block>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentUser: '',
				serviceTypes: ['三包', '维修', '保养', '技改', '其他'],
				showFaultPicker: false,
				faultSearchKey: '',
				selectedCategory: null,
				faultTree: [
					{
						title: "动力系统",
						children: ["发动机", "启动马达", "发电机", "高原模块", "熄火电磁阀", "高温", "防冻液、水管等冷却系", "动力传递相关（包含行走皮带、主从皮带轮、涨紧装置等）"]
					},
					{
						title: "行走、传动系统",
						children: ["前桥（包含内部加工件、油封、漏油、转向拉杆等）", "后桥（包含内部加工件、油封、漏油、转向拉杆等）", "变速箱（内部加工件、油封、漏油等）", "行走传动轴", "车轮", "底盘", "主变速等行走操控", "刹车及各连杆", "悬架（包含后桥弹簧及相关组件）"]
					},
					{
						title: "液压系统",
						children: ["各类液压油管及油管接头", "HST", "齿轮泵", "转向器", "液压阀", "升降油缸", "液压油滤清器"]
					},
					{
						title: "电气系统",
						children: ["主线束", "启动开关", "水平旋钮", "仪表盘", "组合开关", "蜂鸣器", "安全开关", "水平传感器", "水平电机", "缺苗报警器", "手、脚油门（仅全柴款）", "大灯", "常开常闭开关", "保险丝", "GPS", "电子燃油泵", "电瓶"]
					},
					{
						title: "供油系统",
						children: ["燃油管", "燃油箱", "燃油滤清器（包含粗滤、精滤）", "燃油油水分离器"]
					},
					{
						title: "插植系统",
						children: ["插植臂（包含调试）", "旋转箱（包含调试）", "插秧箱", "喂入箱（包含调试）", "苗箱（驱动轮、单向离合器、苗箱板等）", "导轨（导轨上所有组件）", "浮体支架", "取苗连杆", "纵送凸轮轴相关（包含弹性销）", "丝杆夹头（包含弹性销、防尘橡胶套）", "感应拉线", "拖沟", "插秧质量（包含缺秧、断秧、漂秧、堵秧、下苗不畅、调整压苗器及阻拦棒等）", "插秧连杆及球头", "液压阀连杆及球头", "插秧传动轴（包含销轴、防尘套）", "插植部减震垫", "浮板", "车头和插植部各相关连接件"]
					},
					{
						title: "拉线类",
						children: ["手油门拉线（仅洋马款）", "脚油门拉线（仅洋马款）", "倒车插植部上升拉线", "划线杆打开拉线", "划线杆收起拉线", "分组拉线"]
					},
					{
						title: "其他类",
						children: ["以上内容以外的所有项目"]
					}
				],
				formData: {
					orderNo: '',
					customer: {
						name: '',
						phone: '',
						address: '',
						usageType: '自用',
						distributorName: '',
						reportTime: ''
					},
					product: {
						machineNo: '',
						engineNo: '',
						productionDate: '',
						platePhoto: '',
						model: ''
					},
					service: {
						type: '',
						faultCategory: '',
						faultDesc: '',
						handleDesc: '',
						finishTime: '',
						parts: [],
						sitePhotos: []
					},
					confirm: {
						machineUserPhoto: ''
					}
				}
			}
		},
		computed: {
			searchResults() {
				if (!this.faultSearchKey) return [];
				const res = [];
				const key = this.faultSearchKey.toLowerCase();
				this.faultTree.forEach(cat => {
					cat.children.forEach(leaf => {
						if (leaf.toLowerCase().indexOf(key) !== -1) {
							res.push({ name: leaf, parent: cat.title });
						}
					});
				});
				return res;
			}
		},
		onLoad() {
			const userInfo = uni.getStorageSync('userInfo');
			this.currentUser = userInfo ? (userInfo.nickname || userInfo.name) : '未知用户';
			const now = new Date();
			this.formData.customer.reportTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			this.formData.service.finishTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
			const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
			this.formData.orderNo = 'JS' + dateStr + Math.floor(Math.random() * 1000);
			this.checkDraft();
		},
		methods: {
			checkDraft() {
				const draft = uni.getStorageSync('order_draft');
				if (draft) {
					uni.showModal({
						title: '发现草稿',
						content: '是否恢复上次未提交的草稿？',
						success: (res) => {
							if (res.confirm) {
								this.formData = draft;
							} else {
								uni.removeStorageSync('order_draft');
							}
						}
					});
				}
			},
			saveDraft() {
				if (this.formData.customer.name) {
					uni.setStorageSync('order_draft', this.formData);
				}
			},
			onUsageChange(e) { this.formData.customer.usageType = e.detail.value; },
			onDateChange(e) { this.formData.product.productionDate = e.detail.value; },
			onReportDateChange(e) { this.formData.customer.reportTime = e.detail.value; },
			onServiceTypeChange(e) { this.formData.service.type = this.serviceTypes[e.detail.value]; },
			toggleFaultPicker() {
				this.showFaultPicker = !this.showFaultPicker;
				if (this.showFaultPicker) {
					this.faultSearchKey = '';
					this.selectedCategory = null;
				}
			},
			selectFaultCategory(cat) {
				this.selectedCategory = cat;
			},
			selectFaultLeaf(leaf) {
				this.formData.service.faultCategory = leaf;
				this.showFaultPicker = false;
			},
			onFinishTimeChange(e) { this.formData.service.finishTime = e.detail.value; },
			addPart() {
				this.formData.service.parts.push({ name: '', code: '', count: 1, oldPartAction: '带回' });
			},
			updatePartCount(index, delta) {
				const part = this.formData.service.parts[index];
				const newCount = (part.count || 0) + delta;
				if (newCount >= 1) {
					part.count = newCount;
				}
			},
			removePart(index) {
				this.formData.service.parts.splice(index, 1);
			},
			onPartActionChange(e, index) {
				this.formData.service.parts[index].oldPartAction = e.detail.value;
			},
			chooseImage(type) {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						const path = res.tempFilePaths[0];
						if (type === 'plate') {
							this.formData.product.platePhoto = path;
						} else if (type === 'confirm') {
							this.formData.confirm.machineUserPhoto = path;
						} else if (type === 'site') {
							this.formData.service.sitePhotos.push(path);
						}
					}
				})
			},
			async submitOrder() {
				if (!this.formData.customer.name || !this.formData.product.machineNo) {
					uni.showToast({ title: '请完善必填信息', icon: 'none' });
					return;
				}
				uni.showLoading({ title: '正在提交...' });
				try {
					const orderNo = this.formData.orderNo;
					const platePhotoId = await this.uploadFile(this.formData.product.platePhoto, orderNo);
					const confirmPhotoId = await this.uploadFile(this.formData.confirm.machineUserPhoto, orderNo);
					const sitePhotoIds = [];
					for (let i = 0; i < this.formData.service.sitePhotos.length; i++) {
						const fid = await this.uploadFile(this.formData.service.sitePhotos[i], orderNo);
						if (fid) sitePhotoIds.push(fid);
					}
					const orderData = {
						orderNo: this.formData.orderNo,
						customerInfo: { ...this.formData.customer, reportTime: new Date(this.formData.customer.reportTime).getTime() },
						productInfo: { ...this.formData.product, platePhoto: platePhotoId, productionDate: this.formData.product.productionDate ? new Date(this.formData.product.productionDate).getTime() : Date.now() },
						serviceInfo: { ...this.formData.service, sitePhotos: sitePhotoIds, finishTime: Date.now() },
						customerConfirm: { machineUserPhoto: confirmPhotoId }
					};
					const today = new Date();
					const [hours, mins] = this.formData.service.finishTime.split(':');
					today.setHours(hours, mins, 0, 0);
					orderData.serviceInfo.finishTime = today.getTime();
					uniCloud.callFunction({
						name: 'work-order-manager',
						data: { action: 'create', params: orderData, uniIdToken: uni.getStorageSync('uni_id_token') },
						success: (cloudRes) => {
							uni.hideLoading();
							if (cloudRes.result.code === 0) {
								uni.removeStorageSync('order_draft');
								uni.showToast({ title: '提交成功' });
								setTimeout(() => { uni.reLaunch({ url: '/pages/index/index' }); }, 1500);
							} else {
								uni.showToast({ title: '提交失败: ' + (cloudRes.result.msg || '未知错误'), icon: 'none' });
							}
						}
					});
				} catch (e) {
					uni.hideLoading();
					uni.showToast({ title: '提交失败', icon: 'none' });
				}
			},
			uploadFile(filePath, folderName) {
				return new Promise((resolve, reject) => {
					if (!filePath || filePath.startsWith('cloud://')) { resolve(filePath); return; }
					const ext = filePath.split('.').pop();
					const cloudPath = `${folderName}/${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
					uniCloud.uploadFile({
						filePath: filePath,
						cloudPath: cloudPath,
						success: (res) => resolve(res.fileID),
						fail: (err) => reject(err)
					});
				});
			}
		}
	}
</script>

<style lang="scss">
	.container { padding: 15px; padding-bottom: 50px; background-color: #f5f5f5; }
	.section { background: #fff; border-radius: 8px; padding: 15px; margin-bottom: 15px;
		.section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #007aff; padding-left: 10px; margin-bottom: 15px; }
	}
	.form-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;
		&:last-child { border-bottom: none; }
		&.column { flex-direction: column; align-items: flex-start; .label { margin-bottom: 10px; } }
		.label { width: 130px; font-size: 14px; color: #333; &.required::after { content: '*'; color: red; } }
		.input, .picker-view, .radio-group { flex: 1; font-size: 14px; }
		.input.disabled { color: #999; }
		.radio { margin-right: 15px; }
		.textarea { width: 100%; height: 80px; background: #f8f8f8; padding: 10px; box-sizing: border-box; border-radius: 4px; font-size: 14px; }
	}
	.upload-box { width: 100px; height: 100px; background: #f0f0f0; border-radius: 4px; display: flex; justify-content: center; align-items: center; overflow: hidden;
		&.small { width: 80px; height: 80px; }
		.placeholder { display: flex; flex-direction: column; align-items: center; color: #999; font-size: 12px; .icon { font-size: 24px; margin-bottom: 5px; } }
		.preview-img { width: 100%; height: 100%; }
	}
	.photo-grid { display: flex; flex-wrap: wrap; gap: 10px; .grid-img { width: 80px; height: 80px; border-radius: 4px; } }
	.part-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 10px; }
	.part-card.compact { display: flex; align-items: stretch; width: 100%; background: #f8f8f8; padding: 5px; border-radius: 4px; margin-bottom: 8px; border: 1px solid #eee; gap: 5px;
		.col-inputs { flex: 2; display: flex; flex-direction: column; justify-content: center; .mini-input { background: #fff; padding: 2px 5px; font-size: 13px; border: 1px solid #ddd; border-radius: 2px; height: 28px; &.mb-5 { margin-bottom: 4px; } } }
		.col-count { width: 70px; display: flex; align-items: center; justify-content: center;
			.stepper { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; background: #fff; overflow: hidden;
				.step-btn { width: 20px; height: 24px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 16px; font-weight: bold; color: #555; }
				.step-val { width: 24px; text-align: center; font-size: 13px; border-left: 1px solid #eee; border-right: 1px solid #eee; }
			}
		}
		.col-action { width: 65px; display: flex; align-items: center; .radio-group-stack { display: flex; flex-direction: column; justify-content: center; .radio-label { font-size: 11px; display: flex; align-items: center; margin-bottom: 2px; white-space: nowrap; } } }
		.col-del { width: 25px; display: flex; align-items: center; justify-content: center; color: #ff5252; font-size: 24px; font-weight: bold; }
	}
	.btn-submit { background-color: #007aff; color: #fff; margin-top: 20px; }

	.fault-picker-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end;
		.modal-content { background: #fff; height: 70vh; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; padding: 20px; }
		.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; .title { font-size: 18px; font-weight: bold; } .close { font-size: 24px; color: #999; padding: 5px; } }
		.search-bar { margin-bottom: 15px; .search-input { background: #f5f5f5; height: 40px; border-radius: 20px; padding: 0 15px; font-size: 14px; } }
		.list-container { flex: 1; overflow: hidden; }
		.list-item { padding: 15px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #333; display: flex; justify-content: space-between; align-items: center;
			&:active { background: #f9f9f9; }
			.arrow { color: #ccc; font-size: 12px; }
		}
		.leaf-item { flex-direction: column; align-items: flex-start; .name { font-size: 15px; margin-bottom: 4px; } .path { font-size: 12px; color: #999; } }
		.leaf-item-simple { padding: 15px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #333; &:active { background: #f9f9f9; } }
		.back-bar { display: flex; align-items: center; padding: 10px 0; color: #007aff; font-size: 14px; border-bottom: 1px solid #eee; .back-icon { margin-right: 5px; font-weight: bold; } }
		.empty-tip { text-align: center; padding: 40px; color: #999; font-size: 14px; }
	}
</style>