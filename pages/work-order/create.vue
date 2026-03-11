<template>
	<view class="page-wrapper">
		<view class="container">
			<!-- Section B: Customer Info -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.customer }">
				<view class="card-header" @click="toggleSection('customer')">
					<view class="header-left">
						<text class="header-title">客户资料</text>
						<text v-if="isCustomerComplete" class="header-status">已完善</text>
					</view>
					<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed.customer }"></text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.customer">
					<view class="ui-field">
						<text class="field-label required">姓名</text>
						<input class="field-input" v-model="formData.customer.name" placeholder="输入客户姓名" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">电话</text>
						<input class="field-input" type="number" v-model="formData.customer.phone" placeholder="输入联系电话" maxlength="11" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">地址</text>
						<input class="field-input" v-model="formData.customer.address" placeholder="输入详细地址" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">农机用途</text>
						<radio-group @change="onUsageChange" class="ui-radio-box">
							<label class="radio-item"><radio value="自用" :checked="formData.customer.usageType === '自用'" color="#1677ff" />自用</label>
							<label class="radio-item"><radio value="作业" :checked="formData.customer.usageType === '作业'" color="#1677ff" />作业</label>
						</radio-group>
					</view>
					<view class="ui-field">
						<text class="field-label">经销商</text>
						<input class="field-input" v-model="formData.customer.distributorName" placeholder="经销商名称（选填）" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">报修时间</text>
						<picker mode="date" @change="onReportDateChange" class="field-picker">
							<view class="picker-text">{{ formData.customer.reportTime }}</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- Section C: Product Info -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.product }">
				<view class="card-header" @click="toggleSection('product')">
					<view class="header-left">
						<text class="header-title">产品信息</text>
						<text v-if="isProductComplete" class="header-status">已录入</text>
					</view>
					<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed.product }"></text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.product">
					<view class="ui-field">
						<text class="field-label required">机器编号</text>
						<input class="field-input" v-model="formData.product.machineNo" placeholder="请输入机器编号" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">发动机号</text>
						<input class="field-input" v-model="formData.product.engineNo" placeholder="请输入发动机号" placeholder-class="ph" />
					</view>
					<view class="ui-field">
						<text class="field-label required">生产日期</text>
						<picker mode="date" @change="onDateChange" class="field-picker">
							<view class="picker-text">{{ formData.product.productionDate || '选择日期' }}</view>
						</picker>
					</view>
					
					<view class="ui-field column">
						<text class="field-label required">铭牌照片</text>
						<view class="photo-uploader" @click="chooseImage('plate')">
							<image v-if="formData.product.platePhoto" :src="formData.product.platePhoto" mode="aspectFill" class="photo-preview"></image>
							<view v-else class="photo-placeholder">
								<text class="icon-camera"></text>
								<text class="text">上传铭牌照片</text>
							</view>
						</view>
					</view>
					
					<view class="ui-field">
						<text class="field-label required">产品型号</text>
						<input class="field-input" v-model="formData.product.model" placeholder="输入产品型号" placeholder-class="ph" />
					</view>
				</view>
			</view>

			<!-- Section D: Service Info -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.service }">
				<view class="card-header" @click="toggleSection('service')">
					<view class="header-left">
						<text class="header-title">服务内容</text>
						<text v-if="isServiceComplete" class="header-status">已填写</text>
					</view>
					<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed.service }"></text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.service">
					<view class="ui-field">
						<text class="field-label required">服务类型</text>
						<picker :range="serviceTypes" @change="onServiceTypeChange" class="field-picker">
							<view class="picker-text">{{ formData.service.type || '请选择' }}</view>
						</picker>
					</view>
					<view class="ui-field">
						<text class="field-label required">是否收费</text>
						<radio-group @change="onIsChargeableChange" class="ui-radio-box">
							<label class="radio-item"><radio value="免费" :checked="formData.service.isChargeable === '免费'" color="#52c41a" />免费</label>
							<label class="radio-item"><radio value="收费" :checked="formData.service.isChargeable === '收费'" color="#ff4d4f" />收费</label>
						</radio-group>
					</view>
					<view class="ui-field">
						<text class="field-label required">故障分类</text>
						<view class="field-picker-box" @click="toggleFaultPicker">{{ formData.service.faultCategory || '点击选择分类' }}</view>
					</view>
					<view class="ui-field column">
						<text class="field-label required">故障现象</text>
						<textarea class="field-textarea" v-model="formData.service.faultDesc" placeholder="简述故障表现..." placeholder-class="ph" />
					</view>
					<view class="ui-field column">
						<text class="field-label required">处理方法</text>
						<textarea class="field-textarea" v-model="formData.service.handleDesc" placeholder="简述维修过程..." placeholder-class="ph" />
					</view>
							
					<!-- Parts Detail -->
					<view class="ui-field column no-border">
						<view class="list-header">
							<text class="list-title">更换零件明细</text>
							<view class="btn-text-add" @click="addPart">+ 新增</view>
						</view>
						
						<view v-for="(part, idx) in formData.service.parts" :key="idx" class="part-entry">
							<text class="btn-remove-absolute" @click="removePart(idx)">×</text>
							<view class="entry-row">
								<input v-model="part.name" placeholder="零件名称" class="input-name" placeholder-class="ph" />
							</view>
							
							<view class="entry-row mt-8">
								<input v-model="part.code" placeholder="图号/编码" class="input-code" placeholder-class="ph" />
								<view class="source-picker-inline">
									<text class="s-label">来源</text>
									<picker :range="partSources" @change="onPartSourceChange($event, idx)" class="s-picker">
										<view class="s-value">{{ part.source || '选择来源' }}</view>
									</picker>
								</view>
							</view>

							<view class="part-ext-row" v-if="part.source === '其他'">
								<text class="ext-label required">来源备注</text>
								<input v-model="part.sourceRemark" placeholder="请输入具体来源说明" class="input-remark" placeholder-class="ph-warning" />
							</view>

							<view class="entry-row mt-10 flex-align-center">
								<!-- 数量 -->
								<view class="entry-stepper-wrapper">
									<text class="st-label">数量</text>
									<view class="entry-stepper">
										<text class="s-btn" @click.stop="updatePartCount(idx, -1)">-</text>
										<text class="s-num">{{ part.count }}</text>
										<text class="s-btn" @click.stop="updatePartCount(idx, 1)">+</text>
									</view>
								</view>
								
								<!-- 价格组并排 -->
								<view class="entry-bottom-inline" v-if="formData.service.isChargeable === '收费'">
									<view class="price-box-small">
										<text class="p-label">单价</text>
										<input type="digit" v-model="part.price" class="p-val" />
									</view>
									<view class="price-box-small ml-10">
										<text class="p-label">小计</text>
										<text class="p-total-val">￥{{ ((Number(part.price) || 0) * (part.count || 0)).toFixed(1) }}</text>
									</view>
								</view>
							</view>
						</view>
	
						<view class="list-summary" v-if="formData.service.isChargeable === '收费' && formData.service.parts.length > 0">
							<text>零件费用小计</text>
							<text class="v">￥{{ partsTotal }}</text>
						</view>
					</view>
					
					<view class="ui-field column">
						<text class="field-label required">现场照片</text>
						<view class="grid-uploader">
							<view class="grid-add" @click="chooseImage('site')">
								<text class="icon">+</text>
							</view>
							<view v-for="(img, idx) in formData.service.sitePhotos" :key="idx" class="grid-item">
								<image :src="img" class="img" mode="aspectFill" @click="previewImg(img)"></image>
								<text class="btn-del" @click.stop="removeSitePhoto(idx)">×</text>
							</view>
						</view>
					</view>
					
					<view class="ui-field">
						<text class="field-label required">完成时间</text>
						<view class="time-picker-group">
							<picker mode="date" @change="onFinishDateChange" class="tp"><view>{{ formData.service.finishDate }}</view></picker>
							<picker mode="time" @change="onFinishTimeChange" class="tp ml-5"><view>{{ formData.service.finishTime || '00:00' }}</view></picker>
						</view>
					</view>
				</view>
			</view>

			<!-- Section E: Additional Fees -->
			<view class="ui-card" v-if="formData.service.isChargeable === '收费'" :class="{ 'card-active': !sectionsCollapsed.fees }">
				<view class="card-header" @click="toggleSection('fees')">
					<view class="header-left">
						<text class="header-title">附加费用</text>
					</view>
					<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed.fees }"></text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.fees">
					<view class="fee-card">
						<text class="f-title">路程费核算</text>
						<view class="f-inputs">
							<view class="f-item">里程<input type="digit" v-model="formData.additionalFees.travelFee.distance" />km</view>
							<view class="f-item">单价<input type="digit" v-model="formData.additionalFees.travelFee.unitPrice" />元</view>
						</view>
						<text class="f-subtotal">合计: ￥{{ travelTotal }}</text>
					</view>
	
					<view class="fee-card mt-15">
						<text class="f-title">工时费核算</text>
						<view class="f-time-line">
							<view class="time-tag">
								<text class="l">出发</text>
								<picker mode="date" @change="onDepartureDateChange"><text>{{ formData.additionalFees.laborFee.departureDate }}</text></picker>
								<picker mode="time" @change="onDepartureTimeChange" class="ml-5"><text>{{ formData.additionalFees.laborFee.departureTime }}</text></picker>
							</view>
							<view class="time-tag mt-5">
								<text class="l">返程</text>
								<view class="item-input"><input type="number" v-model="formData.additionalFees.laborFee.returnDuration" /> min</view>
							</view>
						</view>
						<view class="f-inputs mt-10">
							<view class="f-item">总时长<text class="v">{{ laborHours }} h</text></view>
							<view class="f-item">单价<input type="digit" v-model="formData.additionalFees.laborFee.unitPrice" />元</view>
						</view>
						<text class="f-subtotal">合计: ￥{{ laborTotal }}</text>
					</view>
				</view>
			</view>

			<!-- Section F: Confirmation -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.confirm }">
				<view class="card-header" @click="toggleSection('confirm')">
					<view class="header-left">
						<text class="header-title">最终确认</text>
						<text v-if="isConfirmComplete" class="header-status">已上传</text>
					</view>
					<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed.confirm }"></text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.confirm">
					<view class="ui-field column no-border">
						<text class="field-label required hmandmachine">人机合影（施工现场及合照）</text>
						<view class="photo-uploader large" @click="chooseImage('confirm')">
							<image v-if="formData.confirm.machineUserPhoto" :src="formData.confirm.machineUserPhoto" mode="aspectFill" class="photo-preview"></image>
							<view v-else class="photo-placeholder">
								<text class="icon-camera"></text>
								<text class="text">拍摄人机合照</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Settlement Dashboard -->
			<view class="settlement-panel" v-if="formData.service.isChargeable === '收费'">
				<view class="panel-header">费用结算概览</view>
				<view class="panel-grid">
					<view class="p-item"><text class="l">零件总额</text><text class="v">￥{{ partsTotal }}</text></view>
					<view class="p-item"><text class="l">路程费</text><text class="v">￥{{ travelTotal }}</text></view>
					<view class="p-item"><text class="l">工时费</text><text class="v">￥{{ laborTotal }}</text></view>
				</view>
				<view class="panel-total">
					<text>应收合计</text>
					<text class="total-v">￥{{ grandTotal }}</text>
				</view>
			</view>

			<!-- Page Footer -->
			<view class="action-footer">
				<view class="meta-info">
					<view class="item"><text class="lb">单号</text><text class="vl">{{ formData.orderNo }}</text></view>
					<view class="item"><text class="lb">填单</text><text class="vl">{{ currentUser }}</text></view>
				</view>
				<button class="btn-primary-main" @click="submitOrder">正式提交服务单</button>
			</view>
		</view>

		<!-- Fault Picker Modal -->
		<view class="modal-mask" v-if="showFaultPicker" @click.stop="toggleFaultPicker">
			<view class="modal-body" @click.stop="">
				<view class="modal-header">
					<text class="t">选择故障分类</text>
					<text class="c" @click="toggleFaultPicker">✕</text>
				</view>
				<view class="modal-search">
					<input v-model="faultSearchKey" placeholder="搜索关键字..." class="s-input" />
				</view>
				<scroll-view scroll-y class="modal-scroll">
					<block v-if="faultSearchKey">
						<view v-for="(item, idx) in searchResults" :key="idx" class="leaf-item search" @click="selectFaultLeaf(item.name, item.parent)">
							<text class="n">{{ item.name }}</text>
							<text class="p">{{ item.parent }}</text>
						</view>
					</block>
					<block v-else-if="!selectedCategory">
						<view v-for="(cat, idx) in faultTree" :key="idx" class="cat-item" @click="selectFaultCategory(cat)">
							<text>{{ cat.title }}</text>
							<text class="a">›</text>
						</view>
					</block>
					<block v-else>
						<view class="nav-back" @click="selectedCategory = null">
							<text class="i">‹</text><text>{{ selectedCategory.title }}</text>
						</view>
						<view v-for="(leaf, idx) in selectedCategory.children" :key="idx" class="leaf-item" @click="selectFaultLeaf(leaf, selectedCategory.title)">
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
				partSources: ['自带', '经销商调拨', '同厂调拨', '其他'],
				showFaultPicker: false,
				faultSearchKey: '',
				selectedCategory: null,
				faultTree: [
					{ title: "动力系统", children: ["发动机", "启动马达", "发电机", "高原模块", "熄火电磁阀", "高温", "防冻液、水管等冷却系", "动力传递相关（包含行走皮带、主从皮带轮、涨紧装置等）"] },
					{ title: "行走、传动系统", children: ["前桥", "后桥", "变速箱", "行走传动轴", "车轮", "底盘", "主变速", "刹车", "悬架"] },
					{ title: "液压系统", children: ["各类液压油管", "HST", "齿轮泵", "转向器", "液压阀", "升降油缸", "液压油滤清器"] },
					{ title: "电气系统", children: ["主线束", "启动开关", "水平旋钮", "仪表盘", "组合开关", "蜂鸣器", "安全开关", "水平传感器", "水平电机", "缺苗报警器", "大灯", "保险丝", "GPS", "电子燃油泵", "电瓶"] },
					{ title: "供油系统", children: ["燃油管", "燃油箱", "燃油滤清器", "燃油油水分离器"] },
					{ title: "插植系统", children: ["插植臂", "旋转箱", "插秧箱", "喂入箱", "苗箱", "导轨", "浮体支架", "取苗连杆", "感应拉线", "拖沟", "插秧质量", "插秧传动轴", "浮板"] },
					{ title: "拉线类", children: ["手油门拉线", "脚油门拉线", "倒车上升拉线", "划线杆拉线", "分组拉线"] },
					{ title: "其他类", children: ["以上内容以外的所有项目"] }
				],
				formData: {
					orderNo: '',
					customer: { name: '', phone: '', address: '', usageType: '自用', distributorName: '', reportTime: '' },
					product: { machineNo: '', engineNo: '', productionDate: '', platePhoto: '', model: '' },
					service: { type: '', isChargeable: '免费', faultCategory: '', faultDesc: '', handleDesc: '', finishDate: '', finishTime: '', parts: [], sitePhotos: [] },
					additionalFees: {
						travelFee: { distance: 0, unitPrice: 1.2, total: 0 },
						laborFee: { departureDate: '', departureTime: '', returnDuration: 0, unitPrice: 85, totalHours: 0, total: 0 }
					},
					confirm: { machineUserPhoto: '' }
				},
				sectionsCollapsed: { customer: false, product: true, service: false, fees: false, confirm: true }
			}
		},
		computed: {
			partsTotal() { return this.formData.service.parts.reduce((sum, part) => sum + (Number(part.price) || 0) * (part.count || 0), 0).toFixed(1); },
			travelTotal() { const fee = this.formData.additionalFees.travelFee; return (Number(fee.distance || 0) * Number(fee.unitPrice || 0)).toFixed(1); },
			laborHours() {
				const fee = this.formData.additionalFees.laborFee;
				const service = this.formData.service;
				if (!fee.departureDate || !fee.departureTime || !service.finishDate || !service.finishTime) return "0.0";
				try {
					const start = new Date(`${fee.departureDate} ${fee.departureTime}:00`.replace(/-/g, '/'));
					const end = new Date(`${service.finishDate} ${service.finishTime}:00`.replace(/-/g, '/'));
					let diffMs = end - start;
					if (diffMs <= 0) return "0.0";
					return (((diffMs / 60000) + Number(fee.returnDuration || 0)) / 60).toFixed(1);
				} catch (e) { return "0.0"; }
			},
			laborTotal() { return (Number(this.laborHours) * Number(this.formData.additionalFees.laborFee.unitPrice || 0)).toFixed(1); },
			additionalTotal() { return (Number(this.travelTotal) + Number(this.laborTotal)).toFixed(1); },
			grandTotal() { return (Number(this.partsTotal) + Number(this.additionalTotal)).toFixed(1); },
			isCustomerComplete() { const c = this.formData.customer; return !!(c.name && c.phone && c.address); },
			isProductComplete() { const p = this.formData.product; return !!(p.machineNo && p.platePhoto); },
			isServiceComplete() {
				const s = this.formData.service;
				// 基础必填校验
				if (!(s.type && s.faultCategory && s.sitePhotos.length > 0)) return false;
				// 零件校验：如果有零件来源为“其他”，必须填写备注
				for (const part of s.parts) {
					if (part.source === '其他' && !part.sourceRemark) return false;
				}
				return true;
			},
			isConfirmComplete() { return !!this.formData.confirm.machineUserPhoto; },
			searchResults() {
				if (!this.faultSearchKey) return [];
				const res = [];
				const key = this.faultSearchKey.toLowerCase();
				this.faultTree.forEach(cat => { cat.children.forEach(leaf => { if (leaf.toLowerCase().indexOf(key) !== -1) res.push({ name: leaf, parent: cat.title }); }); });
				return res;
			}
		},
		onLoad() {
			const userInfo = uni.getStorageSync('userInfo');
			this.currentUser = userInfo ? (userInfo.nickname || userInfo.name) : '填单人';
			const now = new Date();
			const today = now.toISOString().slice(0, 10);
			this.formData.customer.reportTime = today;
			const depTime = new Date(now.getTime() - 3600000);
			this.formData.additionalFees.laborFee.departureDate = depTime.toISOString().slice(0, 10);
			this.formData.additionalFees.laborFee.departureTime = depTime.toTimeString().slice(0, 5);
			this.formData.service.finishDate = today;
			this.formData.service.finishTime = now.toTimeString().slice(0, 5);
			this.formData.orderNo = 'JS' + today.replace(/-/g, '') + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
			this.checkDraft();
		},
		methods: {
			toggleSection(key) { this.sectionsCollapsed[key] = !this.sectionsCollapsed[key]; },
			onDepartureDateChange(e) { this.formData.additionalFees.laborFee.departureDate = e.detail.value; },
			onDepartureTimeChange(e) { this.formData.additionalFees.laborFee.departureTime = e.detail.value; },
			onFinishDateChange(e) { this.formData.service.finishDate = e.detail.value; },
			onFinishTimeChange(e) { this.formData.service.finishTime = e.detail.value; },
			checkDraft() {
				const draft = uni.getStorageSync('order_draft');
				if (draft) uni.showModal({ title: '草稿提示', content: '是否恢复上次编辑的工单？', success: (res) => { if (res.confirm) this.formData = draft; } });
			},
			onUsageChange(e) { this.formData.customer.usageType = e.detail.value; },
			onDateChange(e) { this.formData.product.productionDate = e.detail.value; },
			onReportDateChange(e) { this.formData.customer.reportTime = e.detail.value; },
			onServiceTypeChange(e) { this.formData.service.type = this.serviceTypes[e.detail.value]; },
			onIsChargeableChange(e) { this.formData.service.isChargeable = e.detail.value; },
			onPartSourceChange(e, index) { this.$set(this.formData.service.parts[index], 'source', this.partSources[e.detail.value]); },
			toggleFaultPicker() { this.showFaultPicker = !this.showFaultPicker; this.selectedCategory = null; },
			selectFaultCategory(cat) { this.selectedCategory = cat; },
			selectFaultLeaf(leaf, parent) {
				this.formData.service.faultCategory = parent ? `${parent}-${leaf}` : leaf;
				this.showFaultPicker = false;
			},
			addPart() { this.formData.service.parts.push({ name: '', code: '', count: 1, oldPartAction: '带回', source: '自带', price: 0 }); },
			updatePartCount(idx, d) { const p = this.formData.service.parts[idx]; if (p.count + d >= 1) p.count += d; },
			removePart(idx) {
				uni.showModal({
					title: '确认删除',
					content: `是否确定删除第 ${idx + 1} 项零件？`,
					success: (res) => {
						if (res.confirm) {
							this.formData.service.parts.splice(idx, 1);
						}
					}
				});
			},
			chooseImage(type) {
				uni.chooseImage({
					count: type === 'site' ? 9 : 1,
					success: (res) => {
						if (type === 'plate') this.formData.product.platePhoto = res.tempFilePaths[0];
						else if (type === 'confirm') this.formData.confirm.machineUserPhoto = res.tempFilePaths[0];
						else if (type === 'site') this.formData.service.sitePhotos.push(...res.tempFilePaths);
					}
				});
			},
			removeSitePhoto(idx) { this.formData.service.sitePhotos.splice(idx, 1); },
			previewImg(url) { uni.previewImage({ urls: [url] }); },
			async submitOrder() {
				if (!this.formData.customer.name || !this.formData.product.machineNo) { uni.showToast({ title: '核心信息缺失', icon: 'none' }); return; }
				uni.showLoading({ title: '数据同步中' });
				try {
					const orderNo = this.formData.orderNo;
					const plateId = await this.uploadFile(this.formData.product.platePhoto, orderNo);
					const confirmId = await this.uploadFile(this.formData.confirm.machineUserPhoto, orderNo);
					const siteIds = [];
					for (const img of this.formData.service.sitePhotos) { const sid = await this.uploadFile(img, orderNo); if (sid) siteIds.push(sid); }
					const depTime = new Date(`${this.formData.additionalFees.laborFee.departureDate} ${this.formData.additionalFees.laborFee.departureTime}:00`.replace(/-/g, '/')).getTime();
					const finTime = new Date(`${this.formData.service.finishDate} ${this.formData.service.finishTime}:00`.replace(/-/g, '/')).getTime();
					const orderData = {
						...this.formData,
						productInfo: { ...this.formData.product, platePhoto: plateId },
						serviceInfo: { ...this.formData.service, sitePhotos: siteIds, finishTime: finTime },
						additionalFees: this.formData.service.isChargeable === '收费' ? {
							...this.formData.additionalFees,
							laborFee: { ...this.formData.additionalFees.laborFee, departureTime: depTime, finishTime: finTime, totalHours: Number(this.laborHours) },
							totalAmount: Number(this.additionalTotal)
						} : null,
						customerConfirm: { machineUserPhoto: confirmId }
					};
					uniCloud.callFunction({
						name: 'work-order-manager',
						data: { action: 'create', params: orderData, uniIdToken: uni.getStorageSync('uni_id_token') },
						success: (res) => {
							uni.hideLoading();
							if (res.result.code === 0) {
								uni.showToast({ title: '提交成功' });
								setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000);
							} else uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					});
				} catch (e) { uni.hideLoading(); }
			},
			uploadFile(path, folder) {
				return new Promise((resolve) => {
					if (!path || path.startsWith('cloud://')) return resolve(path);
					const ext = path.split('.').pop();
					uniCloud.uploadFile({ filePath: path, cloudPath: `${folder}/${Date.now()}_${Math.random().toString(36).slice(-4)}.${ext}`, success: (res) => resolve(res.fileID), fail: () => resolve(null) });
				});
			}
		}
	}
