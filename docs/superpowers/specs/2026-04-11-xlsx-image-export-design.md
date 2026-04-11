# 汇总导出 xlsx 图片内嵌设计方案

## 概述

将汇总导出功能从 Excel 2003 XML（.xls + URL引用图片）升级为真正的 xlsx 格式，在云函数端下载图片并嵌入 Excel 文件。

## 现状

- 格式：`.xls`（Excel 2003 XML），使用 `=IMAGE(url)` 公式引用图片 URL
- 图片不嵌入，文件打开需要联网
- 前端生成 Excel，云函数只返回原始数据

## 目标

- 导出 `.xlsx` 文件
- 图片以二进制形式嵌入 Excel（base64），无需联网即可查看
- 生成逻辑移至云函数端

---

## 改动点

### 1. 云函数 `work-order-manager`

**文件：** `uniCloud-aliyun/cloudfunctions/work-order-manager/index.js`

**新增依赖：** `exceljs`（需在云函数 `package.json` 中添加）

**`export` action 分支逻辑：**

```javascript
// 当 params.format === 'xlsx' 时，走新逻辑
if (params.format === 'xlsx') {
    // 1. 查询数据（复用现有逻辑）
    // 2. 下载图片并转为 base64
    // 3. 用 exceljs 生成 xlsx，嵌入图片
    // 4. 返回 { code: 0, fileName: 'xxx.xlsx', data: <base64字符串> }
} else {
    // 现有逻辑，原样返回数据
}
```

**图片下载：** 使用 `axios` 请求图片 URL，转为 base64。失败时跳过该图片（不阻塞导出）。

**图片嵌入位置（列）：**
- R 列：铭牌照片（platePhoto）
- S 列：现场照片（取第一张，sitePhotos[0]）
- T 列：人机合影（machineUserPhoto）

**图片尺寸：** 单元格宽 15（Excel 列宽单位），高 90px

**返回格式：**
```json
{
  "code": 0,
  "fileName": "服务单汇总_2026-04-11.xlsx",
  "data": "<base64编码的xlsx>"
}
```

### 2. 前端 `pages/work-order/list.vue`

**改动位置：** `exportViaCloudFunction` 和 `generateExcelFromData`

**`exportViaCloudFunction` 改动：**
- 调用云函数时传 `params.format: 'xlsx'`
- 判断返回 `res.result.fileName && res.result.data`（base64 格式）→ 新流程

**新流程（xlsx）：**
```javascript
const fileName = res.result.fileName;
const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
// base64 → ArrayBuffer → 写入文件
const fs = uni.getFileSystemManager();
fs.writeFile({
    filePath,
    data: uni.base64ToArrayBuffer(res.result.data),
    encoding: 'binary',
    success: () => {
        uni.openDocument({ filePath, fileType: 'xlsx', showMenu: true });
    }
});
```

**`generateExcelFromData` 方法：** 保留不动（供其他可能调用处使用）。

---

## 兼容性

- 原 `.xls` 导出逻辑保留，云函数默认仍返回数据，由前端决定是否请求 xlsx 格式
- 无 xlsx 阅读器的旧版 Excel 仍可用原 xls 格式

## 错误处理

- 图片下载失败：跳过该图片，单元格留空
- xlsx 生成失败：返回错误码，前端提示"导出失败"
- 网络超时：单张图片超时 5s 不阻塞整次导出

## 文件编码

- 云函数 → 前端：base64 字符串
- 前端 → 文件系统：binary（ArrayBuffer）
