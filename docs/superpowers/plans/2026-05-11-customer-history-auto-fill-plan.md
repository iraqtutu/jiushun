# 客户历史服务单自动填写功能 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造新建服务单页面的自动填写逻辑，支持按机器编号去重后的单条自动填入或多条卡片选择

**Architecture:**
- 云函数新增 `searchCustomerHistory` action，按客户姓名搜索历史记录并返回所有匹配项（含产品信息）
- 前端 `create.vue` 重构 `autoFillCustomerInfo`，根据返回记录数量决定是直接填入还是弹出卡片列表

**Tech Stack:** uniCloud、云函数、Vue 组件、uni-app

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `uniCloud-aliyun/cloudfunctions/work-order-manager/index.js` | 新增 `searchCustomerHistory` action |
| `pages/work-order/create.vue` | 重构自动填写逻辑 + 新增卡片选择弹窗 |

---

## 任务清单

### Task 1: 云函数新增 `searchCustomerHistory` action

**Files:**
- Modify: `uniCloud-aliyun/cloudfunctions/work-order-manager/index.js`（在 `getCustomerHistory` action 下方添加新 action）

- [ ] **Step 1: 在 index.js 中添加新 action**

在 `getCustomerHistory` action 结束后（约第696行之后），添加新 action：

```javascript
// Action: Search Customer History (for multi-record auto-fill)
if (action === 'searchCustomerHistory') {
    const { customerName } = params
    if (!customerName || customerName.length < 2) {
        return { code: 0, data: [] }
    }

    // Find all orders for this customer with product info
    const res = await db.collection('jiushun-work-orders')
        .where({
            'customer.name': customerName
        })
        .orderBy('create_date', 'desc')
        .field({
            customer: true,
            product: true,
            create_date: true
        })
        .get()

    if (res.data.length === 0) {
        return { code: 0, data: [] }
    }

    // Map to simplified structure for auto-fill
    const records = res.data.map(item => ({
        name: item.customer?.name || '',
        phone: item.customer?.phone || '',
        address: item.customer?.address || '',
        usageType: item.customer?.usageType || '自用',
        distributorName: item.customer?.distributorName || '',
        machineNo: item.product?.machineNo || '',
        engineNo: item.product?.engineNo || '',
        productionDate: item.product?.productionDate || null,
        platePhoto: item.product?.platePhoto || '',
        create_date: item.create_date || 0
    }))

    return { code: 0, data: records }
}
```

- [ ] **Step 2: Commit**

```bash
git add uniCloud-aliyun/cloudfunctions/work-order-manager/index.js
git commit -m "feat(work-order): 新增 searchCustomerHistory action 支持多记录查询"
```

---

### Task 2: 前端重构 `autoFillCustomerInfo` 方法

**Files:**
- Modify: `pages/work-order/create.vue`

- [ ] **Step 1: 在 data 中添加弹窗相关状态**

在 `data()` return 中找到 `showFaultPicker: false` 的位置，在其后添加：

```javascript
showCustomerPicker: false,
customerHistoryRecords: [],
```

- [ ] **Step 2: 重构 `autoFillCustomerInfo` 方法**

替换现有的 `autoFillCustomerInfo` 方法（约在第678-710行）为：

```javascript
async autoFillCustomerInfo(customerName) {
    if (!customerName || customerName.length < 2 || this.isEditMode) {
        return
    }

    try {
        const res = await uniCloud.callFunction({
            name: 'work-order-manager',
            data: {
                action: 'searchCustomerHistory',
                params: { customerName }
            }
        })

        if (res.result.code === 0 && res.result.data && res.result.data.length > 0) {
            const records = res.result.data

            // 按 machineNo 去重，每组取第一条（已是最新）
            const uniqueMap = {}
            const deduped = []
            for (const record of records) {
                const key = record.machineNo || '__empty__'
                if (!uniqueMap[key]) {
                    uniqueMap[key] = true
                    deduped.push(record)
                }
            }

            this.customerHistoryRecords = deduped

            if (deduped.length === 1) {
                // 单条记录：直接自动填入
                this.fillCustomerForm(deduped[0], false)
            } else {
                // 多条记录：弹出卡片列表
                this.showCustomerPicker = true
            }
        }
    } catch (e) {
        console.error('自动填充客户信息失败:', e)
    }
},

fillCustomerForm(record, useHistory) {
    // 填充客户资料区域
    const customer = this.formData.customer
    if (!customer.phone && record.phone) customer.phone = record.phone
    if (!customer.address && record.address) customer.address = record.address
    if (!customer.usageType && record.usageType) customer.usageType = record.usageType
    if (!customer.distributorName && record.distributorName) customer.distributorName = record.distributorName

    // 填充产品信息区域
    const product = this.formData.product
    if (useHistory) {
        // 从历史选择时，填入所有字段
        if (record.machineNo) product.machineNo = record.machineNo
        if (record.engineNo) product.engineNo = record.engineNo
        if (record.productionDate) {
            const d = new Date(record.productionDate)
            product.productionDate = d.toISOString().slice(0, 10)
        }
        if (record.platePhoto) product.platePhoto = record.platePhoto
    } else {
        // 单条自动填入时，也填入产品字段
        if (record.machineNo) product.machineNo = record.machineNo
        if (record.engineNo) product.engineNo = record.engineNo
        if (record.productionDate) {
            const d = new Date(record.productionDate)
            product.productionDate = d.toISOString().slice(0, 10)
        }
        if (record.platePhoto) product.platePhoto = record.platePhoto
    }

    // 关闭选择弹窗
    this.showCustomerPicker = false
},

selectCustomerRecord(record) {
    this.fillCustomerForm(record, true)
},

closeCustomerPicker() {
    this.showCustomerPicker = false
},
```

