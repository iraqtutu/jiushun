<template>
<view class="ui-card" :class="{ 'card-active': !collapsed }">
<view class="card-header" @click="$emit('toggle')">
<view class="header-left">
<text class="header-title">服务内容</text>
<text v-if="isComplete" class="header-status">已填写</text>
</view>
<text class="header-arrow" :class="{ 'arrow-up': !collapsed }"></text>
</view>
<view class="card-body" v-show="!collapsed">
<view class="ui-field">
<text class="field-label required">服务类型</text>
<picker :range="serviceTypes" @change="onServiceTypeChange" class="field-picker">
<view class="picker-text">{{ service.type || '请选择' }}</view>
</picker>
</view>
<view class="ui-field">
<text class="field-label required">是否收费</text>
<radio-group @change="onIsChargeableChange" class="ui-radio-box">
<label class="radio-item"><radio value="免费" :checked="service.isChargeable === '免费'" color="#52c41a" />免费</label>
<label class="radio-item"><radio value="收费" :checked="service.isChargeable === '收费'" color="#ff4d4f" />收费</label>
</radio-group>
</view>
<view class="ui-field column">
<view class="fault-field-header">
<text class="field-label required">故障分类</text>
<view class="btn-add-fault" @click="$emit('open-fault-picker')">+ 添加分类</view>
</view>
<view class="fault-tags" v-if="service.faultCategories && service.faultCategories.length > 0">
<view v-for="(tag, idx) in service.faultCategories" :key="idx" class="fault-tag">
<text class="tag-text">{{ tag }}</text>
<text class="tag-del" @click.stop="removeFaultTag(idx)">×</text>
</view>
</view>
<view class="fault-empty-tip" v-else @click="$emit('open-fault-picker')">点击添加故障分类</view>
</view>
<view class="ui-field column">
<text class="field-label required">故障现象</text>
<textarea class="field-textarea" :value="service.faultDesc" @input="onField('faultDesc', $event.detail.value)" placeholder="简述故障表现..." placeholder-class="ph" />
</view>
<view class="ui-field column">
<text class="field-label required">处理方法</text>
<textarea class="field-textarea" :value="service.handleDesc" @input="onField('handleDesc', $event.detail.value)" placeholder="简述维修过程..." placeholder-class="ph" />
</view>

<!-- Parts Detail -->
<view class="ui-field column no-border">
<view class="list-header">
<text class="list-title">更换零件明细</text>
<view class="btn-text-add" @click="addPart">+ 新增</view>
</view>

<view v-for="(part, idx) in service.parts" :key="idx" class="part-entry">
<text class="btn-remove-absolute" @click="removePart(idx)">×</text>
<view class="entry-row">
<input :value="part.name" @input="updatePart(idx, 'name', $event.detail.value)" placeholder="零件名称" class="input-name" placeholder-class="ph" />
</view>
<view class="entry-row mt-8">
<input :value="part.code" @input="updatePart(idx, 'code', $event.detail.value)" placeholder="图号/编码" class="input-code" placeholder-class="ph" />
<view class="source-picker-inline">
<text class="s-label">来源</text>
<picker :range="partSources" @change="onPartSourceChange($event, idx)" class="s-picker">
<view class="s-value">{{ part.source || '选择来源' }}</view>
</picker>
</view>
</view>
<view class="part-ext-row" v-if="part.source === '其他'">
<text class="ext-label required">来源备注</text>
<input :value="part.sourceRemark" @input="updatePart(idx, 'sourceRemark', $event.detail.value)" placeholder="请输入具体来源说明" class="input-remark" placeholder-class="ph-warning" />
</view>
<view class="entry-row mt-10 flex-align-center">
<view class="entry-stepper-wrapper">
<text class="st-label">数量</text>
<view class="entry-stepper">
<text class="s-btn" @click.stop="updatePartCount(idx, -1)">-</text>
<text class="s-num">{{ part.count }}</text>
<text class="s-btn" @click.stop="updatePartCount(idx, 1)">+</text>
</view>
</view>
<view class="entry-bottom-inline" v-if="service.isChargeable === '收费'">
<view class="price-box-small">
<text class="p-label">单价</text>
<input type="digit" :value="part.price" @input="updatePart(idx, 'price', $event.detail.value)" class="p-val" />
</view>
<view class="price-box-small ml-10">
<text class="p-label">小计</text>
<text class="p-total-val">￥{{ ((Number(part.price) || 0) * (part.count || 0)).toFixed(1) }}</text>
</view>
</view>
</view>
<view class="old-part-row">
<text class="old-part-label">旧件处理</text>
<view class="old-part-options">
<view class="old-part-btn" :class="{ active: part.oldPartAction === '带回' }" @click.stop="updatePart(idx, 'oldPartAction', '带回')">
<text>带回</text>
</view>
<view class="old-part-btn danger" :class="{ active: part.oldPartAction === '抛弃' }" @click.stop="updatePart(idx, 'oldPartAction', '抛弃')">
<text>抛弃</text>
</view>
</view>
</view>
</view>
<view class="list-summary" v-if="service.isChargeable === '收费' && service.parts.length > 0">
<text>零件费用小计</text>
<text class="v">￥{{ partsTotal }}</text>
</view>
</view>

