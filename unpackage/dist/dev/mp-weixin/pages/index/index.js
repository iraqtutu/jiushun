"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userName: "用户"
    };
  },
  onShow() {
    const userInfo = common_vendor.index.getStorageSync("userInfo");
    if (userInfo && userInfo.name) {
      this.userName = userInfo.name;
    }
  },
  methods: {
    navTo(url) {
      common_vendor.index.navigateTo({ url });
    },
    handleLogout() {
      common_vendor.index.removeStorageSync("userInfo");
      common_vendor.index.reLaunch({
        url: "/pages/login/login"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.userName),
    b: common_vendor.o(($event) => $options.navTo("/pages/work-order/create")),
    c: common_vendor.o(($event) => $options.navTo("/pages/work-order/list")),
    d: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