- [ ] **Step 3: 在模板中添加卡片选择弹窗**

在 `create.vue` 模板中找到 `<!-- Fault Picker Modal -->`（约在429行之前），在其前添加客户选择弹窗：

```html
<!-- Customer History Picker Modal -->
<view class="modal-mask" v-if="showCustomerPicker" @click.stop="closeCustomerPicker">
    <view class="modal-body customer-picker" @click.stop="">
        <view class="modal-header">
            <view class="h-left">
                <text class="t">选择历史记录</text>
                <text class="count" v-if="customerHistoryRecords.length > 0">{{ customerHistoryRecords.length }}条记录</text>
            </view>
            <text class="c" @click="closeCustomerPicker">✕</text>
        </view>

        <scroll-view scroll-y class="modal-scroll">
            <view v-for="(record, idx) in customerHistoryRecords" :key="idx"
                class="customer-record-card"
                @click="selectCustomerRecord(record)">
                <view class="card-row">
                    <text class="cr-name">{{ record.name }}</text>
                    <text class="cr-phone">{{ record.phone || '无电话' }}</text>
                </view>
                <view class="card-row">
                    <text class="cr-address">{{ record.address || '无地址' }}</text>
                </view>
                <view class="card-divider"></view>
                <view class="card-row">
                    <view class="cr-tag" :class="{ 'self': record.usageType === '自用' }">
                        {{ record.usageType || '自用' }}
                    </view>
                    <text class="cr-distributor">{{ record.distributorName || '无经销商' }}</text>
                </view>
                <view class="card-divider"></view>
                <view class="card-row">
                    <view class="cr-field">
                        <text class="cr-label">机器编号</text>
                        <text class="cr-value">{{ record.machineNo || '无' }}</text>
                    </view>
                    <view class="cr-field">
                        <text class="cr-label">发动机号</text>
                        <text class="cr-value">{{ record.engineNo || '无' }}</text>
                    </view>
                </view>
                <view class="card-row">
                    <view class="cr-field">
                        <text class="cr-label">生产日期</text>
                        <text class="cr-value">{{ formatDate(record.productionDate) }}</text>
                    </view>
                </view>
                <view class="card-photo" v-if="record.platePhoto">
                    <text class="cr-label">铭牌照片</text>
                    <image :src="record.platePhoto" mode="aspectFill" class="cr-img" @click.stop="previewImg(record.platePhoto)"></image>
                </view>
            </view>
        </scroll-view>

        <view class="modal-footer">
            <button class="cancel-btn" @click="closeCustomerPicker">放弃选择</button>
        </view>
    </view>
</view>
```

- [ ] **Step 4: 添加样式**

在 `<style lang="scss">` 中找到 `.modal-mask` 相关样式，在其后添加客户选择弹窗样式：

```scss
// Customer History Picker Modal
.customer-picker {
    .modal-scroll {
        padding: 0 20px;
    }
}

.customer-record-card {
    background: #f7f8fa;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #e5e6eb;
    .card-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }
    .card-divider {
        height: 1px;
        background: #e5e6eb;
        margin: 12px 0;
    }
    .cr-name {
        font-size: 16px;
        font-weight: 700;
        color: #1d2129;
        margin-right: 12px;
    }
    .cr-phone {
        font-size: 13px;
        color: #4e5969;
    }
    .cr-address {
        font-size: 13px;
        color: #86909c;
        width: 100%;
    }
    .cr-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: #fff;
        color: #4e5969;
        border: 1px solid #e5e6eb;
        margin-right: 8px;
        &.self {
            background: #e6f7ff;
            color: #1677ff;
            border-color: #91d5ff;
        }
    }
    .cr-distributor {
        font-size: 12px;
        color: #86909c;
    }
    .cr-field {
        display: flex;
        align-items: center;
        margin-right: 20px;
        margin-bottom: 6px;
    }
    .cr-label {
        font-size: 11px;
        color: #86909c;
        margin-right: 6px;
    }
    .cr-value {
        font-size: 12px;
        color: #1d2129;
        font-weight: 600;
    }
    .card-photo {
        margin-top: 8px;
        .cr-label {
            display: block;
            margin-bottom: 6px;
        }
    }
    .cr-img {
        width: 80px;
        height: 60px;
        border-radius: 6px;
        border: 1px solid #e5e6eb;
    }
}

.cancel-btn {
    background: #f2f3f5;
    color: #4e5969;
    border-radius: 22px;
    height: 44px;
    line-height: 44px;
    font-size: 15px;
    font-weight: 600;
    border: none;
}
```

- [ ] **Step 5: 添加 formatDate 辅助方法**

在 `methods` 中找到 `formatTimeStamp` 方法（约在779行），在其后添加：

```javascript
formatDate(timestamp) {
    if (!timestamp) return '无'
    const d = new Date(timestamp)
    return d.toISOString().slice(0, 10)
},
```

- [ ] **Step 6: Commit**

```bash
git add pages/work-order/create.vue
git commit -m "feat(work-order): 重构客户信息自动填写逻辑，支持多记录卡片选择"
```

---

## 验证方式

1. 手动测试：进入新建服务单页面，输入有历史记录的姓名
   - 单条记录：应自动填入所有字段
   - 多条记录：应弹出卡片列表，选择后填入，取消后保留姓名

2. 云函数测试：在 HBuilderX 中调用云函数，传入 customerName 参数，验证返回数据结构