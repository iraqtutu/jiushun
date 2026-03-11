<template>
	<view class="page-wrapper">
		<view class="container">
			<!-- Section B: Customer Info -->
			<view class="section" :class="{ 'is-collapsed': sectionsCollapsed.customer }">
				<view class="section-title collapsible" :class="{ 'no-border': sectionsCollapsed.customer }" @click="toggleSection('customer')">
					<view class="title-left">
						<text>客户资料</text>
						<text v-if="isCustomerComplete" class="complete-check">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'collapsed': sectionsCollapsed.customer }">▼</text>
				</view>
				<view v-show="!sectionsCollapsed.customer">
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
			</view>

			<!-- Section C: Product Info -->
			<view class="section" :class="{ 'is-collapsed': sectionsCollapsed.product }">
				<view class="section-title collapsible" :class="{ 'no-border': sectionsCollapsed.product }" @click="toggleSection('product')">
					<view class="title-left">
						<text>产品信息</text>
						<text v-if="isProductComplete" class="complete-check">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'collapsed': sectionsCollapsed.product }">▼</text>
				</view>
				<view v-show="!sectionsCollapsed.product">
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
			</view>

			<!-- Section D: Service Info -->
			<view class="section" :class="{ 'is-collapsed': sectionsCollapsed.service }">
				<view class="section-title collapsible" :class="{ 'no-border': sectionsCollapsed.service }" @click="toggleSection('service')">
					<view class="title-left">
						<text>服务内容</text>
						<text v-if="isServiceComplete" class="complete-check">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'collapsed': sectionsCollapsed.service }">▼</text>
				</view>
				<view v-show="!sectionsCollapsed.service">
					<view class="form-item">
						<text class="label required">服务类型</text>
						<picker :range="serviceTypes" @change="onServiceTypeChange">
							<view class="picker-view">
								{{ formData.service.type || '请选择类型' }}
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="label required">是否收费</text>
						<radio-group @change="onIsChargeableChange" class="radio-group">
							<label class="radio"><radio value="免费" :checked="formData.service.isChargeable === '免费'" />免费</label>
							<label class="radio"><radio value="收费" :checked="formData.service.isChargeable === '收费'" />收费</label>
						</radio-group>
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
						
						<view v-for="(part, idx) in formData.service.parts" :key="idx" class="part-card-wrapper">
							<view class="part-card compact">
								<view class="col-inputs">
									<input v-model="part.name" placeholder="零件名称" class="mini-input mb-5" />
									<input v-model="part.code" placeholder="图号" class="mini-input" />
								</view>
								
								<view class="col-source">
									<picker :value="part.source ? partSources.indexOf(part.source) : 0" :range="partSources" @change="onPartSourceChange($event, idx)" style="width: 100%;">
										<view class="source-picker-box">
											{{ part.source || '请选择' }}
										</view>
									</picker>
									<input v-if="part.source === '其他'" v-model="part.sourceRemark" placeholder="备注..." class="mini-input mt-5" />
								</view>
		
								<view class="col-count">
									<view class="stepper">
										<view class="step-btn" @click.stop="updatePartCount(idx, -1)">-</view>
										<text class="step-val">{{ part.count }}</text>
										<view class="step-btn" @click.stop="updatePartCount(idx, 1)">+</view>
									</view>
								</view>
								<view class="col-action">
									<radio-group @change="onPartActionChange($event, idx)" class="radio-group-stack">
										<label class="radio-label"><radio value="带回" :checked="part.oldPartAction === '带回'" color="#007aff" style="transform:scale(0.6)" />带回</label>
										<label class="radio-label"><radio value="丢弃" :checked="part.oldPartAction === '丢弃'" color="#ff5252" style="transform:scale(0.6)" />丢弃</label>
									</radio-group>
								</view>
								<view class="col-del" @click="removePart(idx)">×</view>
							</view>
							
							<!-- Price info row (Only when chargeable) -->
							<view class="price-row" v-if="formData.service.isChargeable === '收费'">
								<view class="price-input-box">
									<text class="p-label">单价:</text>
									<input type="digit" v-model="part.price" class="p-input" placeholder="0.0" />
									<text class="p-unit">元</text>
								</view>
								<view class="price-total-box">
									<text class="p-label">单项总价:</text>
									<text class="p-val">{{ ((Number(part.price) || 0) * (part.count || 0)).toFixed(1) }}</text>
									<text class="p-unit">元</text>
								</view>
							</view>
						</view>
	
						<view class="parts-summary" v-if="formData.service.isChargeable === '收费' && formData.service.parts.length > 0">
							<text>零件总计金额:</text>
							<text class="total-amount">￥{{ partsTotal }}</text>
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
						<text class="label required">完成日期</text>
						<picker mode="date" @change="onFinishDateChange">
							<view class="picker-view">{{ formData.service.finishDate }}</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="label required">完成时间</text>
						<picker mode="time" @change="onFinishTimeChange">
							<view class="picker-view">
								{{ formData.service.finishTime || '请选择时间' }}
							</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- Section E: Additional Fees (Only when chargeable) -->
			<view class="section" v-if="formData.service.isChargeable === '收费'" :class="{ 'is-collapsed': sectionsCollapsed.fees }">
				<view class="section-title collapsible" :class="{ 'no-border': sectionsCollapsed.fees }" @click="toggleSection('fees')">
					<view class="title-left">
						<text>附加费用</text>
						<text v-if="isFeesComplete" class="complete-check">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'collapsed': sectionsCollapsed.fees }">▼</text>
				</view>
				<view v-show="!sectionsCollapsed.fees">
					<!-- Travel Fee -->
					<view class="fee-group">
						<view class="fee-header">路程费</view>
						<view class="form-item no-border">
							<text class="label">公里数</text>
							<input class="input" type="digit" v-model="formData.additionalFees.travelFee.distance" placeholder="请输入公里数" />
							<text class="unit">公里</text>
						</view>
						<view class="form-item no-border">
							<text class="label">单价</text>
							<input class="input" type="digit" v-model="formData.additionalFees.travelFee.unitPrice" placeholder="1.2" />
							<text class="unit">元/公里</text>
						</view>
						<view class="fee-subtotal">
							路程费小计: <text class="amount">￥{{ travelTotal }}</text>
						</view>
					</view>
	
					<!-- Labor Fee -->
					<view class="fee-group mt-15">
						<view class="fee-header">工时费</view>
						<view class="form-item no-border">
							<text class="label">出发日期</text>
							<picker mode="date" @change="onDepartureDateChange">
								<view class="picker-view">{{ formData.additionalFees.laborFee.departureDate }}</view>
							</picker>
						</view>
						<view class="form-item no-border">
							<text class="label">出发时间</text>
							<picker mode="time" @change="onDepartureTimeChange">
								<view class="picker-view">{{ formData.additionalFees.laborFee.departureTime }}</view>
							</picker>
						</view>
						<view class="form-item no-border">
							<text class="label">完成日期</text>
							<picker mode="date" @change="onFinishDateChange">
								<view class="picker-view">{{ formData.service.finishDate }}</view>
							</picker>
						</view>
						<view class="form-item no-border">
							<text class="label">完成时间</text>
							<picker mode="time" @change="onFinishTimeChange">
								<view class="picker-view">{{ formData.service.finishTime }}</view>
							</picker>
						</view>
						<view class="form-item no-border">
							<text class="label">预计返程</text>
							<input class="input" type="number" v-model="formData.additionalFees.laborFee.returnDuration" placeholder="0" />
							<text class="unit">分钟</text>
						</view>
						<view class="form-item no-border">
							<text class="label">工时单价</text>
							<input class="input" type="digit" v-model="formData.additionalFees.laborFee.unitPrice" placeholder="85" />
							<text class="unit">元/小时</text>
						</view>
						<view class="fee-info-row" v-if="Number(laborHours) > 0">
							总计用时: <text class="val">{{ laborHours }} 小时</text>
						</view>
						<view class="fee-info-row warning" v-else-if="formData.additionalFees.laborFee.departureTime && formData.service.finishTime">
							<text style="color: #ff5252;">注意: 完成时间不能早于出发时间</text>
						</view>
						<view class="fee-subtotal">
							工时费小计: <text class="amount">￥{{ laborTotal }}</text>
						</view>
					</view>
	
					<view class="fee-total-summary">
						附加费用总计: <text class="total-amount">￥{{ additionalTotal }}</text>
					</view>
				</view>
			</view>


			<!-- Section F: Confirmation -->
			<view class="section" :class="{ 'is-collapsed': sectionsCollapsed.confirm }">
				<view class="section-title collapsible" :class="{ 'no-border': sectionsCollapsed.confirm }" @click="toggleSection('confirm')">
					<view class="title-left">
						<text>客户确认</text>
						<text v-if="isConfirmComplete" class="complete-check">✔</text>
					</view>
					<text class="arrow-icon" :class="{ 'collapsed': sectionsCollapsed.confirm }">▼</text>
				</view>
				<view v-show="!sectionsCollapsed.confirm">
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
			</view>


			<!-- Final Settlement Summary (Only when chargeable) -->
			<view class="settlement-summary" v-if="formData.service.isChargeable === '收费'">
				<view class="settlement-title">费用总结清单</view>
				<view class="settlement-item">
					<text class="s-label">零件费用合计</text>
					<text class="s-val">￥{{ partsTotal }}</text>
				</view>
				<view class="settlement-item">
					<text class="s-label">路程费用 ({{ formData.additionalFees.travelFee.distance || 0 }}km)</text>
					<text class="s-val">￥{{ travelTotal }}</text>
				</view>
				<view class="settlement-item">
					<text class="s-label">服务工时费用 ({{ laborHours }}h)</text>
					<text class="s-val">￥{{ laborTotal }}</text>
				</view>
				<view class="settlement-total">
					<text class="total-label">应收总金额</text>
					<text class="total-val">￥{{ grandTotal }}</text>
				</view>
			</view>

			<view class="footer-info">
				<view class="footer-item">
					<text class="f-label">派工单号:</text>
					<text class="f-val">{{ formData.orderNo }}</text>
				</view>
				<view class="footer-item">
					<text class="f-label">填单人:</text>
					<text class="f-val">{{ currentUser }}</text>
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
				partSources: ['自带', '经销商调拨', '同厂调拨', '其他'],
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
						isChargeable: '免费',
						faultCategory: '',
						faultDesc: '',
						handleDesc: '',
						finishDate: '',
						finishTime: '',
						parts: [],
						sitePhotos: []
					},
					additionalFees: {
						travelFee: {
							distance: 0,
							unitPrice: 1.2,
							total: 0
						},
						laborFee: {
							departureDate: '',
							departureTime: '',
							returnDuration: 0,
							unitPrice: 85,
							totalHours: 0,
							total: 0
						}
					},
					confirm: {
						machineUserPhoto: ''
					}
				},
				sectionsCollapsed: {
					basic: false,
					customer: false,
					product: false,
					service: false,
					fees: false,
					confirm: false
				}
			}
		},
		computed: {
			partsTotal() {
				return this.formData.service.parts.reduce((sum, part) => {
					return sum + (Number(part.price) || 0) * (part.count || 0);
				}, 0).toFixed(1);
			},
			travelTotal() {
				const fee = this.formData.additionalFees.travelFee;
				return (Number(fee.distance || 0) * Number(fee.unitPrice || 0)).toFixed(1);
			},
			laborHours() {
				const fee = this.formData.additionalFees.laborFee;
				const service = this.formData.service;
				if (!fee.departureDate || !fee.departureTime || !service.finishDate || !service.finishTime) return "0.0";
				
				try {
					const startStr = `${fee.departureDate} ${fee.departureTime}:00`.replace(/-/g, '/');
					const endStr = `${service.finishDate} ${service.finishTime}:00`.replace(/-/g, '/');
					
					const start = new Date(startStr);
					const end = new Date(endStr);
					
					let diffMs = end - start;
					if (diffMs <= 0) return "0.0";
					
					const totalMinutes = (diffMs / 60000) + Number(fee.returnDuration || 0);
					return (totalMinutes / 60).toFixed(1);
				} catch (e) {
					console.error("Calculation error:", e);
					return "0.0";
				}
			},
			laborTotal() {
				const fee = this.formData.additionalFees.laborFee;
				return (Number(this.laborHours) * Number(fee.unitPrice || 0)).toFixed(1);
			},
			additionalTotal() {
				return (Number(this.travelTotal) + Number(this.laborTotal)).toFixed(1);
			},
			grandTotal() {
				return (Number(this.partsTotal) + Number(this.additionalTotal)).toFixed(1);
			},
			isBasicComplete() {
				return !!this.formData.orderNo;
			},
			isCustomerComplete() {
				const c = this.formData.customer;
				return !!(c.name && c.phone && c.address && c.usageType && c.reportTime);
			},
			isProductComplete() {
				const p = this.formData.product;
				return !!(p.machineNo && p.engineNo && p.productionDate && p.platePhoto && p.model);
			},
			isServiceComplete() {
				const s = this.formData.service;
				const minPhotos = s.parts.length > 0 ? s.parts.length : 1;
				return !!(s.type && s.faultCategory && s.faultDesc && s.handleDesc && s.sitePhotos.length >= minPhotos && s.finishTime);
			},
			isFeesComplete() {
				return true;
			},
			isConfirmComplete() {
				return !!this.formData.confirm.machineUserPhoto;
			},
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
			const todayDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			
			this.formData.customer.reportTime = todayDate;
			
			// 初始化时间：出发时间默认为1小时前，维修完成时间为现在
			const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
			const oneHourAgoDate = `${oneHourAgo.getFullYear()}-${String(oneHourAgo.getMonth()+1).padStart(2, '0')}-${String(oneHourAgo.getDate()).padStart(2, '0')}`;
			
			this.formData.additionalFees.laborFee.departureDate = oneHourAgoDate;
			this.formData.additionalFees.laborFee.departureTime = `${String(oneHourAgo.getHours()).padStart(2, '0')}:${String(oneHourAgo.getMinutes()).padStart(2, '0')}`;
			
			this.formData.service.finishDate = todayDate;
			this.formData.service.finishTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
			
			const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
			this.formData.orderNo = 'JS' + dateStr + Math.floor(Math.random() * 1000);
			this.checkDraft();
		},
		methods: {
			toggleSection(key) {
				this.sectionsCollapsed[key] = !this.sectionsCollapsed[key];
			},
			onDepartureDateChange(e) { this.formData.additionalFees.laborFee.departureDate = e.detail.value; },
			onDepartureTimeChange(e) { this.formData.additionalFees.laborFee.departureTime = e.detail.value; },
			onFinishDateChange(e) { this.formData.service.finishDate = e.detail.value; },
			onFinishTimeChange(e) { this.formData.service.finishTime = e.detail.value; },
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
			onIsChargeableChange(e) { this.formData.service.isChargeable = e.detail.value; },
			onPartSourceChange(e, index) {
				const val = e.detail.value;
				const source = this.partSources[val];
				// 使用 $set 确保深度响应式更新
				this.$set(this.formData.service.parts[index], 'source', source);
				if (source !== '其他') {
					this.$set(this.formData.service.parts[index], 'sourceRemark', '');
				}
			},
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
				this.formData.service.parts.push({ 
					name: '', 
					code: '', 
					count: 1, 
					oldPartAction: '带回',
					source: '自带',
					sourceRemark: '',
					price: 0
				});
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
				// 使用 $set 确保深度响应式更新
				this.$set(this.formData.service.parts[index], 'oldPartAction', e.detail.value);
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
					
					// 处理零件价格和总价
					const processedParts = this.formData.service.parts.map(p => ({
						...p,
						price: Number(p.price) || 0,
						total: (Number(p.price) || 0) * (p.count || 0)
					}));

					// 处理附加费用
					let additionalFeesData = null;
					if (this.formData.service.isChargeable === '收费') {
						const labor = this.formData.additionalFees.laborFee;
						const service = this.formData.service;
						
						const depTime = new Date(`${labor.departureDate} ${labor.departureTime}:00`.replace(/-/g, '/'));
						const finTime = new Date(`${service.finishDate} ${service.finishTime}:00`.replace(/-/g, '/'));

						additionalFeesData = {
							travelFee: {
								distance: Number(this.formData.additionalFees.travelFee.distance) || 0,
								unitPrice: Number(this.formData.additionalFees.travelFee.unitPrice) || 0,
								total: Number(this.travelTotal)
							},
							laborFee: {
								departureTime: depTime.getTime(),
								finishTime: finTime.getTime(),
								returnDuration: Number(labor.returnDuration) || 0,
								totalHours: Number(this.laborHours),
								unitPrice: Number(labor.unitPrice) || 0,
								total: Number(this.laborTotal)
							},
							totalAmount: Number(this.additionalTotal)
						};
					}

					const orderData = {
						orderNo: this.formData.orderNo,
						customerInfo: { ...this.formData.customer, reportTime: new Date(this.formData.customer.reportTime).getTime() },
						productInfo: { ...this.formData.product, platePhoto: platePhotoId, productionDate: this.formData.product.productionDate ? new Date(this.formData.product.productionDate).getTime() : Date.now() },
						serviceInfo: { ...this.formData.service, parts: processedParts, sitePhotos: sitePhotoIds, finishTime: Date.now() },
						additionalFees: additionalFeesData,
						customerConfirm: { machineUserPhoto: confirmPhotoId }
					};
					
					const finTime = new Date(`${this.formData.service.finishDate} ${this.formData.service.finishTime}:00`.replace(/-/g, '/'));
					orderData.serviceInfo.finishTime = finTime.getTime();
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
	.section { background: #fff; border-radius: 8px; padding: 15px; margin-bottom: 10px; transition: all 0.3s;
		&.is-collapsed { padding: 5px 15px; }
		.section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #007aff; padding-left: 10px; margin-bottom: 15px; transition: all 0.3s;
			&.collapsible { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; 
				& + view { margin-top: 15px; }
			}
			&.no-border { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
			.title-left { display: flex; align-items: center; }
			.complete-check { color: #4cd964; margin-left: 8px; font-size: 14px; }
			.arrow-icon { font-size: 12px; color: #ccc; transition: transform 0.3s; &.collapsed { transform: rotate(-90deg); } }
		}
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
		.col-inputs { flex: 1.5; display: flex; flex-direction: column; justify-content: center; .mini-input { background: #fff; padding: 2px 5px; font-size: 13px; border: 1px solid #ddd; border-radius: 2px; height: 28px; &.mb-5 { margin-bottom: 4px; } &.mt-5 { margin-top: 4px; } } }
		.col-source { flex: 1.2; display: flex; flex-direction: column; justify-content: center; 
			.source-picker-box { background: #eef5ff; padding: 4px 5px; font-size: 12px; border: 1px solid #007aff; border-radius: 4px; text-align: center; color: #007aff; min-height: 20px; line-height: 20px;} 
		}
		.col-count { width: 70px; display: flex; align-items: center; justify-content: center;
			.stepper { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; background: #fff; overflow: hidden;
				.step-btn { width: 20px; height: 24px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 16px; font-weight: bold; color: #555; }
				.step-val { width: 24px; text-align: center; font-size: 13px; border-left: 1px solid #eee; border-right: 1px solid #eee; }
			}
		}
		.col-action { width: 65px; display: flex; align-items: center; .radio-group-stack { display: flex; flex-direction: column; justify-content: center; .radio-label { font-size: 11px; display: flex; align-items: center; margin-bottom: 2px; white-space: nowrap; } } }
		.col-del { width: 25px; display: flex; align-items: center; justify-content: center; color: #ff5252; font-size: 24px; font-weight: bold; }
	}
	.part-card-wrapper {
		margin-bottom: 12px;
		background: #fff;
		border: 1px solid #eee;
		border-radius: 4px;
		overflow: hidden;
		.part-card.compact { margin-bottom: 0; border: none; border-bottom: 1px dashed #eee; }
	}
	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 10px;
		background: #fff9f0;
		.price-input-box, .price-total-box { display: flex; align-items: center; font-size: 13px; }
		.p-label { color: #666; margin-right: 5px; }
		.p-input { width: 60px; height: 24px; background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 0 5px; text-align: right; color: #ff5252; font-weight: bold; }
		.p-val { color: #ff5252; font-weight: bold; font-size: 15px; }
		.p-unit { font-size: 12px; color: #999; margin-left: 2px; }
	}
	.parts-summary {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 10px;
		margin-top: 5px;
		background: #f0f7ff;
		border-radius: 4px;
		font-size: 14px;
		color: #333;
		.total-amount { font-size: 18px; font-weight: bold; color: #007aff; margin-left: 10px; }
	}

	.fee-group {
		background: #fcfcfc;
		border: 1px solid #eee;
		border-radius: 6px;
		padding: 10px;
		.fee-header { font-size: 14px; font-weight: bold; color: #007aff; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
		.no-border { border-bottom: none; padding: 5px 0; }
		.unit { font-size: 12px; color: #999; margin-left: 5px; }
		.fee-subtotal { text-align: right; font-size: 13px; color: #666; margin-top: 10px; border-top: 1px dashed #eee; padding-top: 8px;
			.amount { color: #ff5252; font-weight: bold; font-size: 15px; margin-left: 5px; }
		}
		.fee-info-row { font-size: 12px; color: #999; margin-top: 5px; text-align: right; .val { color: #333; margin-left: 5px; } }
	}
	.fee-total-summary {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 12px;
		margin-top: 15px;
		background: #fff0f0;
		border-radius: 4px;
		font-size: 15px;
		font-weight: bold;
		color: #333;
		border: 1px solid #ffcdd2;
		.total-amount { font-size: 20px; color: #ff5252; margin-left: 10px; }
	}
	.mt-15 { margin-top: 15px; }
	.picker-view.disabled { color: #999; }

	.settlement-summary {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin: 20px 0 10px;
		border: 2px solid #007aff;
		.settlement-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 12px; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; }
		.settlement-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; color: #666; }
		.settlement-total { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 2px dashed #007aff;
			.total-label { font-size: 16px; font-weight: bold; color: #333; }
			.total-val { font-size: 22px; font-weight: bold; color: #007aff; }
		}
	}

	.btn-submit { background-color: #007aff; color: #fff; margin-top: 20px; }

	.footer-info {
		padding: 10px;
		background: #eee;
		border-radius: 4px;
		margin-top: 20px;
		.footer-item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #666; 
			.f-val { color: #333; font-family: monospace; }
		}
	}

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