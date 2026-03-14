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
						<text class="field-label required">经销商</text>
						<view class="picker-text" @click="toggleDistributorPicker">
							{{ formData.customer.distributorName || '点击搜索并选择经销商' }}
						</view>
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

			<!-- Section D: Service Info (Summary) -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.service }">
				<view class="card-header" @click="toggleSection('service')">
					<view class="header-left">
						<text class="header-title">服务基础信息</text>
						<text v-if="formData.service.type" class="header-status">已选择</text>
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
					<view class="ui-field column no-border">
						<view class="field-label-row">
							<text class="field-label required">故障分类</text>
							<view class="btn-text-add" @click="toggleFaultPicker">+ 添加/修改分类</view>
						</view>
						<view class="tag-cloud-wrapper">
							<view v-if="!formData.service || !formData.service.faultItems || formData.service.faultItems.length === 0" class="tag-placeholder" @click="toggleFaultPicker">
								点击此处选择故障分类，将为您生成对应卡片
							</view>
							<view v-else class="tag-cloud">
								<view v-for="(item, tidx) in formData.service.faultItems" :key="tidx" class="tag" @click.stop="removeFaultTag(tidx)">
									<text class="t-text">{{ item.category }}</text>
									<text class="x">✕</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Dynamic Fault Cards: One for each selected category -->
			<view v-for="(item, itemIdx) in formData.service.faultItems" :key="itemIdx" class="ui-card" :class="{ 'card-active': !sectionsCollapsed['fault_' + itemIdx] }">
				<view class="card-header" @click="toggleSection('fault_' + itemIdx)">
					<view class="header-left">
						<text class="header-title">{{ itemIdx + 1 }}、{{ item.category }}</text>
					</view>
					<view class="header-right-actions">
						<text class="btn-remove-emoji" @click.stop="removeFaultTag(itemIdx)">🗑️</text>
						<text class="header-arrow" :class="{ 'arrow-up': !sectionsCollapsed['fault_' + itemIdx] }"></text>
					</view>
				</view>
				
				<view class="card-body" v-show="!sectionsCollapsed['fault_' + itemIdx]">
					<view class="ui-field column">
						<text class="field-label required">故障现象</text>
						<textarea class="field-textarea" v-model="item.faultDesc" placeholder="请详细描述故障表现..." placeholder-class="ph" />
					</view>
					
					<view class="ui-field column">
						<text class="field-label required">处理方法</text>
						<textarea class="field-textarea" v-model="item.handleDesc" placeholder="请详细描述处理过程..." placeholder-class="ph" />
					</view>

					<!-- Parts Detail for THIS category -->
					<view class="ui-field column no-border">
						<view class="list-header">
							<text class="list-title">更换零件明细</text>
							<view class="btn-text-add" @click="addPart(itemIdx)">+ 新增零件</view>
						</view>
						
						<view v-for="(part, pIdx) in item.parts" :key="pIdx" class="part-entry">
							<text class="btn-remove-absolute" @click="removePart(itemIdx, pIdx)">×</text>
							<view class="entry-row">
								<input v-model="part.name" placeholder="零件名称" class="input-name" placeholder-class="ph" />
							</view>
							
							<view class="entry-row mt-8">
								<input v-model="part.code" placeholder="图号/编码" class="input-code" placeholder-class="ph" />
								<view class="source-picker-inline">
									<text class="s-label">来源</text>
									<picker :range="partSources" @change="onPartSourceChange($event, itemIdx, pIdx)" class="s-picker">
										<view class="s-value">{{ part.source || '选择来源' }}</view>
									</picker>
								</view>
							</view>

							<view class="part-ext-row" v-if="part.source === '其他'">
								<text class="ext-label required">来源备注</text>
								<input v-model="part.sourceRemark" placeholder="具体来源说明" class="input-remark" placeholder-class="ph-warning" />
							</view>

							<view class="entry-row mt-10 flex-align-center">
								<view class="entry-stepper-wrapper">
									<text class="st-label">数量</text>
									<view class="entry-stepper">
										<text class="s-btn" @click.stop="updatePartCount(itemIdx, pIdx, -1)">-</text>
										<text class="s-num">{{ part.count }}</text>
										<text class="s-btn" @click.stop="updatePartCount(itemIdx, pIdx, 1)">+</text>
									</view>
								</view>
								<view class="entry-bottom-inline">
									<view class="price-box-small">
										<text class="p-label">单价</text>
										<input type="digit" v-model="part.price" class="p-val" />
									</view>
									<view class="price-box-small ml-10">
										<text class="p-label">金额</text>
										<text class="p-total-val">￥{{ ((Number(part.price) || 0) * (part.count || 0)).toFixed(1) }}</text>
									</view>
								</view>
							</view>

							<view class="entry-row-standalone mt-10">
								<view class="old-part-toggle-full">
									<text class="opt-label">旧件处理方式</text>
									<view class="opt-btns">
										<view class="opt-btn" :class="{ 'active': part.oldPartAction === '带回' }" @click="onOldPartActionChange(itemIdx, pIdx, '带回')">带回</view>
										<view class="opt-btn" :class="{ 'active': part.oldPartAction === '丢弃' }" @click="onOldPartActionChange(itemIdx, pIdx, '丢弃')">丢弃</view>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- Site Photos for THIS category -->
					<view class="ui-field column no-border mt-10">
						<view class="field-label-full">
							<text class="field-label required">现场照片</text>
							<text class="field-label-tip">(故障、维修后、旧件照片)</text>
						</view>
						<view class="grid-uploader">
							<view class="grid-add" @click="chooseImage('site', itemIdx)">
								<text class="icon">+</text>
							</view>
							<view v-for="(img, pIdx) in item.sitePhotos" :key="pIdx" class="grid-item">
								<image :src="img" class="img" mode="aspectFill" @click="previewImg(img)"></image>
								<text class="btn-del" @click.stop="removeSitePhoto(itemIdx, pIdx)">×</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Section E: Additional Fees -->
			<view class="ui-card" :class="{ 'card-active': !sectionsCollapsed.fees }">
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
							<view class="f-item">单价<input type="digit" v-model="formData.additionalFees.travelFee.unitPrice" :disabled="formData.service.isChargeable === '免费'" />元</view>
						</view>
						<text class="f-subtotal">合计: ￥{{ travelTotal }}</text>
					</view>
	
					<view class="fee-card mt-15">
						<text class="f-title">工时费核算</text>
						<view class="f-duration-grid">
							<view class="d-item">
								<text class="l">出发用时</text>
								<view class="i-box"><input type="number" v-model="formData.additionalFees.laborFee.onWayDuration" placeholder="0" />min</view>
							</view>
							<view class="d-item">
								<text class="l">维修用时</text>
								<view class="i-box"><input type="number" v-model="formData.additionalFees.laborFee.repairDuration" placeholder="0" />min</view>
							</view>
							<view class="d-item">
								<text class="l">返程用时</text>
								<view class="i-box"><input type="number" v-model="formData.additionalFees.laborFee.returnDuration" placeholder="0" />min</view>
							</view>
						</view>
						<view class="f-inputs mt-10">
							<view class="f-item">总时长<text class="v">{{ laborHours }} h</text></view>
							<view class="f-item">单价<input type="digit" v-model="formData.additionalFees.laborFee.unitPrice" :disabled="formData.service.isChargeable === '免费'" />元</view>
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
					
					<!-- Moved Finish Time here -->
					<view class="ui-field mt-10">
						<text class="field-label required" style="width: 100px;">服务完成时间</text>
						<view class="time-picker-group">
							<picker mode="date" @change="onFinishDateChange" class="tp"><view>{{ formData.service.finishDate }}</view></picker>
							<picker mode="time" @change="onFinishTimeChange" class="tp ml-5"><view>{{ formData.service.finishTime || '00:00' }}</view></picker>
						</view>
					</view>
				</view>
			</view>

			<!-- Settlement Dashboard (Always show for cost tracking) -->
			<view class="settlement-panel">
				<view class="panel-header">{{ formData.service.isChargeable === '收费' ? '费用结算概览' : '服务成本统计' }}</view>
				<view class="panel-grid">
					<view class="p-item"><text class="l">零件费用</text><text class="v">￥{{ partsTotal }}</text></view>
					<view class="p-item">
						<text class="l">总里程</text>
						<text class="v">{{ formData.additionalFees.travelFee.distance }} km</text>
					</view>
					<view class="p-item">
						<text class="l">总工时</text>
						<text class="v">{{ laborHours }} h</text>
					</view>
				</view>
				<view class="panel-grid mt-10" v-if="formData.service.isChargeable === '收费'">
					<view class="p-item"><text class="l">路程费用</text><text class="v">￥{{ travelTotal }}</text></view>
					<view class="p-item"><text class="l">工时费用</text><text class="v">￥{{ laborTotal }}</text></view>
					<view class="p-item"><text class="l">附加合计</text><text class="v">￥{{ additionalTotal }}</text></view>
				</view>
				<view class="panel-total">
					<text>{{ formData.service.isChargeable === '收费' ? '应收合计' : '物料成本合计' }}</text>
					<text class="total-v">￥{{ formData.service.isChargeable === '收费' ? grandTotal : partsTotal }}</text>
				</view>
			</view>

			<!-- Payment Method Selection (Only when chargeable) -->
			<view class="ui-card mt-20" v-if="formData.service.isChargeable === '收费'">
				<view class="card-header no-border">
					<view class="header-left">
						<text class="header-title">支付方式</text>
						<text class="header-status-warn">必填</text>
					</view>
				</view>
				<view class="card-body">
					<radio-group @change="onPaymentMethodChange" class="payment-grid">
						<label class="payment-item" :class="{ 'active': formData.service.paymentMethod === '微信支付' }">
							<radio value="微信支付" :checked="formData.service.paymentMethod === '微信支付'" color="#1677ff" />
							<text class="p-text">微信支付</text>
						</label>
						<label class="payment-item" :class="{ 'active': formData.service.paymentMethod === '支付宝' }">
							<radio value="支付宝" :checked="formData.service.paymentMethod === '支付宝'" color="#1677ff" />
							<text class="p-text">支付宝</text>
						</label>
						<label class="payment-item" :class="{ 'active': formData.service.paymentMethod === '电汇' }">
							<radio value="电汇" :checked="formData.service.paymentMethod === '电汇'" color="#1677ff" />
							<text class="p-text">电汇</text>
						</label>
						<label class="payment-item" :class="{ 'active': formData.service.paymentMethod === '现金' }">
							<radio value="现金" :checked="formData.service.paymentMethod === '现金'" color="#1677ff" />
							<text class="p-text">现金</text>
						</label>
					</radio-group>
				</view>
			</view>

			<!-- Page Footer -->
			<view class="action-footer">
				<view class="meta-info">
					<view class="item"><text class="lb">单号</text><text class="vl">{{ formData.orderNo }}</text></view>
					<view class="item"><text class="lb">填单</text><text class="vl">{{ currentUser }}</text></view>
				</view>
				<view class="btn-group">
					<button class="btn-mock-fill" @click="fillMockData">一键填写(测试)</button>
					<button class="btn-primary-main" @click="submitOrder">正式提交服务单</button>
				</view>
			</view>
		</view>

		<!-- Distributor Picker Modal -->
		<view class="modal-mask" v-if="showDistributorPicker" @click.stop="toggleDistributorPicker">
			<view class="modal-body" @click.stop="">
				<view class="modal-header">
					<view class="h-left">
						<text class="t">选择经销商</text>
					</view>
					<text class="c" @click="toggleDistributorPicker">✕</text>
				</view>
				
				<view class="modal-search">
					<text class="search-icon">🔍</text>
					<input v-model="distributorSearchKey" placeholder="输入名称或业务员模糊搜索..." class="s-input" placeholder-class="ph" />
					<text class="clear-btn" v-if="distributorSearchKey" @click="distributorSearchKey = ''">×</text>
				</view>

				<scroll-view scroll-y class="modal-scroll">
					<view v-for="(item, idx) in filteredDistributors" :key="idx" 
						class="leaf-item search" 
						:class="{ 'active': formData.customer.distributorName === item.name }"
						@click="selectDistributor(item)">
						<view class="l-content">
							<text class="n">{{ item.name }}</text>
							<text class="p">{{ item.region || '未设地区' }} | 业务员: {{ item.salesman || '未指定' }}</text>
						</view>
						<view class="check-box" v-if="formData.customer.distributorName === item.name">
							<text class="check-icon">✓</text>
						</view>
					</view>
					<view class="empty-results" v-if="filteredDistributors.length === 0">未找到相关经销商</view>
				</scroll-view>
				
				<view class="modal-footer">
					<button class="confirm-btn" @click="toggleDistributorPicker">关闭</button>
				</view>
			</view>
		</view>

		<!-- Fault Picker Modal -->
		<view class="modal-mask" v-if="showFaultPicker" @click.stop="toggleFaultPicker">
			<view class="modal-body" @click.stop="">
				<view class="modal-header">
					<view class="h-left">
						<text class="t">选择故障分类</text>
						<text class="count" v-if="selectedFaultCategoryNames && selectedFaultCategoryNames.length > 0">已选 {{ selectedFaultCategoryNames.length }}</text>
					</view>
					<text class="c" @click="toggleFaultPicker">✕</text>
				</view>
				
				<view class="modal-search">
					<text class="search-icon">🔍</text>
					<input v-model="faultSearchKey" placeholder="快速搜索故障现象或分类..." class="s-input" placeholder-class="ph" />
					<text class="clear-btn" v-if="faultSearchKey" @click="faultSearchKey = ''">×</text>
				</view>

				<scroll-view scroll-y class="modal-scroll">
					<!-- Search Results -->
					<block v-if="faultSearchKey">
						<view v-for="(item, idx) in searchResults" :key="idx" 
							class="leaf-item search" 
							:class="{ 'active': selectedFaultCategoryNames.includes(item.parent + '-' + item.name) }"
							@click="selectFaultLeaf(item.name, item.parent)">
							<view class="l-content">
								<text class="n">{{ item.name }}</text>
								<text class="p">{{ item.parent }}</text>
							</view>
							<view class="check-box" v-if="selectedFaultCategoryNames.includes(item.parent + '-' + item.name)">
								<text class="check-icon">✓</text>
							</view>
						</view>
						<view class="empty-results" v-if="searchResults.length === 0">未找到相关分类</view>
					</block>
					
					<!-- Category List -->
					<block v-else-if="!selectedCategory">
						<view v-for="(cat, idx) in faultTree" :key="idx" class="cat-item" @click="selectFaultCategory(cat)">
							<view class="c-info">
								<text class="c-title">{{ cat.title }}</text>
								<text class="c-badge" v-if="getCategorySelectedCount(cat.title) > 0">{{ getCategorySelectedCount(cat.title) }}</text>
							</view>
							<text class="a">›</text>
						</view>
					</block>
					
					<!-- Sub-category List -->
					<block v-else>
						<view class="nav-back-sticky" @click="selectedCategory = null">
							<text class="i">‹</text><text>返回：{{ selectedCategory.title }}</text>
						</view>
						<view v-for="(leaf, idx) in selectedCategory.children" :key="idx" 
							class="leaf-item" 
							:class="{ 'active': selectedFaultCategoryNames.includes(selectedCategory.title + '-' + leaf) }"
							@click="selectFaultLeaf(leaf, selectedCategory.title)">
							<text class="n">{{ leaf }}</text>
							<view class="check-box" v-if="selectedFaultCategoryNames.includes(selectedCategory.title + '-' + leaf)">
								<text class="check-icon">✓</text>
							</view>
						</view>
					</block>
				</scroll-view>
				
				<view class="modal-footer">
					<view class="selected-summary" v-if="selectedFaultCategoryNames && selectedFaultCategoryNames.length > 0">
						<scroll-view scroll-x class="summary-scroll">
							<view class="summary-tags">
								<view v-for="(tagName, tidx) in selectedFaultCategoryNames" :key="tidx" class="s-tag" @click="removeFaultTag(tidx)">
									{{ tagName.split('-')[1] || tagName }}
								</view>
							</view>
						</scroll-view>
					</view>
					<button class="confirm-btn" @click="toggleFaultPicker">完成选择</button>
				</view>
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
				distributors: [],
				showDistributorPicker: false,
				distributorSearchKey: '',
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
					service: { 
						type: '', 
						isChargeable: '免费', 
						faultItems: [], // 改为对象数组，支持“一故障一卡片”
						finishDate: '', 
						finishTime: '', 
						paymentMethod: '微信支付' 
					},
					additionalFees: {
						travelFee: { distance: 0, unitPrice: 0, total: 0 },
						laborFee: { 
							onWayDuration: 0, // 出发用时(min)
							repairDuration: 0, // 维修用时(min)
							returnDuration: 0, // 返程用时(min)
							unitPrice: 0, 
							totalHours: 0, 
							total: 0 
						}
					},
					confirm: { machineUserPhoto: '' }
				},
				sectionsCollapsed: { customer: false, product: true, service: false, fees: false, confirm: true },
				allowSave: false
			}
		},
		watch: {
			formData: {
				handler(val) {
					if (this.allowSave) {
						this.saveDraft(val);
					}
				},
				deep: true
			}
		},
		computed: {
			partsTotal() {
				if (!this.formData.service || !this.formData.service.faultItems) return "0.0";
				return this.formData.service.faultItems.reduce((total, item) => {
					const itemTotal = (item.parts || []).reduce((sum, part) => sum + (Number(part.price) || 0) * (part.count || 0), 0);
					return total + itemTotal;
				}, 0).toFixed(1);
			},
			travelTotal() { 
				if (!this.formData.additionalFees || !this.formData.additionalFees.travelFee) return "0.0";
				const fee = this.formData.additionalFees.travelFee; 
				return (Number(fee.distance || 0) * Number(fee.unitPrice || 0)).toFixed(1); 
			},
			laborHours() {
				if (!this.formData.additionalFees || !this.formData.additionalFees.laborFee) return "0.0";
				const f = this.formData.additionalFees.laborFee;
				const totalMinutes = (Number(f.onWayDuration) || 0) + (Number(f.repairDuration) || 0) + (Number(f.returnDuration) || 0);
				return (totalMinutes / 60).toFixed(1);
			},
			laborTotal() { 
				if (!this.formData.additionalFees || !this.formData.additionalFees.laborFee) return "0.0";
				return (Number(this.laborHours) * Number(this.formData.additionalFees.laborFee.unitPrice || 0)).toFixed(1); 
			},
			additionalTotal() { return (Number(this.travelTotal) + Number(this.laborTotal)).toFixed(1); },
			grandTotal() { return (Number(this.partsTotal) + Number(this.additionalTotal)).toFixed(1); },
			isCustomerComplete() { 
				const c = this.formData.customer; 
				return !!(c && c.name && c.phone && c.address); 
			},
			isProductComplete() { 
				const p = this.formData.product; 
				return !!(p && p.machineNo && p.platePhoto); 
			},
			isServiceComplete() {
				const s = this.formData.service;
				if (!s || !s.type || !s.faultItems || s.faultItems.length === 0) return false;
				for (const item of s.faultItems) {
					if (!item.faultDesc || !item.handleDesc || !item.sitePhotos || item.sitePhotos.length === 0) return false;
					for (const part of (item.parts || [])) {
						if (!part.name || !part.code) return false;
						if (part.source === '其他' && !part.sourceRemark) return false;
					}
				}
				return true;
			},
			isConfirmComplete() { return !!(this.formData.confirm && this.formData.confirm.machineUserPhoto); },
			selectedFaultCategoryNames() {
				if (!this.formData.service || !this.formData.service.faultItems) return [];
				return this.formData.service.faultItems.map(item => item.category);
			},
			filteredDistributors() {
				if (!this.distributorSearchKey) return this.distributors;
				const key = this.distributorSearchKey.toLowerCase();
				return this.distributors.filter(item => 
					(item.name && item.name.toLowerCase().indexOf(key) !== -1) || 
					(item.salesman && item.salesman.toLowerCase().indexOf(key) !== -1)
				);
			},
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
			
			// 加载经销商列表
			this.loadDistributors();
			
			// 默认初始化数据
			const now = new Date();
			const today = now.toISOString().slice(0, 10);
			this.formData.customer.reportTime = today;
			const depTime = new Date(now.getTime() - 3600000);
			this.formData.additionalFees.laborFee.departureDate = depTime.toISOString().slice(0, 10);
			this.formData.additionalFees.laborFee.departureTime = depTime.toTimeString().slice(0, 5);
			this.formData.service.finishDate = today;
			this.formData.service.finishTime = now.toTimeString().slice(0, 5);
			this.formData.orderNo = 'JS' + today.replace(/-/g, '') + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
			
			// 检查草稿并开启自动保存
			this.checkDraft();
		},
		methods: {
			async loadDistributors() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('jiushun-distributors').limit(500).get();
					if (res.result.data) {
						this.distributors = res.result.data;
					}
				} catch (e) {
					console.error('加载经销商失败:', e);
				}
			},
			onDistributorChange(e) {
				const index = e.detail.value;
				this.formData.customer.distributorName = this.distributors[index].name;
			},
			toggleDistributorPicker() {
				this.showDistributorPicker = !this.showDistributorPicker;
				if (this.showDistributorPicker) {
					this.distributorSearchKey = '';
				}
			},
			selectDistributor(item) {
				this.formData.customer.distributorName = item.name;
				this.toggleDistributorPicker();
			},
			toggleSection(key) { this.sectionsCollapsed[key] = !this.sectionsCollapsed[key]; },
			onDepartureDateChange(e) { this.formData.additionalFees.laborFee.departureDate = e.detail.value; },
			onDepartureTimeChange(e) { this.formData.additionalFees.laborFee.departureTime = e.detail.value; },
			onFinishDateChange(e) { this.formData.service.finishDate = e.detail.value; },
			onFinishTimeChange(e) { this.formData.service.finishTime = e.detail.value; },
			checkDraft() {
				const draft = uni.getStorageSync('order_draft');
				if (draft) {
					uni.showModal({
						title: '草稿提示',
						content: '发现未完成的工单，是否继续编辑？',
						cancelText: '重新开始',
						confirmText: '恢复草稿',
						success: (res) => {
							if (res.confirm) {
								this.formData = draft;
								uni.showToast({ title: '已恢复草稿', icon: 'none' });
							} else {
								// 如果用户选择重新开始，建议清除旧草稿以防混淆
								uni.removeStorageSync('order_draft');
							}
							// 无论用户如何选择，都开启后续的自动保存
							this.$nextTick(() => { this.allowSave = true; });
						}
					});
				} else {
					this.allowSave = true;
				}
			},
			saveDraft(data) {
				// 检查是否有实质性的用户输入（排除自动生成的单号和时间）
				const hasContent = !!(data.customer.name || data.customer.phone || data.customer.address || data.product.machineNo || data.service.faultDesc);
				if (!hasContent) return;

				if (this.saveTimer) clearTimeout(this.saveTimer);
				this.saveTimer = setTimeout(() => {
					uni.setStorageSync('order_draft', data);
				}, 1000); // 1秒防抖，避免频繁写入磁盘
			},
			onUsageChange(e) { this.formData.customer.usageType = e.detail.value; },
			onDateChange(e) { this.formData.product.productionDate = e.detail.value; },
			onReportDateChange(e) { this.formData.customer.reportTime = e.detail.value; },
			onServiceTypeChange(e) { this.formData.service.type = this.serviceTypes[e.detail.value]; },
			onIsChargeableChange(e) { 
				this.formData.service.isChargeable = e.detail.value; 
				if (this.formData.service.isChargeable === '免费') {
					this.formData.additionalFees.travelFee.unitPrice = 0;
					this.formData.additionalFees.laborFee.unitPrice = 0;
				} else {
					// 恢复默认单价
					this.formData.additionalFees.travelFee.unitPrice = 1.2;
					this.formData.additionalFees.laborFee.unitPrice = 85;
				}
			},
			onPaymentMethodChange(e) { this.formData.service.paymentMethod = e.detail.value; },
			onPartSourceChange(e, itemIdx, partIdx) { 
				this.$set(this.formData.service.faultItems[itemIdx].parts[partIdx], 'source', this.partSources[e.detail.value]); 
			},
			onOldPartActionChange(itemIdx, partIdx, action) { 
				this.$set(this.formData.service.faultItems[itemIdx].parts[partIdx], 'oldPartAction', action); 
			},
			toggleFaultPicker() { this.showFaultPicker = !this.showFaultPicker; this.selectedCategory = null; },
			selectFaultCategory(cat) { this.selectedCategory = cat; },
			selectFaultLeaf(leaf, parent) {
				const categoryName = parent ? `${parent}-${leaf}` : leaf;
				const idx = this.formData.service.faultItems.findIndex(item => item.category === categoryName);
				
				if (idx > -1) {
					// 如果已存在，则移除该故障条目（卡片）
					uni.showModal({
						title: '确认移除',
						content: `取消选择 "${categoryName}" 将删除该分类下已填写的所有内容，确认吗？`,
						success: (res) => {
							if (res.confirm) {
								this.formData.service.faultItems.splice(idx, 1);
							}
						}
					});
				} else {
					// 如果不存在，则新增一个故障条目（卡片）
					this.formData.service.faultItems.push({
						category: categoryName,
						faultDesc: '',
						handleDesc: '',
						parts: [],
						sitePhotos: []
					});
				}
			},
			removeFaultTag(idx) { 
				uni.showModal({
					title: '确认移除',
					content: '确认删除该故障卡片吗？',
					success: (res) => {
						if (res.confirm) {
							this.formData.service.faultItems.splice(idx, 1);
						}
					}
				});
			},
			getCategorySelectedCount(catTitle) {
				if (!this.formData.service || !this.formData.service.faultItems) return 0;
				return this.formData.service.faultItems.filter(item => item.category && item.category.startsWith(catTitle + '-')).length;
			},
			addPart(itemIdx) { 
				this.formData.service.faultItems[itemIdx].parts.push({ 
					name: '', code: '', count: 1, oldPartAction: '带回', source: '自带', price: 0 
				}); 
			},
			updatePartCount(itemIdx, partIdx, d) { 
				const p = this.formData.service.faultItems[itemIdx].parts[partIdx]; 
				if (p.count + d >= 1) p.count += d; 
			},
			removePart(itemIdx, partIdx) {
				uni.showModal({
					title: '确认删除',
					content: '是否确定删除该项零件？',
					success: (res) => {
						if (res.confirm) {
							this.formData.service.faultItems[itemIdx].parts.splice(partIdx, 1);
						}
					}
				});
			},
			chooseImage(type, itemIdx = -1) {
				uni.chooseImage({
					count: type === 'site' ? 9 : 1,
					success: (res) => {
						if (type === 'plate') this.formData.product.platePhoto = res.tempFilePaths[0];
						else if (type === 'confirm') this.formData.confirm.machineUserPhoto = res.tempFilePaths[0];
						else if (type === 'site' && itemIdx !== -1) {
							this.formData.service.faultItems[itemIdx].sitePhotos.push(...res.tempFilePaths);
						}
					}
				});
			},
			removeSitePhoto(itemIdx, photoIdx) { 
				this.formData.service.faultItems[itemIdx].sitePhotos.splice(photoIdx, 1); 
			},
			previewImg(url) { uni.previewImage({ urls: [url] }); },
			fillMockData() {
				const names = ['张伟', '王芳', '李娜', '刘强', '陈杰'];
				const addresses = ['山东省临沂市兰山区', '江苏省徐州市铜山区', '安徽省宿州市埇桥区', '河北省石家庄市藁城区'];
				const models = ['JS-100', 'JS-200', 'JS-300', 'JS-V5'];
				const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
				
				// 1. 基本信息
				this.formData.customer.name = random(names);
				this.formData.customer.phone = '138' + Math.random().toString().slice(2, 10);
				this.formData.customer.address = random(addresses);
				
				// 随机选择经销商 (如果列表为空，则填默认值)
				if (this.distributors && this.distributors.length > 0) {
					this.formData.customer.distributorName = random(this.distributors).name;
				} else {
					this.formData.customer.distributorName = '玖顺默认经销商';
				}
				
				// 2. 产品信息
				this.formData.product.machineNo = 'SN' + Date.now().toString().slice(-8);
				this.formData.product.engineNo = 'EN' + Math.random().toString(36).slice(-6).toUpperCase();
				this.formData.product.model = random(models);
				this.formData.product.productionDate = '2025-05-20';
				this.formData.product.platePhoto = 'https://mp-e053b326-d336-455f-9572-3993ef17dc83.cdn.bspapp.com/cloudstorage/427c8d67-b213-45bf-b999-d038e82592aa.jpg';
				
				// 3. 服务内容
				this.formData.service.type = random(['三包', '维修', '保养']);
				this.formData.service.isChargeable = random(['免费', '收费']);
				
				// 生成 1-2 个故障条目
				const demoFaults = [
					{ cat: '动力系统-发动机', desc: '发动机冷启动困难，伴有异响' },
					{ cat: '液压系统-HST', desc: '行走时液压泵噪音大，压力不稳定' },
					{ cat: '行走系统-车轮', desc: '后轮轴承松动，需要调整' }
				];
				const count = Math.random() > 0.5 ? 2 : 1;
				this.formData.service.faultItems = [];
				for (let i = 0; i < count; i++) {
					const f = demoFaults[i];
					this.formData.service.faultItems.push({
						category: f.cat,
						faultDesc: f.desc,
						handleDesc: '经检查确认为部件磨损，已清理并更换相关零件，试机运行正常。',
						parts: [
							{ name: '专用密封垫', code: 'SP-882', count: 1, oldPartAction: '带回', source: '自带', price: 120 },
							{ name: '液压油(1L)', code: 'OIL-01', count: 2, oldPartAction: '丢弃', source: '自带', price: 45 }
						],
						sitePhotos: ['https://mp-e053b326-d336-455f-9572-3993ef17dc83.cdn.bspapp.com/cloudstorage/8835e3b1-5287-4595-bd2b-30a7a9733aaf.jpg']
					});
				}
				
				// 4. 附加费用
				if (this.formData.service.isChargeable === '收费') {
					this.formData.additionalFees.travelFee.distance = (Math.random() * 50 + 10).toFixed(1);
					this.formData.additionalFees.travelFee.unitPrice = 1.2;
					this.formData.additionalFees.laborFee.onWayDuration = 45;
					this.formData.additionalFees.laborFee.repairDuration = 90;
					this.formData.additionalFees.laborFee.returnDuration = 40;
					this.formData.additionalFees.laborFee.unitPrice = 85;
				} else {
					this.formData.additionalFees.travelFee.distance = (Math.random() * 50 + 10).toFixed(1);
					this.formData.additionalFees.travelFee.unitPrice = 0;
					this.formData.additionalFees.laborFee.onWayDuration = 30;
					this.formData.additionalFees.laborFee.repairDuration = 60;
					this.formData.additionalFees.laborFee.returnDuration = 30;
					this.formData.additionalFees.laborFee.unitPrice = 0;
				}
				
				// 5. 最终确认
				this.formData.confirm.machineUserPhoto = 'https://mp-e053b326-d336-455f-9572-3993ef17dc83.cdn.bspapp.com/cloudstorage/9a0a25ca-f26e-4b4d-8a00-20cf8607fe06.jpg';
				const now = new Date();
				this.formData.service.finishDate = now.toISOString().slice(0, 10);
				this.formData.service.finishTime = now.toTimeString().slice(0, 5);
				
				uni.showToast({ title: '表单已按新流程模拟填充', icon: 'success' });
			},
			async submitOrder() {
				if (!this.formData.customer.name || !this.formData.product.machineNo || !this.formData.customer.distributorName) { 
					uni.showToast({ title: '信息不全(姓名/机号/经销商)', icon: 'none' }); 
					return; 
				}
				if (!this.isServiceComplete) {
					uni.showToast({ title: '请完整填写每个故障卡片的内容及照片', icon: 'none' });
					return;
				}
				
				uni.showLoading({ title: '数据同步中', mask: true });
				try {
					const orderNo = this.formData.orderNo;
					
					// 1. 上传基础照片
					const plateId = await this.uploadFile(this.formData.product.platePhoto, orderNo);
					const confirmId = await this.uploadFile(this.formData.confirm.machineUserPhoto, orderNo);
					
					// 2. 递归处理故障条目（上传每个卡片的照片）
					const finalFaultItems = [];
					for (const item of this.formData.service.faultItems) {
						const siteIds = [];
						for (const img of item.sitePhotos) {
							const sid = await this.uploadFile(img, orderNo);
							if (sid) siteIds.push(sid);
						}
						finalFaultItems.push({
							...item,
							sitePhotos: siteIds,
							parts: item.parts.map(p => ({
								...p,
								count: Number(p.count),
								price: Number(p.price || 0),
								total: Number(((p.price || 0) * (p.count || 0)).toFixed(1)),
								oldPartAction: p.oldPartAction || '带回'
							}))
						});
					}

					const depTime = new Date(`${this.formData.additionalFees.laborFee.departureDate} ${this.formData.additionalFees.laborFee.departureTime}:00`.replace(/-/g, '/')).getTime();
					const finTime = new Date(`${this.formData.service.finishDate} ${this.formData.service.finishTime}:00`.replace(/-/g, '/')).getTime();
					const cRepTime = this.formData.customer.reportTime ? new Date(this.formData.customer.reportTime.replace(/-/g, '/')).getTime() : Date.now();
					const pProdDate = this.formData.product.productionDate ? new Date(this.formData.product.productionDate.replace(/-/g, '/')).getTime() : null;
					
					const orderData = {
						orderNo: this.formData.orderNo,
						customer: { ...this.formData.customer, reportTime: cRepTime },
						product: { ...this.formData.product, productionDate: pProdDate, platePhoto: plateId },
						service: {
							...this.formData.service,
							faultItems: finalFaultItems,
							finishTime: finTime
						},
						additionalFees: {
							travelFee: {
								distance: Number(this.formData.additionalFees.travelFee.distance || 0),
								unitPrice: Number(this.formData.additionalFees.travelFee.unitPrice || 0),
								total: Number(this.travelTotal)
							},
							laborFee: {
								departureTime: depTime,
								finishTime: finTime,
								returnDuration: Number(this.formData.additionalFees.laborFee.returnDuration || 0),
								totalHours: Number(this.laborHours),
								unitPrice: Number(this.formData.additionalFees.laborFee.unitPrice || 0),
								total: Number(this.laborTotal)
							},
							totalAmount: Number(this.additionalTotal)
						},
						customerConfirm: { machineUserPhoto: confirmId }
					};
					uniCloud.callFunction({
						name: 'work-order-manager',
						data: { action: 'create', params: orderData, uniIdToken: uni.getStorageSync('uni_id_token') },
						success: (res) => {
							uni.hideLoading();
							if (res.result.code === 0) {
								// 提交成功，清除本地草稿
								uni.removeStorageSync('order_draft');
								uni.showToast({ title: '提交成功' });
								setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000);
							} else uni.showToast({ title: res.result.msg, icon: 'none' });
						}
					});
				} catch (e) { 
					uni.hideLoading(); 
					console.error('提交失败:', e);
				}
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
	.container { 
		padding: 16px; 
		padding-bottom: calc(160px + env(safe-area-inset-bottom)); // 增加间距并适配安全区
	}

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
		.header-status { font-size: 10px; background: rgba($success, 0.1); color: $success; padding: 2px 8px; border-radius: 4px; margin-left: 8px; }
		.header-status-warn { font-size: 10px; background: rgba($danger, 0.1); color: $danger; padding: 2px 8px; border-radius: 4px; margin-left: 8px; }
		
		.header-right-actions {
			display: flex;
			align-items: center;
			.btn-remove-emoji { 
				font-size: 16px; 
				margin-right: 20px; // 增加间距
				padding: 4px; 
				opacity: 0.8;
				&:active { opacity: 1; transform: scale(1.1); }
			}
		}
		
		.header-arrow { width: 7px; height: 7px; border-right: 2px solid $text-tip; border-bottom: 2px solid $text-tip; transform: rotate(45deg); transition: transform 0.3s; &.arrow-up { transform: rotate(-135deg); } }
		&.no-border { border-bottom: none; }
	}

	.fault-badge-mini {
		font-size: 10px;
		background: $accent;
		color: #fff;
		width: 16px;
		height: 16px;
		text-align: center;
		line-height: 16px;
		border-radius: 4px;
		margin-right: 8px;
		font-weight: bold;
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
		
		.field-label-full { width: 100%; display: flex; align-items: center; flex-wrap: nowrap; margin-bottom: 6px; 
			.field-label { width: auto; margin-right: 6px; margin-bottom: 0; }
			.field-label-tip { font-size: 11px; color: $text-tip; white-space: nowrap; }
		}
		
		.field-label { width: 85px; font-size: 13px; font-weight: 500; color: $text-secondary; &.required::after { content: '*'; color: $danger; margin-left: 3px; } }
		.hmandmachine { width: 185px;}
		.field-input, .picker-text, .field-picker-box { 
			flex: 1; 
			height: 34px; 
			line-height: 34px; 
			background: #ffffff; // 改为白色
			border: 1px solid #e5e6eb; // 增加边框
			border-radius: 6px; 
			padding: 0 10px; 
			font-size: 13px; 
			color: $text-primary; 
		}
		.field-textarea { 
			width: 100%; 
			height: 80px; 
			background: #ffffff; // 改为白色
			border: 1px solid #e5e6eb; // 增加边框
			border-radius: 8px; 
			padding: 10px; 
			font-size: 13px; 
			box-sizing: border-box; 
			margin-top: 6px; 
		}
		.ui-radio-box { flex: 1; display: flex; .radio-item { margin-right: 15px; font-size: 13px; display: flex; align-items: center; } }
		.time-picker-group { display: flex; align-items: center; 
			.tp { 
				background: #ffffff; // 改为白色
				border: 1px solid #e5e6eb; // 增加边框
				height: 34px; 
				line-height: 34px; 
				border-radius: 6px; 
				padding: 0 12px; 
				font-size: 13px; 
				text-align: center; 
				min-width: 90px; 
			}
			.ml-5 { margin-left: 8px; }
		}
		.ph { color: #c9cdd4; }
	}

	.field-label-row { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
		.btn-text-add { font-size: 13px; color: $accent; font-weight: 600; padding: 4px 12px; background: rgba($accent, 0.08); border-radius: 4px; }
	}
	
	.tag-cloud-wrapper { width: 100%; min-height: 40px; background: #fbfbfc; border: 1px dashed #e5e6eb; border-radius: 8px; padding: 10px; box-sizing: border-box;
		.tag-placeholder { font-size: 13px; color: $text-tip; text-align: center; line-height: 40px; }
	}

	.tag-cloud {
		display: flex; flex-wrap: wrap; gap: 8px;
		.tag { background: #fff; color: $accent; font-size: 12px; padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; border: 1px solid #adc6ff; box-shadow: 0 2px 4px rgba($accent, 0.05);
			.t-text { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
			.x { margin-left: 8px; font-size: 14px; color: rgba($accent, 0.4); font-weight: bold; }
		}
	}

	.old-part-toggle { display: flex; align-items: center; background: #f7f8fa; padding: 2px 6px; border-radius: 4px; margin-left: 8px;
		.opt-label { font-size: 10px; color: $text-tip; margin-right: 6px; }
		.opt-btns { display: flex; background: #fff; border: 1px solid #eee; border-radius: 4px; overflow: hidden;
			.opt-btn { padding: 4px 8px; font-size: 11px; color: $text-secondary; &.active { background: $accent; color: #fff; font-weight: bold; } }
		}
	}

	.old-part-toggle-full { 
		display: flex; align-items: center; justify-content: space-between; background: #fbfbfc; padding: 10px 12px; border-radius: 8px; border: 1px solid #f0f2f5;
		.opt-label { font-size: 12px; font-weight: 700; color: #4e5969; }
		.opt-btns { display: flex; gap: 10px;
			.opt-btn { 
				display: flex; align-items: center; padding: 6px 16px; border-radius: 6px; font-size: 13px; color: #86909c; background: #fff; border: 1px solid #e5e6eb; transition: all 0.2s;
				.dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; margin-right: 6px; }
				&.active { background: $accent; color: #fff; border-color: $accent; font-weight: 700; box-shadow: 0 2px 8px rgba($accent, 0.2); }
			}
		}
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
		.f-duration-grid { display: flex; justify-content: space-between; gap: 8px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #eee;
			.d-item { flex: 1; display: flex; flex-direction: column; align-items: center;
				.l { font-size: 10px; color: $text-tip; margin-bottom: 4px; }
				.i-box { display: flex; align-items: center; font-size: 11px; color: $text-secondary;
					input { width: 35px; background: #f7f8fa; border: 1px solid #e5e6eb; border-radius: 4px; padding: 2px 4px; margin-right: 2px; text-align: center; color: $text-primary; font-weight: 700; }
				}
			}
		}
		
		.f-inputs { display: flex; gap: 8px; .f-item { flex: 1; background: #fff; border: 1px solid #eee; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: $text-tip; display: flex; justify-content: space-between; input { width: 35px; text-align: right; color: $text-primary; font-weight: 700; } .v { color: $accent; font-weight: 700; } } }
		.f-subtotal { text-align: right; margin-top: 8px; font-size: 12px; font-weight: 700; color: $danger; }
		.f-time-line { background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #eee;
			.time-tag { display: flex; align-items: center; font-size: 12px; margin-bottom: 8px; &:last-child { margin-bottom: 0; }
				.l { color: $text-tip; width: 40px; font-weight: 500; } 
				picker { 
					background: #f7f8fa; 
					border: 1px solid #e5e6eb; 
					padding: 4px 10px; 
					border-radius: 4px; 
					min-width: 85px; 
					text-align: center;
					&.ml-5 { margin-left: 10px; } // 显式增加间距
				}
				.item-input { flex: 1; display: flex; align-items: center; 
					input { width: 45px; background: #f7f8fa; border: 1px solid #e5e6eb; border-radius: 4px; padding: 2px 6px; margin-right: 6px; text-align: center; } 
				}
			}
		}
	}

	// Settlement Panel
	.settlement-panel {
		margin-top: 24px; 
		margin-bottom: 24px; // 显式增加底部间距
		background: #1d2129; 
		border-radius: 12px; 
		padding: 20px; 
		color: #fff;
		.panel-header { font-size: 14px; opacity: 0.6; margin-bottom: 16px; }
		.panel-grid { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(#fff, 0.1); padding-bottom: 12px;
			.p-item { display: flex; flex-direction: column; .l { font-size: 10px; opacity: 0.5; margin-bottom: 2px; } .v { font-size: 13px; font-weight: 700; } }
		}
		.panel-total { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 14px; font-weight: 700; .total-v { font-size: 22px; color: #fffae6; } }
	}

	.payment-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 5px;
		.payment-item { display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e5e6eb; padding: 12px; border-radius: 8px; transition: all 0.2s;
			radio { transform: scale(0.8); margin-right: 4px; }
			.p-text { font-size: 13px; font-weight: 500; color: $text-secondary; }
			&.active { border-color: $accent; background: rgba($accent, 0.02); .p-text { color: $accent; font-weight: 700; } }
		}
	}
	
	.mt-20 { margin-top: 20px !important; }
	.mt-15 { margin-top: 15px; }
	.mt-10 { margin-top: 10px; }
	.mt-8 { margin-top: 8px; }
	.mt-5 { margin-top: 5px; }

	// Action Footer
	.action-footer {
		position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 10px 16px 30px; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); z-index: 100;
		.meta-info { display: flex; justify-content: space-between; margin-bottom: 8px;
			.item { font-size: 10px; .lb { color: $text-tip; margin-right: 4px; } .vl { color: $text-secondary; font-family: monospace; } }
		}
		.btn-primary-main { background: $accent; color: #fff; height: 44px; line-height: 44px; border-radius: 22px; font-size: 15px; font-weight: 700; border: none; box-shadow: 0 6px 16px rgba($accent, 0.3); }
	}

	// Modern Modals
	.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end; backdrop-filter: blur(4px); }
	.modal-body { background: #fff; height: 80vh; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; }
	.modal-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f2f3f5;
		.h-left { display: flex; align-items: center; .t { font-size: 17px; font-weight: 800; } .count { margin-left: 10px; font-size: 11px; background: $accent; color: #fff; padding: 2px 8px; border-radius: 10px; } }
		.c { font-size: 20px; color: #c9cdd4; padding: 4px; }
	}
	.modal-search { padding: 12px 20px; position: relative; display: flex; align-items: center;
		.search-icon { position: absolute; left: 32px; font-size: 14px; color: #86909c; }
		.s-input { flex: 1; background: #f2f3f5; height: 38px; border-radius: 19px; padding: 0 40px; font-size: 14px; }
		.clear-btn { position: absolute; right: 32px; font-size: 18px; color: #c9cdd4; padding: 4px; }
	}
	.modal-scroll { flex: 1; padding: 0 20px; overflow: hidden; }
	
	.cat-item { padding: 16px 0; border-bottom: 1px solid #f2f3f5; display: flex; justify-content: space-between; align-items: center; 
		.c-info { display: flex; align-items: center; .c-title { font-size: 15px; font-weight: 600; } .c-badge { margin-left: 8px; width: 16px; height: 16px; background: #e6f7ff; border: 1px solid #91d5ff; color: $accent; font-size: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; } }
		.a { color: #c9cdd4; font-size: 18px; }
	}
	
	.nav-back-sticky { position: sticky; top: 0; background: #fff; z-index: 10; display: flex; align-items: center; color: $accent; font-weight: 700; padding: 12px 0; border-bottom: 1px solid #f2f3f5; .i { font-size: 24px; margin-right: 4px; } }
	
	.leaf-item { padding: 16px 0; border-bottom: 1px solid #f2f3f5; display: flex; justify-content: space-between; align-items: center;
		.n { font-size: 15px; color: $text-primary; }
		&.active { .n { color: $accent; font-weight: 700; } }
		&.search { .l-content { display: flex; flex-direction: column; .p { font-size: 11px; color: $text-tip; margin-top: 4px; } } }
		.check-box { width: 20px; height: 20px; background: $accent; border-radius: 50%; display: flex; align-items: center; justify-content: center; .check-icon { color: #fff; font-size: 12px; font-weight: bold; } }
	}

	.empty-results { padding: 40px 0; text-align: center; color: $text-tip; font-size: 14px; }

	.modal-footer { padding: 16px 20px 34px; background: #fff; border-top: 1px solid #f2f3f5;
		.selected-summary { margin-bottom: 12px;
			.summary-scroll { width: 100%; white-space: nowrap; }
			.summary-tags { display: flex; gap: 8px;
				.s-tag { display: inline-block; background: #f0f5ff; color: $accent; font-size: 12px; padding: 4px 12px; border-radius: 15px; border: 1px solid #adc6ff; }
			}
		}
		.confirm-btn { background: $accent; color: #fff; border-radius: 22px; height: 44px; line-height: 44px; font-size: 16px; font-weight: 700; }
	}
	
	.nav-back { display: flex; align-items: center; color: $accent; font-weight: 700; padding-bottom: 14px; .i { font-size: 22px; margin-right: 4px; } }
</style>