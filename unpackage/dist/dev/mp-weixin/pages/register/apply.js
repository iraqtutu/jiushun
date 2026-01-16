"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      roles: ["玖顺员工", "经销商人员", "服务人员"],
      formData: {
        name: "",
        mobile: "",
        role: "",
        reason: ""
      }
    };
  },
  methods: {
    onRoleChange(e) {
      this.formData.role = this.roles[e.detail.value];
    },
    submitApply() {
      if (!this.formData.name || !this.formData.mobile || !this.formData.role || !this.formData.reason) {
        common_vendor.index.showToast({
          title: "请填写完整信息",
          icon: "none"
        });
        return;
      }
      common_vendor.index.__f__("log", "at pages/register/apply.vue:61", "Applying:", this.formData);
      common_vendor.index.showLoading({ title: "提交中..." });
      setTimeout(() => {
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          title: "提交成功",
          content: "您的申请已提交，请等待管理员审核。审核通过后即可登录。",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
      }, 1e3);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.formData.name,
    b: common_vendor.o(($event) => $data.formData.name = $event.detail.value),
    c: $data.formData.mobile,
    d: common_vendor.o(($event) => $data.formData.mobile = $event.detail.value),
    e: $data.formData.role
  }, $data.formData.role ? {
    f: common_vendor.t($data.formData.role)
  } : {}, {
    g: $data.roles,
    h: common_vendor.o((...args) => $options.onRoleChange && $options.onRoleChange(...args)),
    i: $data.formData.reason,
    j: common_vendor.o(($event) => $data.formData.reason = $event.detail.value),
    k: common_vendor.o((...args) => $options.submitApply && $options.submitApply(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/apply.js.map
