<template>
	<view class="page-wrapper">
		<view class="container">
			<!-- Section B: Customer Info -->
			<view class="ui-card" :class="{ 'card-collapsed': sectionsCollapsed.customer }">
				<view class="card-header collapsible" @click="toggleSection('customer')">
					<view class="header-left">
						<text class="header-icon">👤</text>
						<text class="header-title">客户资料</text>
						<text v-if="isCustomerComplete" class="header-complete">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'arrow-active': !sectionsCollapsed.customer }">▼</text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.customer">
					<view class="ui-form-item">
						<text class="ui-label required">姓名</text>
						<input class="ui-input" v-model="formData.customer.name" placeholder="客户姓名" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">电话</text>
						<input class="ui-input" type="number" v-model="formData.customer.phone" placeholder="联系电话" maxlength="11" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">地址</text>
						<input class="ui-input" v-model="formData.customer.address" placeholder="详细地址" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">农机用途</text>
						<radio-group @change="onUsageChange" class="ui-radio-group">
							<label class="ui-radio"><radio value="自用" :checked="formData.customer.usageType === '自用'" color="#007aff" style="transform:scale(0.8)" />自用</label>
							<label class="ui-radio"><radio value="作业" :checked="formData.customer.usageType === '作业'" color="#007aff" style="transform:scale(0.8)" />作业</label>
						</radio-group>
					</view>
					<view class="ui-form-item">
						<text class="ui-label">经销商</text>
						<input class="ui-input" v-model="formData.customer.distributorName" placeholder="经销商名称" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">报修时间</text>
						<picker mode="date" @change="onReportDateChange" style="flex: 1;">
							<view class="ui-picker-view">{{ formData.customer.reportTime }}</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- Section C: Product Info -->
			<view class="ui-card" :class="{ 'card-collapsed': sectionsCollapsed.product }">
				<view class="card-header collapsible" @click="toggleSection('product')">
					<view class="header-left">
						<text class="header-icon">🚜</text>
						<text class="header-title">产品信息</text>
						<text v-if="isProductComplete" class="header-complete">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'arrow-active': !sectionsCollapsed.product }">▼</text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.product">
					<view class="ui-form-item">
						<text class="ui-label required">机器编号</text>
						<input class="ui-input" v-model="formData.product.machineNo" placeholder="请输入机器编号" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">发动机号</text>
						<input class="ui-input" v-model="formData.product.engineNo" placeholder="请输入发动机号" />
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">生产日期</text>
						<picker mode="date" @change="onDateChange" style="flex: 1;">
							<view class="ui-picker-view">{{ formData.product.productionDate || '请选择日期' }}</view>
						</picker>
					</view>
					
					<view class="ui-form-item column">
						<text class="ui-label required">铭牌照片</text>
						<view class="ui-upload-single" @click="chooseImage('plate')">
							<image v-if="formData.product.platePhoto" :src="formData.product.platePhoto" mode="aspectFill" class="full-img"></image>
							<view v-else class="upload-placeholder">
								<text class="u-icon">📷</text>
								<text class="u-text">点击上传</text>
							</view>
						</view>
					</view>
					
					<view class="ui-form-item">
						<text class="ui-label required">产品型号</text>
						<input class="ui-input" v-model="formData.product.model" placeholder="产品型号" />
					</view>
				</view>
			</view>

			<!-- Section D: Service Info -->
			<view class="ui-card" :class="{ 'card-collapsed': sectionsCollapsed.service }">
				<view class="card-header collapsible" @click="toggleSection('service')">
					<view class="header-left">
						<text class="header-icon">🔧</text>
						<text class="header-title">服务内容</text>
						<text v-if="isServiceComplete" class="header-complete">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'arrow-active': !sectionsCollapsed.service }">▼</text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.service">
					<view class="ui-form-item">
						<text class="ui-label required">服务类型</text>
						<picker :range="serviceTypes" @change="onServiceTypeChange" style="flex: 1;">
							<view class="ui-picker-view">{{ formData.service.type || '请选择类型' }}</view>
						</picker>
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">是否收费</text>
						<radio-group @change="onIsChargeableChange" class="ui-radio-group">
							<label class="ui-radio"><radio value="免费" :checked="formData.service.isChargeable === '免费'" color="#4cd964" style="transform:scale(0.8)" />免费</label>
							<label class="ui-radio"><radio value="收费" :checked="formData.service.isChargeable === '收费'" color="#ff5252" style="transform:scale(0.8)" />收费</label>
						</radio-group>
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">故障分类</text>
						<view class="ui-picker-view" @click="toggleFaultPicker">{{ formData.service.faultCategory || '请选择分类' }}</view>
					</view>
					<view class="ui-form-item column">
						<text class="ui-label required">故障现象</text>
						<textarea class="ui-textarea" v-model="formData.service.faultDesc" placeholder="描述故障表现..." />
					</view>
					<view class="ui-form-item column">
						<text class="ui-label required">处理方法</text>
						<textarea class="ui-textarea" v-model="formData.service.handleDesc" placeholder="描述维修过程..." />
					</view>
							
					<view class="ui-form-item column no-border">
						<view class="parts-header">
							<text class="ui-label">更换零件明细</text>
							<button size="mini" type="primary" class="ui-btn-add" @click="addPart">+ 新增</button>
						</view>
						
						<view v-for="(part, idx) in formData.service.parts" :key="idx" class="part-item-card">
							<view class="part-top">
								<input v-model="part.name" placeholder="零件名称" class="p-input-name" />
								<text class="part-del" @click="removePart(idx)">×</text>
							</view>
							<view class="part-middle">
								<input v-model="part.code" placeholder="图号/编码" class="p-input-code" />
								<picker :range="partSources" @change="onPartSourceChange($event, idx)" class="p-source-picker">
									<view class="p-source-select">
										<text class="s-label">来源:</text>
										<text class="s-val">{{ part.source || '请选择' }}</text>
										<text class="s-arrow">▾</text>
									</view>
								</picker>
							</view>
							<!-- Remark input for "Other" source -->
							<view class="part-remark-row" v-if="part.source === '其他'">
								<input v-model="part.sourceRemark" placeholder="请输入其他来源说明..." class="p-input-remark" />
							</view>
							<view class="part-bottom">
								<view class="p-stepper">
									<text class="p-step-btn" @click.stop="updatePartCount(idx, -1)">-</text>
									<text class="p-step-val">{{ part.count }}</text>
									<text class="p-step-btn" @click.stop="updatePartCount(idx, 1)">+</text>
								</view>
								<radio-group @change="onPartActionChange($event, idx)" class="p-action-group">
									<label class="p-radio-label"><radio value="带回" :checked="part.oldPartAction === '带回'" style="transform:scale(0.6)" color="#007aff" />带回</label>
									<label class="p-radio-label"><radio value="丢弃" :checked="part.oldPartAction === '丢弃'" style="transform:scale(0.6)" color="#999" />丢弃</label>
								</radio-group>
							</view>
							<view class="part-price-row" v-if="formData.service.isChargeable === '收费'">
								<view class="price-input">
									<text>单价:</text>
									<input type="digit" v-model="part.price" class="p-price-val" placeholder="0.0" />
									<text>元</text>
								</view>
								<text class="price-sum">小计: ￥{{ ((Number(part.price) || 0) * (part.count || 0)).toFixed(1) }}</text>
							</view>
						</view>
	
						<view class="parts-total-banner" v-if="formData.service.isChargeable === '收费' && formData.service.parts.length > 0">
							<text>零件费用小计</text>
							<text class="banner-val">￥{{ partsTotal }}</text>
						</view>
					</view>
					
					<view class="ui-form-item column">
						<text class="ui-label required">现场照片 (最少{{ formData.service.parts.length > 0 ? formData.service.parts.length : 1 }}张)</text>
						<view class="ui-photo-grid">
							<view class="photo-add" @click="chooseImage('site')">
								<text class="u-icon">+</text>
							</view>
							<view v-for="(img, idx) in formData.service.sitePhotos" :key="idx" class="photo-item">
								<image :src="img" class="p-img" mode="aspectFill" @click="previewImg(img)"></image>
								<text class="p-del" @click.stop="removeSitePhoto(idx)">×</text>
							</view>
						</view>
					</view>
					
					<view class="ui-form-item">
						<text class="ui-label required">完成日期</text>
						<picker mode="date" @change="onFinishDateChange" style="flex: 1;">
							<view class="ui-picker-view">{{ formData.service.finishDate }}</view>
						</picker>
					</view>
					<view class="ui-form-item">
						<text class="ui-label required">完成时间</text>
						<picker mode="time" @change="onFinishTimeChange" style="flex: 1;">
							<view class="ui-picker-view">{{ formData.service.finishTime || '请选择时间' }}</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- Section E: Additional Fees (Only when chargeable) -->
			<view class="ui-card" v-if="formData.service.isChargeable === '收费'" :class="{ 'card-collapsed': sectionsCollapsed.fees }">
				<view class="card-header collapsible" @click="toggleSection('fees')">
					<view class="header-left">
						<text class="header-icon">💰</text>
						<text class="header-title">附加费用</text>
						<text v-if="isFeesComplete" class="header-complete">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'arrow-active': !sectionsCollapsed.fees }">▼</text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.fees">
					<view class="fee-sub-card">
						<view class="f-sub-header">路程费</view>
						<view class="f-row">
							<view class="f-input-group">
								<text class="f-label">总里程</text>
								<input type="digit" v-model="formData.additionalFees.travelFee.distance" class="f-input" />
								<text class="f-unit">km</text>
							</view>
							<view class="f-input-group">
								<text class="f-label">单价</text>
								<input type="digit" v-model="formData.additionalFees.travelFee.unitPrice" class="f-input" />
								<text class="f-unit">元/km</text>
							</view>
						</view>
						<view class="f-result">路程费合计: <text class="f-val">￥{{ travelTotal }}</text></view>
					</view>
	
					<view class="fee-sub-card mt-15">
						<view class="f-sub-header">工时费</view>
						<view class="f-time-box">
							<view class="t-item">
								<text class="t-label">出发</text>
								<view class="t-picker-group">
									<picker mode="date" @change="onDepartureDateChange"><text>{{ formData.additionalFees.laborFee.departureDate }}</text></picker>
									<picker mode="time" @change="onDepartureTimeChange" class="ml-10"><text>{{ formData.additionalFees.laborFee.departureTime }}</text></picker>
								</view>
							</view>
							<view class="t-item">
								<text class="t-label">完成</text>
								<view class="t-picker-group">
									<picker mode="date" @change="onFinishDateChange"><text>{{ formData.service.finishDate }}</text></picker>
									<picker mode="time" @change="onFinishTimeChange" class="ml-10"><text>{{ formData.service.finishTime }}</text></picker>
								</view>
							</view>
						</view>
						<view class="f-row mt-10">
							<view class="f-input-group">
								<text class="f-label">返程预估</text>
								<input type="number" v-model="formData.additionalFees.laborFee.returnDuration" class="f-input" />
								<text class="f-unit">min</text>
							</view>
							<view class="f-input-group">
								<text class="f-label">工时单价</text>
								<input type="digit" v-model="formData.additionalFees.laborFee.unitPrice" class="f-input" />
								<text class="f-unit">元/h</text>
							</view>
						</view>
						<view class="f-info-bar" v-if="Number(laborHours) > 0">
							<text>核算时长: {{ laborHours }} 小时</text>
							<text class="f-val-main">工时费合计: ￥{{ laborTotal }}</text>
						</view>
						<view class="f-warn-bar" v-else-if="formData.additionalFees.laborFee.departureTime && formData.service.finishTime">
							⚠️ 完成时间不能早于出发时间
						</view>
					</view>
	
					<view class="fee-summary-bar">
						<text>附加费总计</text>
						<text class="fee-total-val">￥{{ additionalTotal }}</text>
					</view>
				</view>
			</view>

			<!-- Section F: Confirmation -->
			<view class="ui-card" :class="{ 'card-collapsed': sectionsCollapsed.confirm }">
				<view class="card-header collapsible" @click="toggleSection('confirm')">
					<view class="header-left">
						<text class="header-icon">📸</text>
						<text class="header-title">客户确认</text>
						<text v-if="isConfirmComplete" class="header-complete">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'arrow-active': !sectionsCollapsed.confirm }">▼</text>
				</view>
				<view class="card-body" v-show="!sectionsCollapsed.confirm">
					<view class="ui-form-item column no-border">
						<text class="ui-label required">人机合影 (现场合照)</text>
						<view class="ui-upload-single large" @click="chooseImage('confirm')">
							<image v-if="formData.confirm.machineUserPhoto" :src="formData.confirm.machineUserPhoto" mode="aspectFill" class="full-img"></image>
							<view v-else class="upload-placeholder">
								<text class="u-icon">📸</text>
								<text class="u-text">点击拍摄合照</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Receipt Style Settlement (Only when chargeable) -->
			<view class="settlement-receipt" v-if="formData.service.isChargeable === '收费'">
				<view class="receipt-inner">
					<view class="receipt-header">费用结算明细清单</view>
					<view class="receipt-line dashed"></view>
					<view class="receipt-row">
						<text class="r-label">1. 更换零件费用</text>
						<text class="r-val">￥{{ partsTotal }}</text>
					</view>
					<view class="receipt-row">
						<text class="r-label">2. 路程运输费用</text>
						<text class="r-val">￥{{ travelTotal }}</text>
					</view>
					<view class="receipt-row">
						<text class="r-label">3. 现场服务工时费</text>
						<text class="r-val">￥{{ laborTotal }}</text>
					</view>
					<view class="receipt-line solid"></view>
					<view class="receipt-total">
						<text>应收总额合计</text>
						<text class="grand-val">￥{{ grandTotal }}</text>
					</view>
				</view>
			</view>

			<view class="page-footer">
				<view class="footer-meta">
					<view class="meta-item"><text class="m-label">单号:</text><text class="m-val">{{ formData.orderNo }}</text></view>
					<view class="meta-item"><text class="m-label">填单人:</text><text class="m-val">{{ currentUser }}</text></view>
				</view>
				<button class="ui-btn-submit" @click="submitOrder">正式提交工单</button>
			</view>
		</view>

		<!-- Modern Fault Category Picker -->
		<view class="fault-modal-wrapper" v-if="showFaultPicker" @click.stop="toggleFaultPicker">
			<view class="fault-modal-content" @click.stop="">
				<view class="modal-top">
					<text class="modal-title">选择故障分类</text>
					<text class="modal-close" @click="toggleFaultPicker">×</text>
				</view>
				<view class="modal-search">
					<input v-model="faultSearchKey" placeholder="搜索故障关键字..." class="search-input" />
				</view>
				<scroll-view scroll-y class="modal-list">
					<block v-if="faultSearchKey">
						<view v-for="(item, idx) in searchResults" :key="idx" class="list-item leaf" @click="selectFaultLeaf(item.name)">
							<text class="l-name">{{ item.name }}</text>
							<text class="l-path">{{ item.parent }}</text>
						</view>
					</block>
					<block v-else-if="!selectedCategory">
						<view v-for="(cat, idx) in faultTree" :key="idx" class="list-item cat" @click="selectFaultCategory(cat)">
							<text>{{ cat.title }}</text>
							<text class="l-arrow">></text>
						</view>
					</block>
					<block v-else>
						<view class="back-nav" @click="selectedCategory = null">
							<text class="nav-icon"><</text><text>返回主分类 ({{ selectedCategory.title }})</text>
						</view>
						<view v-for="(leaf, idx) in selectedCategory.children" :key="idx" class="list-item leaf-simple" @click="selectFaultLeaf(leaf)">
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
					{ title: "行走、传动系统", children: ["前桥（包含内部加工件、油封、漏油、转向拉杆等）", "后桥（包含内部加工件、油封、漏油、转向拉杆等）", "变速箱（内部加工件、油封、漏油等）", "行走传动轴", "车轮", "底盘", "主变速等行走操控", "刹车及各连杆", "悬架（包含后桥弹簧及相关组件）"] },
					{ title: "液压系统", children: ["各类液压油管及油管接头", "HST", "齿轮泵", "转向器", "液压阀", "升降油缸", "液压油滤清器"] },
					{ title: "电气系统", children: ["主线束", "启动开关", "水平旋钮", "仪表盘", "组合开关", "蜂鸣器", "安全开关", "水平传感器", "水平电机", "缺苗报警器", "手、脚油门（仅全柴款）", "大灯", "常开常闭开关", "保险丝", "GPS", "电子燃油泵", "电瓶"] },
					{ title: "供油系统", children: ["燃油管", "燃油箱", "燃油滤清器（包含粗滤、精滤）", "燃油油水分离器"] },
					{ title: "插植系统", children: ["插植臂（包含调试）", "旋转箱（包含调试）", "插秧箱", "喂入箱（包含调试）", "苗箱（驱动轮、单向离合器、苗箱板等）", "导轨（导轨上所有组件）", "浮体支架", "取苗连杆", "纵送凸轮轴相关（包含弹性销）", "丝杆夹头（包含弹性销、防尘橡胶套）", "感应拉线", "拖沟", "插秧质量（包含缺秧、断秧、漂秧、堵秧、下苗不畅、调整压苗器及阻拦棒等）", "插秧连杆及球头", "液压阀连杆及球头", "插秧传动轴（包含销轴、防尘套）", "插植部减震垫", "浮板", "车头和插植部各相关连接件"] },
					{ title: "拉线类", children: ["手油门拉线（仅洋马款）", "脚油门拉线（仅洋马款）", "倒车插植部上升拉线", "划线杆打开拉线", "划线杆收起拉线", "分组拉线"] },
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
				sectionsCollapsed: { basic: false, customer: false, product: true, service: false, fees: false, confirm: true }
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
			isServiceComplete() { const s = this.formData.service; return !!(s.type && s.faultCategory && s.sitePhotos.length > 0); },
			isFeesComplete() { return true; },
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
			this.currentUser = userInfo ? (userInfo.nickname || userInfo.name) : '未知填单人';
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
				if (draft) uni.showModal({ title: '草稿提示', content: '是否恢复上次编辑的工单？', success: (res) => { if (res.confirm) this.formData = draft; else uni.removeStorageSync('order_draft'); } });
			},
			onUsageChange(e) { this.formData.customer.usageType = e.detail.value; },
			onDateChange(e) { this.formData.product.productionDate = e.detail.value; },
			onReportDateChange(e) { this.formData.customer.reportTime = e.detail.value; },
			onServiceTypeChange(e) { this.formData.service.type = this.serviceTypes[e.detail.value]; },
			onIsChargeableChange(e) { this.formData.service.isChargeable = e.detail.value; },
			onPartSourceChange(e, index) { this.$set(this.formData.service.parts[index], 'source', this.partSources[e.detail.value]); },
			toggleFaultPicker() { this.showFaultPicker = !this.showFaultPicker; this.selectedCategory = null; },
			selectFaultCategory(cat) { this.selectedCategory = cat; },
			selectFaultLeaf(leaf) { this.formData.service.faultCategory = leaf; this.showFaultPicker = false; },
			addPart() { this.formData.service.parts.push({ name: '', code: '', count: 1, oldPartAction: '带回', source: '自带', price: 0 }); },
			updatePartCount(idx, d) { const p = this.formData.service.parts[idx]; if (p.count + d >= 1) p.count += d; },
			removePart(idx) { this.formData.service.parts.splice(idx, 1); },
			onPartActionChange(e, idx) { this.$set(this.formData.service.parts[idx], 'oldPartAction', e.detail.value); },
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
				if (!this.formData.customer.name || !this.formData.product.machineNo) { uni.showToast({ title: '请填写姓名和机器编号', icon: 'none' }); return; }
				uni.showLoading({ title: '提交中...' });
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
								uni.removeStorageSync('order_draft');
								uni.showToast({ title: '工单提交成功' });
								setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1500);
							} else uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					});
				} catch (e) { uni.hideLoading(); uni.showToast({ title: '网络请求失败', icon: 'none' }); }
			},
			uploadFile(path, folder) {
				return new Promise((resolve, reject) => {
					if (!path || path.startsWith('cloud://')) return resolve(path);
					const ext = path.split('.').pop();
					uniCloud.uploadFile({ filePath: path, cloudPath: `${folder}/${Date.now()}_${Math.random().toString(36).slice(-4)}.${ext}`, success: (res) => resolve(res.fileID), fail: reject });
				});
			}
		}
	}