</script>

<style lang="scss">
	// Professional Palette
	$accent: #1677ff;
	$bg-page: #f4f7f9;
	$text-primary: #1d2129;
	$text-secondary: #4e5969;
	$text-tip: #86909c;
	$border-light: #f0f2f5;
	$success: #52c41a;
	$danger: #ff4d4f;

	.page-wrapper { min-height: 100vh; background-color: $bg-page; color: $text-primary; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	.container { padding: 16px; padding-bottom: 120px; }

	// UI Cards
	.ui-card {
		background: #fff;
		border-radius: 10px;
		margin-bottom: 12px;
		border: 1px solid $border-light;
		overflow: hidden;
		transition: transform 0.2s, box-shadow 0.2s;
		&.card-active { border-left: 4px solid $accent; }
	}

	.card-header {
		padding: 12px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		.header-title { font-size: 15px; font-weight: 700; color: $text-primary; }
		.header-status { font-size: 10px; background: rgba($success, 0.1); color: $success; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
		.header-arrow { width: 7px; height: 7px; border-right: 2px solid $text-tip; border-bottom: 2px solid $text-tip; transform: rotate(45deg); transition: transform 0.3s; &.arrow-up { transform: rotate(-135deg); } }
	}

	.card-body { padding: 0 16px 12px; }

	// Fields
	.ui-field {
		padding: 8px 0; // 压缩间距
		border-bottom: 1px solid #f9fafb;
		display: flex;
		align-items: center;
		&:last-child { border-bottom: none; }
		&.column { flex-direction: column; align-items: flex-start; }
		&.no-border { border-bottom: none; }
		.field-label { width: 85px; font-size: 13px; font-weight: 500; color: $text-secondary; &.required::after { content: '*'; color: $danger; margin-left: 3px; } }
		.hmandmachine { width: 185px;}
		.field-input, .picker-text, .field-picker-box { flex: 1; height: 34px; line-height: 34px; background: #f7f8fa; border-radius: 6px; padding: 0 10px; font-size: 13px; color: $text-primary; }
		.field-textarea { width: 100%; height: 80px; background: #f7f8fa; border-radius: 8px; padding: 10px; font-size: 13px; box-sizing: border-box; margin-top: 6px; }
		.ui-radio-box { flex: 1; display: flex; .radio-item { margin-right: 15px; font-size: 13px; display: flex; align-items: center; } }
		.time-picker-group { display: flex; align-items: center; 
			.tp { background: #f7f8fa; height: 34px; line-height: 34px; border-radius: 6px; padding: 0 12px; font-size: 13px; text-align: center; min-width: 30px; }
			.ml-5 { margin-left: 8px; }
		}
		.ph { color: #c9cdd4; }
	}

	// Multi Photo Uploader
	.photo-uploader {
		width: 100%;
		height: 150px;
		background: #f7f8fa;
		border-radius: 8px;
		border: 1px dashed #e5e6eb;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 8px;
		&.large { height: 200px; background: #f0f5ff; border-color: $accent; }
		.photo-placeholder { display: flex; flex-direction: column; align-items: center; color: $text-tip;
			.icon-camera { width: 30px; height: 30px; border: 2px solid $text-tip; border-radius: 6px; position: relative; margin-bottom: 6px;
				&::before { content: ''; position: absolute; width: 6px; height: 6px; border: 2px solid $text-tip; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%,-50%); }
			}
			.text { font-size: 11px; }
		}
		.photo-preview { width: 100%; height: 100%; border-radius: 8px; }
	}

	// Grid Photos
	.grid-uploader { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
		.grid-add { width: 65px; height: 70px; background: #f7f8fa; border: 1px dashed #e5e6eb; border-radius: 6px; display: flex; justify-content: center; align-items: center; font-size: 24px; color: #c9cdd4; }
		.grid-item { width: 65px; height: 70px; position: relative;
			.img { width: 100%; height: 100%; border-radius: 6px; }
			.btn-del { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: $danger; color: #fff; border-radius: 50%; text-align: center; line-height: 16px; font-size: 12px; border: 2px solid #fff; }
		}
	}

	// Parts Item - New Inline Layout
	.list-header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
		.list-title { font-size: 13px; font-weight: 700; color: $text-primary; }
		.btn-text-add { font-size: 12px; color: $accent; font-weight: 600; }
	}
	.part-entry {
		position: relative; // 增加相对定位
		width: 100%; background: #fbfbfc; border: 1px solid $border-light; border-radius: 8px; padding: 10px; margin-bottom: 8px; box-sizing: border-box;
		
		.btn-remove-absolute {
			position: absolute;
			top: 0px;
			right: 4px;
			font-size: 22px;
			color: $danger;
			z-index: 10;
			line-height: 1;
		}

		.entry-row { display: flex; justify-content: space-between; align-items: center;
			.input-name { flex: 1; font-size: 14px; font-weight: 400; border-bottom: 1px solid #eee; height: 30px; padding-right: 30px; } // 留出删除按钮空间
			.input-code { flex: 1; font-size: 12px; color: $text-secondary; height: 30px; }
		}
		
		.source-picker-inline { display: flex; align-items: center; background: #f7f8fa; padding: 0 10px; border-radius: 6px; margin-left: 8px; height: 34px; border: 1px solid #f0f2f5; box-sizing: border-box;
			.s-label { font-size: 12px; color: $text-tip; margin-right: 6px; white-space: nowrap; }
			.s-value { font-size: 13px; color: $accent; font-weight: 600; white-space: nowrap; }
		}

		.part-ext-row { margin-top: 10px; background: #fffbe6; padding: 8px 12px; border-radius: 6px; border: 1px solid #ffe58f; box-sizing: border-box;
			.ext-label { font-size: 11px; font-weight: 700; color: #856404; margin-bottom: 4px; display: block;
				&.required::after { content: '*'; color: $danger; margin-left: 2px; }
			}
			.input-remark { width: 100%; font-size: 12px; color: #856404; height: 28px; }
			.ph-warning { color: rgba(#856404, 0.4); }
		}
		
		.flex-align-center { display: flex; align-items: center; justify-content: space-between; width: 100%; }
		
		.entry-stepper-wrapper { display: flex; align-items: center; background: #f7f8fa; padding: 2px 6px; border-radius: 4px;
			.st-label { font-size: 10px; color: $text-tip; margin-right: 6px; }
		}
		
		.entry-stepper { display: flex; align-items: center; background: #fff; border: 1px solid #eee; border-radius: 4px;
			.s-btn { width: 26px; height: 24px; text-align: center; line-height: 24px; color: $text-secondary; font-weight: bold; }
			.s-num { width: 30px; text-align: center; font-size: 12px; font-weight: 700; border-left: 1px solid #eee; border-right: 1px solid #eee; }
		}

		.entry-bottom-inline { flex: 1; display: flex; justify-content: flex-end; align-items: center;
			.price-box-small { display: flex; align-items: center; background: #f7f8fa; padding: 2px 6px; border-radius: 4px;
				.p-label { font-size: 10px; color: $text-tip; margin-right: 4px; }
				.p-val { width: 40px; font-size: 12px; font-weight: 700; color: $danger; text-align: center; }
				.p-total-val { font-size: 12px; font-weight: 700; color: $danger; }
			}
			.ml-10 { margin-left: 8px; }
		}
	}
	.list-summary { width: 100%; padding: 10px; background: #fff7e6; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #ff7d00; .v { font-size: 16px; font-weight: 800; } }

	// Fee Cards
	.fee-card {
		padding: 10px; background: #fbfbfc; border-radius: 8px; border: 1px solid $border-light;
		.f-title { font-size: 11px; font-weight: 700; color: $accent; margin-bottom: 8px; display: block; }
		.f-inputs { display: flex; gap: 8px; .f-item { flex: 1; background: #fff; border: 1px solid #eee; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: $text-tip; display: flex; justify-content: space-between; input { width: 35px; text-align: right; color: $text-primary; font-weight: 700; } .v { color: $accent; font-weight: 700; } } }
		.f-subtotal { text-align: right; margin-top: 8px; font-size: 12px; font-weight: 700; color: $danger; }
		.f-time-line { background: #fff; padding: 6px; border-radius: 4px; border: 1px solid #eee;
			.time-tag { display: flex; align-items: center; font-size: 11px; .l { color: $text-tip; width: 30px; } .item-input { flex: 1; display: flex; align-items: center; input { width: 35px; border-bottom: 1px solid #eee; margin-right: 4px; text-align: center; } } }
		}
	}

	// Settlement Panel
	.settlement-panel {
		margin-top: 20px; background: #1d2129; border-radius: 10px; padding: 16px; color: #fff;
		.panel-header { font-size: 12px; opacity: 0.6; margin-bottom: 12px; }
		.panel-grid { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(#fff, 0.1); padding-bottom: 12px;
			.p-item { display: flex; flex-direction: column; .l { font-size: 10px; opacity: 0.5; margin-bottom: 2px; } .v { font-size: 13px; font-weight: 700; } }
		}
		.panel-total { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 14px; font-weight: 700; .total-v { font-size: 22px; color: #fffae6; } }
	}

	// Action Footer
	.action-footer {
		position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 10px 16px 30px; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); z-index: 100;
		.meta-info { display: flex; justify-content: space-between; margin-bottom: 8px;
			.item { font-size: 10px; .lb { color: $text-tip; margin-right: 4px; } .vl { color: $text-secondary; font-family: monospace; } }
		}
		.btn-primary-main { background: $accent; color: #fff; height: 44px; line-height: 44px; border-radius: 22px; font-size: 15px; font-weight: 700; border: none; box-shadow: 0 6px 16px rgba($accent, 0.3); }
	}

	// Modern Modals
	.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end; backdrop-filter: blur(4px); }
	.modal-body { background: #fff; height: 70vh; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; padding: 20px; }
	.modal-header { display: flex; justify-content: space-between; margin-bottom: 16px; .t { font-size: 16px; font-weight: 800; } .c { font-size: 18px; color: #c9cdd4; } }
	.modal-search { margin-bottom: 12px; .s-input { background: #f2f3f5; height: 40px; border-radius: 20px; padding: 0 16px; font-size: 13px; } }
	.modal-scroll { flex: 1; overflow: hidden; }
	.cat-item { padding: 14px 0; border-bottom: 1px solid #f2f3f5; display: flex; justify-content: space-between; font-weight: 500; .a { color: #c9cdd4; } }
	.leaf-item { padding: 14px 0; border-bottom: 1px solid #f2f3f5; font-size: 14px; 
		&.search { display: flex; flex-direction: column; .p { font-size: 10px; color: $text-tip; margin-top: 3px; } }
	}
	.nav-back { display: flex; align-items: center; color: $accent; font-weight: 700; padding-bottom: 14px; .i { font-size: 22px; margin-right: 4px; } }
</style>