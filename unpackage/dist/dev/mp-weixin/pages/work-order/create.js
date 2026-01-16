"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentUser: "",
      serviceTypes: ["三包", "维修", "保养", "技改", "其他"],
      faultCategories: ["发动机", "液压系统", "行走传动系统", "电气系统", "插值系统", "其他"],
      formData: {
        orderNo: "",
        // Auto-gen
        customer: {
          name: "",
          phone: "",
          address: "",
          usageType: "自用",
          distributorName: ""
        },
        product: {
          machineNo: "",
          engineNo: "",
          productionDate: "",
          platePhoto: "",
          model: ""
        },
        service: {
          type: "",
          faultCategory: "",
          faultDesc: "",
          handleDesc: "",
          parts: [],
          sitePhotos: []
        },
        confirm: {
          machineUserPhoto: ""
        }
      }
    };
  },
  onLoad() {
    const userInfo = common_vendor.index.getStorageSync("userInfo");
    this.currentUser = userInfo ? userInfo.name : "未知用户";
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    this.formData.orderNo = "JS" + dateStr + Math.floor(Math.random() * 1e3);
    this.checkDraft();
  },
  onUnload() {
    this.saveDraft();
  },
  methods: {
    checkDraft() {
      const draft = common_vendor.index.getStorageSync("order_draft");
      if (draft) {
        common_vendor.index.showModal({
          title: "发现草稿",
          content: "是否恢复上次未提交的草稿？",
          success: (res) => {
            if (res.confirm) {
              this.formData = draft;
            } else {
              common_vendor.index.removeStorageSync("order_draft");
            }
          }
        });
      }
    },
    saveDraft() {
      if (this.formData.customer.name) {
        common_vendor.index.setStorageSync("order_draft", this.formData);
      }
    },
    onUsageChange(e) {
      this.formData.customer.usageType = e.detail.value;
    },
    onDateChange(e) {
      this.formData.product.productionDate = e.detail.value;
    },
    onServiceTypeChange(e) {
      this.formData.service.type = this.serviceTypes[e.detail.value];
    },
    onFaultCatChange(e) {
      this.formData.service.faultCategory = this.faultCategories[e.detail.value];
    },
    addPart() {
      this.formData.service.parts.push({ name: "", count: 1 });
    },
    chooseImage(type) {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          const path = res.tempFilePaths[0];
          if (type === "plate") {
            this.formData.product.platePhoto = path;
            common_vendor.index.showToast({ title: "正在识别...", icon: "loading" });
            setTimeout(() => {
              this.formData.product.model = "OCR-Model-X100";
              common_vendor.index.hideToast();
            }, 1e3);
          } else if (type === "confirm") {
            this.formData.confirm.machineUserPhoto = path;
          } else if (type === "site") {
            this.formData.service.sitePhotos.push(path);
          }
        }
      });
    },
    submitOrder() {
      if (!this.formData.customer.name || !this.formData.product.machineNo) {
        common_vendor.index.showToast({ title: "请完善必填信息", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "确认提交",
        content: "提交后将无法修改，是否确认？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.__f__("log", "at pages/work-order/create.vue:269", "Submitting:", this.formData);
            common_vendor.index.showLoading({ title: "提交中" });
            setTimeout(() => {
              common_vendor.index.hideLoading();
              common_vendor.index.removeStorageSync("order_draft");
              common_vendor.index.showToast({ title: "提交成功" });
              setTimeout(() => common_vendor.index.navigateBack(), 1500);
            }, 1500);
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.formData.orderNo,
    b: $data.currentUser,
    c: $data.formData.customer.name,
    d: common_vendor.o(($event) => $data.formData.customer.name = $event.detail.value),
    e: $data.formData.customer.phone,
    f: common_vendor.o(($event) => $data.formData.customer.phone = $event.detail.value),
    g: $data.formData.customer.address,
    h: common_vendor.o(($event) => $data.formData.customer.address = $event.detail.value),
    i: $data.formData.customer.usageType === "自用",
    j: $data.formData.customer.usageType === "作业",
    k: common_vendor.o((...args) => $options.onUsageChange && $options.onUsageChange(...args)),
    l: $data.formData.customer.distributorName,
    m: common_vendor.o(($event) => $data.formData.customer.distributorName = $event.detail.value),
    n: $data.formData.product.machineNo,
    o: common_vendor.o(($event) => $data.formData.product.machineNo = $event.detail.value),
    p: $data.formData.product.engineNo,
    q: common_vendor.o(($event) => $data.formData.product.engineNo = $event.detail.value),
    r: common_vendor.t($data.formData.product.productionDate || "请选择日期"),
    s: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    t: $data.formData.product.platePhoto
  }, $data.formData.product.platePhoto ? {
    v: $data.formData.product.platePhoto
  } : {}, {
    w: common_vendor.o(($event) => $options.chooseImage("plate")),
    x: $data.formData.product.model,
    y: common_vendor.o(($event) => $data.formData.product.model = $event.detail.value),
    z: common_vendor.t($data.formData.service.type || "请选择类型"),
    A: $data.serviceTypes,
    B: common_vendor.o((...args) => $options.onServiceTypeChange && $options.onServiceTypeChange(...args)),
    C: common_vendor.t($data.formData.service.faultCategory || "请选择分类"),
    D: $data.faultCategories,
    E: common_vendor.o((...args) => $options.onFaultCatChange && $options.onFaultCatChange(...args)),
    F: $data.formData.service.faultDesc,
    G: common_vendor.o(($event) => $data.formData.service.faultDesc = $event.detail.value),
    H: $data.formData.service.handleDesc,
    I: common_vendor.o(($event) => $data.formData.service.handleDesc = $event.detail.value),
    J: common_vendor.o((...args) => $options.addPart && $options.addPart(...args)),
    K: common_vendor.f($data.formData.service.parts, (part, idx, i0) => {
      return {
        a: part.name,
        b: common_vendor.o(($event) => part.name = $event.detail.value, idx),
        c: part.count,
        d: common_vendor.o(($event) => part.count = $event.detail.value, idx),
        e: idx
      };
    }),
    L: common_vendor.o(($event) => $options.chooseImage("site")),
    M: common_vendor.f($data.formData.service.sitePhotos, (img, idx, i0) => {
      return {
        a: idx,
        b: img
      };
    }),
    N: $data.formData.confirm.machineUserPhoto
  }, $data.formData.confirm.machineUserPhoto ? {
    O: $data.formData.confirm.machineUserPhoto
  } : {}, {
    P: common_vendor.o(($event) => $options.chooseImage("confirm")),
    Q: common_vendor.o((...args) => $options.submitOrder && $options.submitOrder(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/work-order/create.js.map
