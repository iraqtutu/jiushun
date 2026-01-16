"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      mobile: "",
      password: ""
    };
  },
  methods: {
    handleLogin() {
      if (!this.mobile || !this.password) {
        common_vendor.index.showToast({
          title: "请填写手机号和密码",
          icon: "none"
        });
        return;
      }
      common_vendor.index.__f__("log", "at pages/login/login.vue:47", "Login attempt", this.mobile);
      common_vendor.index.setStorageSync("userInfo", { mobile: this.mobile, name: "测试用户" });
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    },
    goToApply() {
      common_vendor.index.navigateTo({
        url: "/pages/register/apply"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: $data.mobile,
    c: common_vendor.o(($event) => $data.mobile = $event.detail.value),
    d: $data.password,
    e: common_vendor.o(($event) => $data.password = $event.detail.value),
    f: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    g: common_vendor.o((...args) => $options.goToApply && $options.goToApply(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
