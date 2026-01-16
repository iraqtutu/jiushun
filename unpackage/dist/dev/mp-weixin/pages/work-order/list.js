"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      list: [
        // Mock Data
        {
          id: "1",
          orderNo: "JS202601150001",
          customerName: "张三",
          serviceType: "维修",
          machineNo: "JN-888-999",
          submitTime: "2026-01-15 10:30"
        },
        {
          id: "2",
          orderNo: "JS202601150002",
          customerName: "李四",
          serviceType: "保养",
          machineNo: "JN-777-666",
          submitTime: "2026-01-14 15:20"
        }
      ]
    };
  },
  onLoad() {
  },
  methods: {
    goToDetail(item) {
      common_vendor.index.navigateTo({
        url: `/pages/work-order/detail?id=${item.id}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: common_vendor.t(item.orderNo),
        b: common_vendor.t(item.customerName),
        c: common_vendor.t(item.serviceType),
        d: common_vendor.t(item.machineNo),
        e: common_vendor.t(item.submitTime),
        f: index,
        g: common_vendor.o(($event) => $options.goToDetail(item), index)
      };
    }),
    b: $data.list.length === 0
  }, $data.list.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/work-order/list.js.map
