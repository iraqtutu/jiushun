<template>
<view class="ui-card" :class="{ 'card-active': !collapsed }">
<view class="card-header" @click="$emit('toggle')">
<view class="header-left">
<text class="header-title">产品信息</text>
<text v-if="isComplete" class="header-status">已录入</text>
</view>
<text class="header-arrow" :class="{ 'arrow-up': !collapsed }"></text>
</view>
<view class="card-body" v-show="!collapsed">
<view class="ui-field">
<text class="field-label required">机器编号</text>
<input class="field-input" :value="product.machineNo" @input="onField('machineNo', $event.detail.value)" placeholder="请输入机器编号" placeholder-class="ph" />
</view>
<view class="ui-field">
<text class="field-label required">发动机号</text>
<input class="field-input" :value="product.engineNo" @input="onField('engineNo', $event.detail.value)" placeholder="请输入发动机号" placeholder-class="ph" />
</view>
<view class="ui-field">
<text class="field-label required">生产日期</text>
<picker mode="date" @change="onDateChange" class="field-picker">
<view class="picker-text">{{ product.productionDate || '选择日期' }}</view>
</picker>
</view>
<view class="ui-field column">
<text class="field-label required">铭牌照片</text>
<view class="photo-uploader" @click="$emit('choose-image', 'plate')">
<image v-if="product.platePhoto" :src="product.platePhoto" mode="aspectFill" class="photo-preview"></image>
<view v-else class="photo-placeholder">
<text class="icon-camera"></text>
<text class="text">上传铭牌照片</text>
</view>
</view>
</view>
<view class="ui-field">
<text class="field-label required">产品型号</text>
<input class="field-input" :value="product.model" @input="onField('model', $event.detail.value)" placeholder="输入产品型号" placeholder-class="ph" />
</view>
</view>
</view>
</template>

<script>
export default {
name: 'ProductSection',
props: {
collapsed: { type: Boolean, default: true },
product: { type: Object, required: true }
},
emits: ['toggle', 'update:product', 'choose-image'],
computed: {
isComplete() {
return !!(this.product.machineNo && this.product.platePhoto);
}
},
methods: {
onField(key, value) {
this.$emit('update:product', { ...this.product, [key]: value });
},
onDateChange(e) {
this.$emit('update:product', { ...this.product, productionDate: e.detail.value });
}
}
}
</script>
