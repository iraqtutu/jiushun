<template>
	<view class="ui-card" :class="{ 'card-active': !collapsed }">
		<view class="card-header" @click="$emit('toggle')">
			<view class="header-left">
				<text class="header-title">客户资料</text>
				<text v-if="isComplete" class="header-status">已完善</text>
			</view>
			<text class="header-arrow" :class="{ 'arrow-up': !collapsed }"></text>
		</view>
		<view class="card-body" v-show="!collapsed">
			<view class="ui-field">
				<text class="field-label required">姓名</text>
				<input class="field-input" :value="customer.name" @input="onField('name', $event.detail.value)" placeholder="输入客户姓名" placeholder-class="ph" />
			</view>
			<view class="ui-field">
				<text class="field-label required">电话</text>
				<input class="field-input" type="number" :value="customer.phone" @input="onField('phone', $event.detail.value)" placeholder="输入联系电话" maxlength="11" placeholder-class="ph" />
			</view>
			<view class="ui-field">
				<text class="field-label required">地址</text>
				<input class="field-input" :value="customer.address" @input="onField('address', $event.detail.value)" placeholder="输入详细地址" placeholder-class="ph" />
			</view>
			<view class="ui-field">
				<text class="field-label required">农机用途</text>
				<radio-group @change="onUsageChange" class="ui-radio-box">
					<label class="radio-item"><radio value="自用" :checked="customer.usageType === '自用'" color="#1677ff" />自用</label>
					<label class="radio-item"><radio value="作业" :checked="customer.usageType === '作业'" color="#1677ff" />作业</label>
				</radio-group>
			</view>
			<view class="ui-field">
				<text class="field-label">经销商</text>
				<input class="field-input" :value="customer.distributorName" @input="onField('distributorName', $event.detail.value)" placeholder="经销商名称（选填）" placeholder-class="ph" />
			</view>
			<view class="ui-field">
				<text class="field-label required">报修时间</text>
				<picker mode="date" @change="onReportDateChange" class="field-picker">
					<view class="picker-text">{{ customer.reportTime }}</view>
				</picker>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CustomerSection',
	props: {
		collapsed: { type: Boolean, default: false },
		customer: { type: Object, required: true }
	},
	emits: ['toggle', 'update:customer'],
	computed: {
		isComplete() {
			return !!(this.customer.name && this.customer.phone && this.customer.address);
		}
	},
	methods: {
		onField(key, value) {
			this.$emit('update:customer', { ...this.customer, [key]: value });
		},
		onUsageChange(e) {
			this.$emit('update:customer', { ...this.customer, usageType: e.detail.value });
		},
		onReportDateChange(e) {
			this.$emit('update:customer', { ...this.customer, reportTime: e.detail.value });
		}
	}
}
</script>
