"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      order: {
        // Mock Data
        orderNo: "JS202601150001",
        creator: "王师傅",
        customerName: "张三",
        phone: "13800138000",
        address: "XX省XX市XX村",
        serviceType: "维修",
        faultCategory: "发动机",
        faultDesc: "发动机启动困难，有异响。",
        handleDesc: "更换了火花塞，清洗了积碳，测试正常。"
      }
    };
  },
  onLoad(options) {
    if (options.id) {
      common_vendor.index.__f__("log", "at pages/work-order/detail.vue:76", "Loading order:", options.id);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.order.orderNo),
    b: common_vendor.t($data.order.creator),
    c: common_vendor.t($data.order.customerName),
    d: common_vendor.t($data.order.phone),
    e: common_vendor.t($data.order.address),
    f: common_vendor.t($data.order.serviceType),
    g: common_vendor.t($data.order.faultCategory),
    h: common_vendor.t($data.order.faultDesc),
    i: common_vendor.t($data.order.handleDesc)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/work-order/detail.js.map