</script>

<style lang="scss">
	$primary: #007aff;
	$success: #4cd964;
	$warning: #ffcc00;
	$danger: #ff5252;
	$gray: #c0c4cc; // 调淡灰色，使占位文字更轻盈
	$bg: #fbfbfc; // 稍微调亮背景

	.page-wrapper { min-height: 100vh; background-color: $bg; }
	.container { padding: 12px; padding-bottom: 120px; }

	// UI Card Base
	.ui-card {
		background: #fff;
		border-radius: 12px;
		margin-bottom: 12px;
		box-shadow: 0 2px 12px rgba(0,0,0,0.03); // 更淡的阴影
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		&.card-collapsed { box-shadow: none; margin-bottom: 8px; border: 1px solid #f5f5f5; }
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid #f8f9fb;
		.header-left { display: flex; align-items: center; }
		.header-icon { font-size: 18px; margin-right: 8px; opacity: 0.6; } // 图标增加透明度，呈现水印感
		.header-title { font-size: 16px; font-weight: 600; color: #333; }
		.header-complete { color: $success; margin-left: 8px; font-size: 14px; }
		.arrow-icon { font-size: 12px; color: #ddd; transition: transform 0.3s; &.arrow-active { transform: rotate(180deg); color: $primary; } }
		&.no-border { border-bottom: none; }
	}

	.card-body { padding: 8px 16px 16px; }

	// Form Item
	.ui-form-item {
		display: flex;
		align-items: center;
		padding: 12px 0;
		border-bottom: 1px solid #f8f9fb;
		&:last-child { border-bottom: none; }
		&.column { flex-direction: column; align-items: flex-start; .ui-label { margin-bottom: 10px; width: 100%; } }
		&.no-border { border-bottom: none; }
		.ui-label { width: 90px; font-size: 14px; color: #606266; &.required::after { content: '*'; color: $danger; margin-left: 4px; } }
		.ui-input, .ui-picker-view { flex: 1; font-size: 14px; color: #333; height: 32px; line-height: 32px; }
		.ui-textarea { width: 100%; height: 80px; background: #f9fafb; padding: 10px; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
		.ui-radio-group { flex: 1; display: flex; .ui-radio { margin-right: 20px; font-size: 14px; display: flex; align-items: center; } }
		
		// 统一调淡占位符颜色
		/deep/ .uni-input-placeholder, /deep/ .uni-textarea-placeholder { color: #dcdfe6; font-size: 13px; }
	}

	// Upload Box
	.ui-upload-single {
		width: 100%;
		height: 180px;
		background: #fbfbfc;
		border: 1px dashed #ebeef5;
		border-radius: 8px;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		&.large { height: 220px; border-color: lighten($primary, 20%); background: lighten($primary, 49%); }
		.upload-placeholder { display: flex; flex-direction: column; align-items: center; color: $gray; 
			.u-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.4; } // 上标增加透明度
			.u-text { font-size: 12px; color: #dcdfe6; }
		}
		.full-img { width: 100%; height: 100%; }
	}

	// Parts Detail Card
	.parts-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;
		.ui-label { flex: 1; }
		.ui-btn-add { margin: 0; white-space: nowrap; min-width: 65px; background-color: lighten($primary, 45%); color: $primary; border: 1px solid lighten($primary, 30%); font-weight: bold; border-radius: 20px; }
	}
	.part-item-card {
		width: 100%;
		box-sizing: border-box;
		background: #fff;
		border: 1px solid #ebeef5;
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 10px;
		.part-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
			.p-input-name { flex: 1; font-weight: normal; font-size: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; }
			.part-del { color: $danger; font-size: 24px; padding: 0 5px; line-height: 1; }
		}
		.part-middle { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
			.p-input-code { flex: 1; font-size: 13px; color: #666; }
			.p-source-select { display: flex; align-items: center; background: #f0f7ff; padding: 4px 10px; border-radius: 4px; border: 1px solid lighten($primary, 30%);
				.s-label { font-size: 11px; color: $primary; margin-right: 4px; }
				.s-val { font-size: 12px; color: $primary; font-weight: bold; }
				.s-arrow { font-size: 10px; color: $primary; margin-left: 4px; }
			}
		}
		.part-remark-row { margin-bottom: 10px; .p-input-remark { width: 100%; background: #fffbe6; font-size: 12px; padding: 6px 10px; border-radius: 4px; border: 1px solid #ffe58f; box-sizing: border-box; } }
		.part-bottom { display: flex; justify-content: space-between; align-items: center;
			.p-stepper { display: flex; border: 1px solid #dcdfe6; border-radius: 4px; overflow: hidden;
				.p-step-btn { width: 30px; height: 30px; line-height: 30px; text-align: center; background: #f5f7fa; font-weight: bold; }
				.p-step-val { width: 40px; text-align: center; line-height: 30px; font-size: 14px; border-left: 1px solid #eee; border-right: 1px solid #eee; }
			}
			.p-action-group { display: flex; .p-radio-label { font-size: 12px; margin-left: 10px; display: flex; align-items: center; } }
		}
		.part-price-row { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #f0f0f0; display: flex; justify-content: space-between; align-items: center;
			.price-input { display: flex; align-items: center; font-size: 13px; color: #666; .p-price-val { width: 60px; color: $danger; font-weight: bold; text-align: center; border-bottom: 1px solid $danger; margin: 0 4px; } }
			.price-sum { font-size: 14px; font-weight: bold; color: $danger; }
		}
	}
	.parts-total-banner { width: 100%; box-sizing: border-box; background: #fff9f0; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #e6a23c; border: 1px solid #ffebcc; .banner-val { font-size: 18px; font-weight: bold; } }

	// Photo Grid
	.ui-photo-grid { display: flex; flex-wrap: wrap; gap: 10px;
		.photo-add { width: 80px; height: 80px; background: #f5f7fa; border-radius: 6px; display: flex; justify-content: center; align-items: center; border: 1px dashed #dcdfe6; .u-icon { font-size: 30px; color: $gray; } }
		.photo-item { width: 80px; height: 80px; position: relative;
			.p-img { width: 100%; height: 100%; border-radius: 6px; }
			.p-del { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: $danger; color: #fff; border-radius: 50%; text-align: center; line-height: 18px; font-size: 14px; border: 2px solid #fff; }
		}
	}

	// Fee Sub Cards
	.fee-sub-card { background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #f0f2f5;
		.f-sub-header { font-size: 13px; font-weight: bold; color: $primary; margin-bottom: 10px; }
		.f-row { display: flex; justify-content: space-between; gap: 10px; }
		.f-input-group { flex: 1; display: flex; align-items: center; background: #fff; padding: 5px 8px; border-radius: 4px; border: 1px solid #eee;
			.f-label { font-size: 11px; color: #999; margin-right: 4px; white-space: nowrap; }
			.f-input { flex: 1; font-size: 13px; text-align: right; }
			.f-unit { font-size: 11px; color: #999; margin-left: 4px; }
		}
		.f-result { text-align: right; margin-top: 8px; font-size: 12px; color: #666; .f-val { color: $danger; font-weight: bold; font-size: 14px; margin-left: 4px; } }
		.f-time-box { background: #fff; border-radius: 4px; border: 1px solid #eee; overflow: hidden;
			.t-item { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #f5f5f5; &:last-child { border-bottom: none; }
				.t-label { width: 40px; font-size: 11px; color: $gray; }
				.t-picker-group { flex: 1; display: flex; font-size: 13px; .ml-10 { margin-left: 10px; } }
			}
		}
		.f-info-bar { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: $primary; .f-val-main { font-weight: bold; font-size: 14px; } }
		.f-warn-bar { margin-top: 8px; font-size: 11px; color: $danger; text-align: center; background: lighten($danger, 45%); padding: 4px; border-radius: 4px; }
	}
	.fee-summary-bar { margin-top: 16px; background: lighten($danger, 48%); border: 1px solid lighten($danger, 40%); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #333; .fee-total-val { font-size: 20px; color: $danger; } }

	// Receipt Settlement
	.settlement-receipt {
		margin: 20px 4px;
		background: #fff;
		position: relative;
		border-radius: 4px;
		filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08));
		&::before, &::after { content: ''; position: absolute; left: 0; right: 0; height: 8px; background-size: 16px 8px; }
		&::before { top: -8px; background-image: radial-gradient(circle at 8px -4px, transparent 8px, #fff 8px); }
		&::after { bottom: -8px; background-image: radial-gradient(circle at 8px 12px, transparent 8px, #fff 8px); }
		.receipt-inner { padding: 20px; }
		.receipt-header { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #333; letter-spacing: 2px; }
		.receipt-line { height: 1px; margin: 10px 0; &.dashed { border-top: 1px dashed #ddd; } &.solid { border-top: 2px solid #333; } }
		.receipt-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #666; }
		.receipt-total { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-weight: bold; font-size: 16px; color: #000; .grand-val { font-size: 24px; color: $primary; } }
	}

	// Footer
	.page-footer { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 12px 16px 30px; border-top: 1px solid #eee; z-index: 100;
		.footer-meta { display: flex; justify-content: space-between; margin-bottom: 12px; 
			.meta-item { display: flex; align-items: center; font-size: 11px; color: $gray; 
				.m-label { margin-right: 4px; }
				.m-val { color: #666; font-family: monospace; }
			}
		}
		.ui-btn-submit { background: $primary; color: #fff; height: 46px; border-radius: 23px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba($primary, 0.3); }
	}

	// Fault Modal
	.fault-modal-wrapper { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end;
		.fault-modal-content { background: #fff; height: 75vh; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; padding: 20px; }
		.modal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; .modal-title { font-size: 18px; font-weight: bold; } .modal-close { font-size: 28px; color: #ccc; } }
		.modal-search { margin-bottom: 15px; .search-input { background: #f5f7fa; height: 44px; border-radius: 22px; padding: 0 20px; font-size: 14px; border: 1px solid #eee; } }
		.modal-list { flex: 1; overflow: hidden; }
		.list-item { padding: 16px 0; border-bottom: 1px solid #f5f5f5; display: flex; justify-content: space-between; align-items: center;
			&.cat { font-weight: 500; .l-arrow { color: #ccc; font-size: 14px; } }
			&.leaf { flex-direction: column; align-items: flex-start; .l-name { font-size: 15px; margin-bottom: 4px; } .l-path { font-size: 11px; color: $gray; } }
			&.leaf-simple { font-size: 15px; color: #333; }
		}
		.back-nav { display: flex; align-items: center; padding: 12px 0; color: $primary; font-weight: bold; font-size: 14px; .nav-icon { margin-right: 6px; } }
	}
</style>