<view class="ui-field column">
<text class="field-label required">现场照片</text>
<view class="grid-uploader">
<view class="grid-add" @click="$emit('choose-image', 'site')">
<text class="icon">+</text>
</view>
<view v-for="(img, idx) in service.sitePhotos" :key="idx" class="grid-item">
<image :src="img" class="img" mode="aspectFill" @click="$emit('preview-image', img)"></image>
<text class="btn-del" @click.stop="removeSitePhoto(idx)">×</text>
</view>
</view>
</view>

<view class="ui-field" v-if="service.isChargeable !== '收费'">
<text class="field-label required">完成时间</text>
<view class="time-picker-group">
<picker mode="date" @change="onFinishDateChange" class="tp"><view>{{ service.finishDate }}</view></picker>
<picker mode="time" @change="onFinishTimeChange" class="tp ml-5"><view>{{ service.finishTime || '00:00' }}</view></picker>
</view>
</view>
</view>
</view>
</template>

<script>
export default {
name: 'ServiceSection',
props: {
collapsed: { type: Boolean, default: true },
service: { type: Object, required: true },
partsTotal: { type: String, required: true },
serviceTypes: { type: Array, required: true },
partSources: { type: Array, required: true }
},
emits: ['toggle', 'update:service', 'open-fault-picker', 'choose-image', 'preview-image'],
computed: {
isComplete() {
const s = this.service;
if (!(s.type && s.faultCategories && s.faultCategories.length > 0 && s.sitePhotos && s.sitePhotos.length > 0)) return false;
for (const part of (s.parts || [])) {
if (part.source === '其他' && !part.sourceRemark) return false;
}
return true;
}
},
methods: {
onField(key, value) {
this.$emit('update:service', { ...this.service, [key]: value });
},
onServiceTypeChange(e) {
this.onField('type', this.serviceTypes[e.detail.value]);
},
onIsChargeableChange(e) {
this.onField('isChargeable', e.detail.value);
},
onFinishDateChange(e) {
this.onField('finishDate', e.detail.value);
},
onFinishTimeChange(e) {
this.onField('finishTime', e.detail.value);
},
removeFaultTag(idx) {
const arr = [...this.service.faultCategories];
arr.splice(idx, 1);
this.onField('faultCategories', arr);
},
addPart() {
const parts = [...(this.service.parts || [])];
parts.push({ name: '', code: '', count: 1, oldPartAction: '带回', source: '自带', price: 0 });
this.onField('parts', parts);
},
updatePart(idx, key, value) {
const parts = [...this.service.parts];
parts[idx] = { ...parts[idx], [key]: value };
this.onField('parts', parts);
},
updatePartCount(idx, d) {
const parts = [...this.service.parts];
const newCount = parts[idx].count + d;
if (newCount >= 1) {
parts[idx] = { ...parts[idx], count: newCount };
this.onField('parts', parts);
}
},
onPartSourceChange(e, idx) {
this.updatePart(idx, 'source', this.partSources[e.detail.value]);
},
removePart(idx) {
uni.showModal({
title: '确认删除',
content: `是否确定删除第 ${idx + 1} 项零件？`,
success: (res) => {
if (res.confirm) {
const parts = [...this.service.parts];
parts.splice(idx, 1);
this.onField('parts', parts);
}
}
});
},
removeSitePhoto(idx) {
const photos = [...this.service.sitePhotos];
photos.splice(idx, 1);
this.onField('sitePhotos', photos);
}
}
}
</script>
