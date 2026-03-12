<template>
<view class="modal-mask" v-if="visible" @click.stop="$emit('close')">
<view class="modal-body" @click.stop="">
<view class="modal-header">
<text class="t">选择故障分类（可多选）</text>
<text class="c" @click="$emit('close')">✕</text>
</view>
<view class="modal-search">
<input :value="searchKey" @input="searchKey = $event.detail.value" placeholder="搜索关键字..." class="s-input" />
</view>
<!-- 已选预览栏 -->
<view class="modal-selected-bar" v-if="pending.length > 0">
<scroll-view scroll-x class="bar-scroll">
<view class="bar-tags">
<view v-for="(tag, idx) in pending" :key="idx" class="bar-tag">
<text>{{ tag }}</text>
<text class="bar-tag-del" @click.stop="removeTag(idx)">×</text>
</view>
</view>
</scroll-view>
</view>
<scroll-view scroll-y class="modal-scroll">
<block v-if="searchKey">
<view v-for="(item, idx) in searchResults" :key="idx"
class="leaf-item search"
:class="{ 'leaf-selected': isSelected(item.name, item.parent) }"
@click="toggleLeaf(item.name, item.parent)">
<view class="leaf-main">
<text class="n">{{ item.name }}</text>
<text class="p">{{ item.parent }}</text>
</view>
<text class="leaf-check" v-if="isSelected(item.name, item.parent)">✓</text>
</view>
</block>
<block v-else-if="!activeCat">
<view v-for="(cat, idx) in faultTree" :key="idx" class="cat-item" @click="activeCat = cat">
<view class="cat-left">
<text>{{ cat.title }}</text>
<text class="cat-count" v-if="getCatCount(cat) > 0">已选{{ getCatCount(cat) }}项</text>
</view>
<text class="a">›</text>
</view>
</block>
<block v-else>
<view class="nav-back" @click="activeCat = null">
<text class="i">‹</text><text>{{ activeCat.title }}</text>
</view>
<view v-for="(leaf, idx) in activeCat.children" :key="idx"
class="leaf-item"
:class="{ 'leaf-selected': isSelected(leaf, activeCat.title) }"
@click="toggleLeaf(leaf, activeCat.title)">
<text class="leaf-name">{{ leaf }}</text>
<text class="leaf-check" v-if="isSelected(leaf, activeCat.title)">✓</text>
</view>
</block>
</scroll-view>
<!-- 底部确认栏 -->
<view class="modal-footer">
<text class="footer-count">已选 {{ pending.length }} 项</text>
<view class="btn-confirm" @click="confirm">确 认</view>
</view>
</view>
</view>
</template>

<script>
const FAULT_TREE = [
{ title: "动力系统", children: ["发动机", "启动马达", "发电机", "高原模块", "熄火电磁阀", "高温", "防冻液、水管等冷却系", "动力传递相关（包含行走皮带、主从皮带轮、涨紧装置等）"] },
{ title: "行走、传动系统", children: ["前桥", "后桥", "变速箱", "行走传动轴", "车轮", "底盘", "主变速", "刹车", "悬架"] },
{ title: "液压系统", children: ["各类液压油管", "HST", "齿轮泵", "转向器", "液压阀", "升降油缸", "液压油滤清器"] },
{ title: "电气系统", children: ["主线束", "启动开关", "水平旋钮", "仪表盘", "组合开关", "蜂鸣器", "安全开关", "水平传感器", "水平电机", "缺苗报警器", "大灯", "保险丝", "GPS", "电子燃油泵", "电瓶"] },
{ title: "供油系统", children: ["燃油管", "燃油箱", "燃油滤清器", "燃油油水分离器"] },
{ title: "插植系统", children: ["插植臂", "旋转箱", "插秧箱", "喂入箱", "苗箱", "导轨", "浮体支架", "取苗连杆", "感应拉线", "拖沟", "插秧质量", "插秧传动轴", "浮板"] },
{ title: "拉线类", children: ["手油门拉线", "脚油门拉线", "倒车上升拉线", "划线杆拉线", "分组拉线"] },
{ title: "其他类", children: ["以上内容以外的所有项目"] }
];
export default {
name: 'FaultPickerModal',
props: {
visible: { type: Boolean, default: false },
selected: { type: Array, default: () => [] }
},
emits: ['close', 'confirm'],
data() {
return {
faultTree: FAULT_TREE,
searchKey: '',
activeCat: null,
pending: []
};
},
watch: {
visible(val) {
if (val) {
this.pending = [...this.selected];
this.activeCat = null;
this.searchKey = '';
}
}
},
computed: {
searchResults() {
if (!this.searchKey) return [];
const res = [];
const key = this.searchKey.toLowerCase();
this.faultTree.forEach(cat => {
cat.children.forEach(leaf => {
if (leaf.toLowerCase().indexOf(key) !== -1) res.push({ name: leaf, parent: cat.title });
});
});
return res;
}
},
methods: {
isSelected(leaf, parent) {
return this.pending.indexOf(parent ? `${parent}-${leaf}` : leaf) !== -1;
},
getCatCount(cat) {
return cat.children.filter(leaf => this.isSelected(leaf, cat.title)).length;
},
toggleLeaf(leaf, parent) {
const key = parent ? `${parent}-${leaf}` : leaf;
const idx = this.pending.indexOf(key);
if (idx !== -1) this.pending.splice(idx, 1);
else this.pending.push(key);
},
removeTag(idx) {
this.pending.splice(idx, 1);
},
confirm() {
if (this.pending.length === 0) {
uni.showToast({ title: '请至少选择一个故障分类', icon: 'none' });
return;
}
this.$emit('confirm', [...this.pending]);
}
}
}
</script>
