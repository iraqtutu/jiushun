<template>
<view class="ui-card" v-if="service.isChargeable === '收费'" :class="{ 'card-active': !collapsed }">
<view class="card-header" @click="$emit('toggle')">
<view class="header-left">
<text class="header-title">附加费用</text>
</view>
<text class="header-arrow" :class="{ 'arrow-up': !collapsed }"></text>
</view>
<view class="card-body" v-show="!collapsed">
<view class="fee-card">
<text class="f-title">路程费核算</text>
<view class="f-inputs">
<view class="f-item">里程<input type="digit" :value="fees.travelFee.distance" @input="updateTravel('distance', $event.detail.value)" />km</view>
<view class="f-item">单价<input type="digit" :value="fees.travelFee.unitPrice" @input="updateTravel('unitPrice', $event.detail.value)" />元</view>
</view>
<text class="f-subtotal">合计: ￥{{ travelTotal }}</text>
</view>

<view class="fee-card mt-15">
<text class="f-title">工时费核算</text>
<view class="f-time-line">
<view class="time-tag">
<text class="l">出发时间</text>
<picker mode="date" @change="updateLabor('departureDate', $event.detail.value)"><text>{{ fees.laborFee.departureDate }}</text></picker>
<picker mode="time" @change="updateLabor('departureTime', $event.detail.value)" class="ml-5"><text>{{ fees.laborFee.departureTime }}</text></picker>
</view>
<view class="time-tag mt-5">
<text class="l">服务结束</text>
<picker mode="date" @change="updateLabor('serviceEndDate', $event.detail.value)"><text>{{ fees.laborFee.serviceEndDate }}</text></picker>
<picker mode="time" @change="updateLabor('serviceEndTime', $event.detail.value)" class="ml-5"><text>{{ fees.laborFee.serviceEndTime }}</text></picker>
</view>
<view class="time-tag mt-5">
<text class="l">返程时间</text>
<view class="item-input"><input type="number" :value="fees.laborFee.returnDuration" @input="updateLabor('returnDuration', $event.detail.value)" /> min</view>
</view>
</view>
<view class="f-inputs mt-10">
<view class="f-item">总时长<text class="v">{{ laborHours }} h</text></view>
<view class="f-item">单价<input type="digit" :value="fees.laborFee.unitPrice" @input="updateLabor('unitPrice', $event.detail.value)" />元</view>
</view>
<text class="f-subtotal">合计: ￥{{ laborTotal }}</text>
</view>
</view>
</view>
</template>

<script>
export default {
name: 'FeesSection',
props: {
collapsed: { type: Boolean, default: true },
fees: { type: Object, required: true },
service: { type: Object, required: true },
travelTotal: { type: String, required: true },
laborHours: { type: String, required: true },
laborTotal: { type: String, required: true }
},
emits: ['toggle', 'update:fees'],
methods: {
updateTravel(key, value) {
this.$emit('update:fees', {
...this.fees,
travelFee: { ...this.fees.travelFee, [key]: value }
});
},
updateLabor(key, value) {
this.$emit('update:fees', {
...this.fees,
laborFee: { ...this.fees.laborFee, [key]: value }
});
}
}
}
</script>
