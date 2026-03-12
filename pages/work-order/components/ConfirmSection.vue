<template>
<view class="ui-card" :class="{ 'card-active': !collapsed }">
<view class="card-header" @click="$emit('toggle')">
<view class="header-left">
<text class="header-title">最终确认</text>
<text v-if="isComplete" class="header-status">已上传</text>
</view>
<text class="header-arrow" :class="{ 'arrow-up': !collapsed }"></text>
</view>
<view class="card-body" v-show="!collapsed">
<view class="ui-field column no-border">
<text class="field-label required hmandmachine">人机合影（施工现场及合照）</text>
<view class="photo-uploader large" @click="$emit('choose-image', 'confirm')">
<image v-if="confirm.machineUserPhoto" :src="confirm.machineUserPhoto" mode="aspectFill" class="photo-preview"></image>
<view v-else class="photo-placeholder">
<text class="icon-camera"></text>
<text class="text">拍摄人机合照</text>
</view>
</view>
</view>
</view>
</view>
</template>

<script>
export default {
name: 'ConfirmSection',
props: {
collapsed: { type: Boolean, default: true },
confirm: { type: Object, required: true }
},
emits: ['toggle', 'update:confirm', 'choose-image'],
computed: {
isComplete() {
return !!this.confirm.machineUserPhoto;
}
}
}
</script>
