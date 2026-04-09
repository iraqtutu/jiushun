<template>
	<view class="container">
		<!-- Search/Filter Header -->
		<view class="filter-header">
			<view class="filter-toggle" @click="showFilter = !showFilter">
				<text>🔍 {{ (isAdmin || isDataAnalyst) ? '高级查询' : '日期筛选' }}</text>
				<text>{{ showFilter ? '▲' : '▼' }}</text>
			</view>

			<view v-if="showFilter" class="filter-panel">
				<view class="filter-row">
					<text class="label">日期范围:</text>
					<view class="date-picker-group">
						<picker mode="date" :value="filter.startDate" @change="bindStartDateChange">
							<view class="picker-input">{{ filter.startDate || '开始日期' }}</view>
						</picker>
						<text class="separator">-</text>
						<picker mode="date" :value="filter.endDate" @change="bindEndDateChange">
							<view class="picker-input">{{ filter.endDate || '结束日期' }}</view>
						</picker>
					</view>
				</view>
				<view class="filter-row" v-if="isAdmin || isDataAnalyst">
					<input class="input" v-model="filter.customerName" placeholder="客户姓名" />
					<input class="input" v-model="filter.customerPhone" placeholder="客户手机号" />
				</view>
				<view class="filter-row" v-if="isAdmin || isDataAnalyst">
					<input class="input" v-model="filter.reporterName" placeholder="报单人姓名" />
					<input class="input" v-model="filter.productModel" placeholder="产品型号" />
				</view>
				<view class="filter-actions">
					<button class="btn reset" size="mini" @click="resetFilter">重置</button>
					<button class="btn search" size="mini" type="primary" @click="doSearch">查询</button>
				</view>
			</view>
		</view>

		<view class="order-list">
			<view class="order-item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
				<view class="order-header">
					<text class="order-no">{{ item.orderNo }}</text>
					<text class="status-tag">已提交</text>
				</view>
				<view class="order-content">
					<view class="row"><text class="label">客户姓名：</text>{{ item.customerName }}</view>
					<view class="row"><text class="label">服务类型：</text>{{ item.serviceType }}</view>
					<view class="row"><text class="label">机器编号：</text>{{ item.machineNo }}</view>
					<view class="row"><text class="label">提交时间：</text>{{ item.submitTime }}</view>
					<view class="row" v-if="(isAdmin || isDataAnalyst) && item.reporterName"><text class="label">报单人：</text>{{ item.reporterName }}</view>
				</view>
			</view>
		</view>

		<!-- Loading Status -->
		<view class="load-status" v-if="list.length > 0">
			<text v-if="isLoadingMore">正在加载...</text>
			<text v-else-if="!hasMore">—— 已展示全部服务单 ——</text>
			<text v-else>上滑加载更多</text>
		</view>

		<view v-if="list.length === 0 && !isLoading" class="empty-state">
			<text>暂无服务单记录</text>
		</view>

		<!-- Floating Export Button -->
		<view class="fab-export" v-if="(isAdmin || isDataAnalyst) && list.length > 0" @click.stop="exportData">
			<text class="icon">📥</text>
			<text class="text">导出汇总</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				isLoading: false,
				isLoadingMore: false,
				showFilter: false,
				isAdmin: false,
				isDataAnalyst: false,
				page: 1,
				pageSize: 10,
				total: 0,
				hasMore: true,
				filter: {
					startDate: '',
					endDate: '',
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				}
			}
		},
		onShow() {
			this.checkRole();
			// Initialize dates if empty
			if (!this.filter.startDate) {
				this.resetFilter(); // Sets default dates and loads data
			} else {
				this.doSearch();
			}
		},
		onReachBottom() {
			if (this.hasMore && !this.isLoadingMore) {
				this.page++;
				this.loadData(true);
			}
		},
		methods: {
			checkRole() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.role) {
					this.isAdmin = userInfo.role.includes('admin');
					this.isDataAnalyst = userInfo.role.includes('数据分析员');
				} else {
					this.isAdmin = false;
					this.isDataAnalyst = false;
				}

				uni.setNavigationBarTitle({
					title: (this.isAdmin || this.isDataAnalyst) ? '服务单查询' : '我的服务单'
				});
			},
			bindStartDateChange(e) {
				this.filter.startDate = e.detail.value;
			},
			bindEndDateChange(e) {
				this.filter.endDate = e.detail.value;
			},
			resetFilter() {
				const end = new Date();
				const start = new Date();
				start.setMonth(start.getMonth() - 1);

				this.filter = {
					startDate: this.formatDateSimple(start),
					endDate: this.formatDateSimple(end),
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				};
				this.doSearch();
			},
			doSearch() {
				this.page = 1;
				this.hasMore = true;
				this.list = [];
				this.loadData(false);
			},
			loadData(isAppend = false) {
				if (isAppend) this.isLoadingMore = true;
				else this.isLoading = true;

				// Prepare params
				const params = {
					page: this.page,
					pageSize: this.pageSize
				};
				if (this.filter.startDate) {
					params.startDate = new Date(this.filter.startDate + 'T00:00:00').getTime();
				}
				if (this.filter.endDate) {
					params.endDate = new Date(this.filter.endDate + 'T23:59:59').getTime();
				}

				// Only add advanced filters if Admin or Data Analyst
				if (this.isAdmin || this.isDataAnalyst) {
					if (this.filter.customerName) params.customerName = this.filter.customerName;
					if (this.filter.customerPhone) params.customerPhone = this.filter.customerPhone;
					if (this.filter.reporterName) params.reporterName = this.filter.reporterName;
					if (this.filter.productModel) params.productModel = this.filter.productModel;
				}

				uniCloud.callFunction({
					name: 'work-order-manager',
					data: {
						action: 'list',
						uniIdToken: uni.getStorageSync('uni_id_token'),
						params: params
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.total = res.result.total || 0;

							// Transform data for display and export
							const newList = res.result.data.map(item => {
								const c = item.customer || {};
								const p = item.product || {};
								const s = item.service || {};
								const faultItems = s.faultItems || [];

								// 1. Aggregate Fault Categories, Descs, and Handles
								const descs = faultItems.map(f => f.faultDesc).filter(v => v).join('\n');
								const handles = faultItems.map(f => `【${f.category}】${f.handleDesc}`).filter(v => v).join('\n');

								// 2. Aggregate Parts Info
								let allParts = [];
								let partsTotal = 0;
								faultItems.forEach(f => {
									(f.parts || []).forEach(pt => {
										let str = `[${f.category}] ${pt.name}(${pt.code})x${pt.count} 旧件:${pt.oldPartAction || '带回'} 来源:${pt.source || '自带'}`;
										if (pt.sourceRemark) str += `(${pt.sourceRemark})`;
										if (s.isChargeable === '收费') {
											const price = Number(pt.price) || 0;
											const count = Number(pt.count) || 0;
											const subtotal = Number(pt.total) || (price * count);
											str += ` 单价:${price} 小计:${subtotal.toFixed(1)}`;
											partsTotal += subtotal;
										} else {
											partsTotal += (Number(pt.total) || 0);
										}
										allParts.push(str);
									});
								});
								const partsStr = allParts.join('\n');

								// 3. Aggregate Site Photos
								let sitePhotos = [];
								faultItems.forEach(f => {
									if (f.sitePhotos && f.sitePhotos.length > 0) {
										sitePhotos = sitePhotos.concat(f.sitePhotos);
									}
								});

								const af = item.additionalFees || {};
								const isChargeable = s.isChargeable || '免费';
								const travelFeeTotal = af.travelFee?.total || 0;
								const laborFeeTotal = af.laborFee?.total || 0;
								const grandTotal = af.totalAmount ? (Number(af.totalAmount) + partsTotal) : partsTotal;

								return {
									id: item._id,
									orderNo: item.orderNo,
									reporterName: item.reporterName || '未知',
									submitTime: this.formatDate(item.create_date),

									// Customer
									distributorName: c.distributorName || '-',
									customerName: c.name || '未知',
									customerPhone: c.phone || '-',
									customerAddress: c.address || '-',
									usageType: c.usageType || '-',
									reportTime: this.formatDate(c.reportTime),

									// Product
									productModel: p.model || '-',
									machineNo: p.machineNo || '-',
									engineNo: p.engineNo || '-',
									productionDate: this.formatDateSimple(new Date(p.productionDate)),
									workHours: p.workHours || '',

									// Service
									serviceType: s.type || '未知',
									isChargeable: isChargeable,
									paymentMethod: s.paymentMethod || '-',
									partsTotal: partsTotal.toFixed(1),
									travelFeeTotal: travelFeeTotal.toFixed(1),
									laborFeeTotal: laborFeeTotal.toFixed(1),
									grandTotal: grandTotal.toFixed(1),
									faultDesc: descs || '-',
									handleDesc: handles || '-',
									partsInfo: partsStr || '无',
									finishTime: this.formatDate(s.finishTime),

									// New fields for complete export
									travelDistance: af.travelFee?.distance || 0,
									repairDuration: af.laborFee?.repairDuration || 0,

									// Image IDs for export
									platePhoto: p.platePhoto,
									sitePhotos: sitePhotos,
									machineUserPhoto: item.customerConfirm?.machineUserPhoto
								};
							});

							if (isAppend) {
								this.list = this.list.concat(newList);
							} else {
								this.list = newList;
							}

							this.hasMore = this.list.length < this.total;
						} else {
							uni.showToast({ title: '加载失败', icon: 'none' });
						}
					},
					fail: (err) => {
						console.error(err);
						uni.showToast({ title: '网络错误', icon: 'none' });
					},
					complete: () => {
						this.isLoading = false;
						this.isLoadingMore = false;
					}
				});
			},
			async exportData() {
				if (this.list.length === 0) return;
				await this.exportViaCloudFunction();
			},
			async exportViaCloudFunction() {
				uni.showLoading({ title: '正在导出...' });

				try {
					const res = await uniCloud.callFunction({
						name: 'work-order-manager',
						data: {
							action: 'export',
							params: {
								startDate: this.filter.startDate ? new Date(this.filter.startDate).getTime() : null,
								endDate: this.filter.endDate ? new Date(this.filter.endDate).getTime() + 86400000 - 1 : null,
								customerName: this.filter.customerName,
								customerPhone: this.filter.customerPhone,
								reporterName: this.filter.reporterName,
								productModel: this.filter.productModel
							},
							uniIdToken: uni.getStorageSync('uni_id_token')
						}
					});

					if (res.result.code !== 0) {
						uni.hideLoading();
						uni.showToast({ title: res.result.msg || '导出失败', icon: 'none' });
						return;
					}

					const data = res.result.data || [];

					// Generate Excel from cloud data
					await this.generateExcelFromData(data);

					uni.hideLoading();
				} catch (e) {
					uni.hideLoading();
					uni.showToast({ title: '导出失败', icon: 'none' });
					console.error('Export error:', e);
				}
			},
			async generateExcelFromData(data, urlMap = {}) {
				// Helper to escape XML special characters
				const escapeXml = (str) => {
					if (!str) return '';
					return String(str)
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&apos;');
				};

				// Helper to format date
				const formatDate = (ts) => {
					if (!ts) return '-';
					const d = new Date(ts);
					return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
				};

				// Excel 2003 XML Template Header
				let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="服务单汇总">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">服务单号</Data></Cell>
    <Cell><Data ss:Type="String">报单人</Data></Cell>
    <Cell><Data ss:Type="String">提交时间</Data></Cell>
    <Cell><Data ss:Type="String">经销商名称</Data></Cell>
    <Cell><Data ss:Type="String">客户姓名</Data></Cell>
    <Cell><Data ss:Type="String">客户电话</Data></Cell>
    <Cell><Data ss:Type="String">客户地址</Data></Cell>
    <Cell><Data ss:Type="String">农机用途</Data></Cell>
    <Cell><Data ss:Type="String">报修时间</Data></Cell>
    <Cell><Data ss:Type="String">产品型号</Data></Cell>
    <Cell><Data ss:Type="String">机器编号</Data></Cell>
    <Cell><Data ss:Type="String">发动机号</Data></Cell>
    <Cell><Data ss:Type="String">生产日期</Data></Cell>
    <Cell><Data ss:Type="String">工作时长(小时)</Data></Cell>
    <Cell><Data ss:Type="String">服务类型</Data></Cell>
    <Cell><Data ss:Type="String">是否收费</Data></Cell>
    <Cell><Data ss:Type="String">故障现象</Data></Cell>
    <Cell><Data ss:Type="String">处理方法</Data></Cell>
    <Cell><Data ss:Type="String">更换零件</Data></Cell>
    <Cell><Data ss:Type="String">里程(km)</Data></Cell>
    <Cell><Data ss:Type="String">维修用时(min)</Data></Cell>
    <Cell><Data ss:Type="String">维修完成时间</Data></Cell>
    <Cell><Data ss:Type="String">零件费</Data></Cell>
    <Cell><Data ss:Type="String">路程费</Data></Cell>
    <Cell><Data ss:Type="String">工时费</Data></Cell>
    <Cell><Data ss:Type="String">总应收(元)</Data></Cell>
    <Cell><Data ss:Type="String">支付方式</Data></Cell>
    <Cell><Data ss:Type="String">铭牌照片</Data></Cell>
    <Cell><Data ss:Type="String">现场照片</Data></Cell>
    <Cell><Data ss:Type="String">人机合影</Data></Cell>
   </Row>`;

				// Rows
				data.forEach(item => {
					// 直接使用后端返回的HTTP图片地址
					const plateUrl = item.platePhoto || '';
					const confirmUrl = item.machineUserPhoto || '';
					const siteUrls = (item.sitePhotos || []).filter(u => u).join(' ; ');

					xmlContent += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(item.orderNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.reporterName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatDate(item.create_date))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.distributorName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customer ? item.customer.name : item.customerName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customer ? item.customer.phone : item.customerPhone)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customer ? item.customer.address : item.customerAddress)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.usageType)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.reportTime)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.product ? item.product.model : item.productModel)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.machineNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.engineNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.productionDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.product ? item.product.workHours : (item.workHours || '-'))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.serviceType)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.isChargeable)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.faultDesc)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.handleDesc)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.partsInfo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.travelDistance)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.repairDuration)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.finishTime)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.partsTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.travelFeeTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.laborFeeTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.grandTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.paymentMethod)}</Data></Cell>
    <Cell ${plateUrl ? 'ss:Formula="=IMAGE(&quot;' + plateUrl + '&quot;)"' : ''}><Data ${plateUrl ? 'ss:Type="Error"' : 'ss:Type="String"'}>${plateUrl ? '#VALUE!' : '-'}</Data></Cell>
    <Cell ${siteUrls ? 'ss:Formula="=IMAGE(&quot;' + siteUrls.split(' ; ')[0] + '&quot;)"' : ''}><Data ${siteUrls ? 'ss:Type="Error"' : 'ss:Type="String"'}>${siteUrls ? '#VALUE!' : '-'}</Data></Cell>
    <Cell ${confirmUrl ? 'ss:Formula="=IMAGE(&quot;' + confirmUrl + '&quot;)"' : ''}><Data ${confirmUrl ? 'ss:Type="Error"' : 'ss:Type="String"'}>${confirmUrl ? '#VALUE!' : '-'}</Data></Cell>
   </Row>`;
				});

				// Footer
				xmlContent += `
  </Table>
 </Worksheet>
</Workbook>`;

				// Use FileSystemManager to save file
				const fs = uni.getFileSystemManager();
				const fileName = `服务单汇总_${this.formatDateSimple(new Date())}.xls`;
				const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

				fs.writeFile({
					filePath: filePath,
					data: xmlContent,
					encoding: 'utf8',
					success: () => {
						uni.openDocument({
							filePath: filePath,
							fileType: 'xls',
							showMenu: true,
							success: function () {
								console.log('打开文档成功');
							},
							fail: function (e) {
								console.error(e);
								uni.showToast({ title: '打开文档失败', icon: 'none' });
							}
						});
					},
					fail: (err) => {
						console.error(err);
						uni.showToast({ title: '导出失败', icon: 'none' });
					}
				});
			},
			formatDateSimple(date) {
				const y = date.getFullYear();
				const m = (date.getMonth() + 1).toString().padStart(2, '0');
				const d = date.getDate().toString().padStart(2, '0');
				return `${y}-${m}-${d}`;
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const h = d.getHours().toString().padStart(2, '0');
				const min = d.getMinutes().toString().padStart(2, '0');
				return `${y}-${m}-${date} ${h}:${min}`;
			},
			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/work-order/detail?id=${item.id}`
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 80px; /* Space for FAB */
	}

	.fab-export {
		position: fixed;
		bottom: 30px;
		right: 20px;
		background-color: #007aff;
		color: #fff;
		border-radius: 50px;
		padding: 10px 20px;
		display: flex;
		align-items: center;
		box-shadow: 0 4px 10px rgba(0,0,0,0.3);
		z-index: 100;

		.icon {
			margin-right: 5px;
			font-size: 18px;
		}

		.text {
			font-size: 14px;
			font-weight: bold;
		}

		&:active {
			opacity: 0.9;
			transform: scale(0.98);
		}
	}

	.filter-header {
		background: #fff;
		border-radius: 8px;
		padding: 10px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);

		.filter-toggle {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-weight: bold;
			color: #333;
		}

		.filter-panel {
			margin-top: 15px;
			border-top: 1px solid #eee;
			padding-top: 10px;

			.filter-row {
				display: flex;
				align-items: center;
				margin-bottom: 10px;
				gap: 10px;

				.label {
					font-size: 14px;
					color: #666;
					width: 70px;
				}

				.input {
					flex: 1;
					border: 1px solid #ddd;
					border-radius: 4px;
					padding: 6px 10px;
					font-size: 14px;
				}

				.date-picker-group {
					flex: 1;
					display: flex;
					align-items: center;

					.picker-input {
						border: 1px solid #ddd;
						border-radius: 4px;
						padding: 6px 10px;
						font-size: 14px;
						min-width: 90px;
						text-align: center;
					}

					.separator {
						margin: 0 5px;
						color: #999;
					}
				}
			}

			.filter-actions {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 10px;

				.btn {
					margin: 0;
				}
			}
		}
	}

	.order-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.order-item {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);

		.order-header {
			display: flex;
			justify-content: space-between;
			border-bottom: 1px solid #eee;
			padding-bottom: 10px;
			margin-bottom: 10px;

			.order-no {
				font-weight: bold;
				color: #333;
			}

			.status-tag {
				font-size: 12px;
				color: #4caf50;
				background: #e8f5e9;
				padding: 2px 6px;
				border-radius: 4px;
			}
		}

		.order-content {
			.row {
				font-size: 14px;
				color: #666;
				margin-bottom: 5px;

				.label {
					color: #999;
					margin-right: 5px;
				}
			}
		}
	}

	.load-status {
		padding: 20px 0;
		text-align: center;
		color: #999;
		font-size: 13px;
	}

	.empty-state {
		text-align: center;
		margin-top: 50px;
		color: #999;
	}
</style>
